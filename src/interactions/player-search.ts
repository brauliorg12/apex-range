import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import { getPlayerData } from '../utils/player-data-manager';
import { createPlayerPaginationEmbed } from '../utils/player-pagination-helper';
import { MAX_PLAYERS_PER_PAGE } from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';
import { logApp } from '../utils/logger';

const MIN_QUERY_LENGTH = 3;

// Caché en memoria para mapear messageId -> { query, timeout }
// Se usa para recuperar la query cuando el usuario navega páginas usando botones
const SEARCH_QUERY_BY_MESSAGE_ID: Map<
  string,
  { query: string; timeout: ReturnType<typeof setTimeout> }
> = new Map();

// Tiempo de vida de la entrada en ms (10 minutos)
const QUERY_CACHE_TTL = 10 * 60 * 1000;

function storeQueryForMessage(messageId: string, query: string) {
  // Si ya existía, limpiar el timeout anterior
  const existing = SEARCH_QUERY_BY_MESSAGE_ID.get(messageId);
  if (existing) clearTimeout(existing.timeout);

  const timeout = setTimeout(() => {
    SEARCH_QUERY_BY_MESSAGE_ID.delete(messageId);
  }, QUERY_CACHE_TTL);

  SEARCH_QUERY_BY_MESSAGE_ID.set(messageId, { query, timeout });
  // Log para depuración: almacenar query
  try {
    void logApp(
      `[player-search] Cached query for message ${messageId}: ${query}`
    );
  } catch {
    /* ignore */
  }
}

function deleteQueryForMessage(messageId: string) {
  const existing = SEARCH_QUERY_BY_MESSAGE_ID.get(messageId);
  if (existing) {
    clearTimeout(existing.timeout);
    SEARCH_QUERY_BY_MESSAGE_ID.delete(messageId);
  }
}

/** Abre un modal para que el usuario escriba el nombre a buscar (mínimo 3 caracteres) */
export async function handleOpenPlayerSearchModal(
  interaction: ButtonInteraction
) {
  try {
    // Log context antes de intentar abrir el modal para diagnosticar fallos en producción
    await logApp(
      `[player-search] Intentando abrir modal. user=${interaction.user.id} guild=${interaction.guild?.id} channel=${interaction.channel?.id} message=${interaction.message?.id} customId=${interaction.customId}`
    );
    const modal = new ModalBuilder()
      .setCustomId('player_search_modal')
      .setTitle('Buscar Jugador');

    const input = new TextInputBuilder()
      .setCustomId('player_search_query')
      .setLabel('Nombre (mín. 3 caracteres)')
      .setStyle(TextInputStyle.Short)
      .setMinLength(MIN_QUERY_LENGTH)
      .setPlaceholder('Escribe al menos 3 caracteres')
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);

    modal.addComponents(row);
    // Intentar mostrar el modal y loguear inmediatamente antes/después
    await logApp(`[player-search] Llamando interaction.showModal()`);
    await interaction.showModal(modal);
    await logApp(
      `[player-search] showModal invoked successfully for user=${interaction.user.id}`
    );
  } catch (error) {
    // Registrar stack trace completo para poder diagnosticar el error
    const stack = (error && (error as any).stack) || String(error);
    await logApp(`[player-search] Error abriendo modal: ${stack}`);
    // Intentar dar feedback útil al usuario
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            'No se pudo abrir el modal de búsqueda. Intenta usar el panel de gestión directamente o ejecuta `/setup-roles` para recrear el panel si fue modificado.',
          ephemeral: true,
        });
      }
    } catch (replyError) {
      const replyStack =
        (replyError && (replyError as any).stack) || String(replyError);
      await logApp(
        `[player-search] Error respondiendo al usuario tras fallo de modal: ${replyStack}`
      );
    }
  }
}

/** Procesa el modal o navegación de páginas para mostrar resultados de búsqueda */
export async function handlePlayerSearchResults(
  interaction: ModalSubmitInteraction | ButtonInteraction,
  query?: string,
  page: number = 1
) {
  try {
    // Determinar si es navegación de páginas (prev/next) o una sumisión de modal
    let isPageNavigation = false;
    if (!(interaction as ModalSubmitInteraction).fields) {
      const bi = interaction as ButtonInteraction;
      isPageNavigation =
        bi.customId.startsWith('player_search_prev_') ||
        bi.customId.startsWith('player_search_next_');
    }

    // Si la llamada viene desde un ModalSubmitInteraction, extraer la query
    if ((interaction as ModalSubmitInteraction).fields) {
      const modal = interaction as ModalSubmitInteraction;
      await modal.deferReply({ ephemeral: true });
      query = modal.fields.getTextInputValue('player_search_query');
    } else if (isPageNavigation) {
      // Si viene de ButtonInteraction y es navegación de página, deferir update para ACK
      const bi = interaction as ButtonInteraction;
      await bi.deferUpdate();

      // Primero intentar recuperar la query desde la caché por message.id
      try {
        const messageId = (bi.message as any)?.id as string | undefined;
        if (messageId) {
          const cached = SEARCH_QUERY_BY_MESSAGE_ID.get(messageId);
          if (cached) {
            query = cached.query;
            try {
              void logApp(
                `[player-search] Recovered cached query for message ${messageId}`
              );
            } catch {}
          }
        }
      } catch (err) {
        // Ignorar errores de acceso
      }

      // Si no está en caché, intentar extraer la query desde el embed del mensaje actual (título)
      // Formato esperado: 'Resultados de búsqueda: <query>' (establecido cuando se creó el embed)
      if (!query) {
        try {
          const message = bi.message as any;
          const embed = message?.embeds?.[0];
          const title = embed?.title as string | undefined;
          if (title) {
            const m = title.match(/^Resultados de búsqueda:\s*(.+)$/i);
            if (m) {
              query = m[1].trim();
            }
          }
        } catch (err) {
          // No bloquear: si no se puede extraer la query, se tratará más abajo
        }
      }
    }

    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
      const replyTarget = interaction as ModalSubmitInteraction;
      if (replyTarget.fields) {
        await replyTarget.editReply({
          content: `La búsqueda debe tener al menos ${MIN_QUERY_LENGTH} caracteres.`,
          components: [createCloseButtonRow()],
        });
      }
      return;
    }

    const guild = interaction.guild;
    if (!guild) return;

    await logApp(`[player-search] Buscando '${query}' en guild ${guild.id}`);

    // Cargar playerData para buscar por nombre de usuario (no solo por ID)
    const playerData = await getPlayerData(guild);

    // Primer intento: buscar coincidencias por displayName en caché
    const cacheMatches = guild.members.cache.filter((m) =>
      m.displayName.toLowerCase().includes(query!.toLowerCase())
    );

    // Segundo: buscar en playerData userId y en rank DB si es necesario
    const dataMatches = playerData.filter((p) => {
      // No tenemos el nombre en playerData, solo userId; intentar resolver member
      const member = guild.members.cache.get(p.userId);
      if (member) {
        return member.displayName.toLowerCase().includes(query!.toLowerCase());
      }
      return false;
    });

    // Unir resultados (evitar duplicados) y convertir a array de GuildMember
    const membersMap = new Map<string, any>();
    cacheMatches.forEach((m) => membersMap.set(m.id, m));
    dataMatches.forEach((p) => {
      const m = guild.members.cache.get(p.userId);
      if (m) membersMap.set(m.id, m);
    });

    const members = Array.from(membersMap.values());

    if (members.length === 0) {
      // Responder con mensaje de no encontrados
      if ((interaction as ModalSubmitInteraction).fields) {
        await (interaction as ModalSubmitInteraction).editReply({
          content: `No se encontraron resultados para **${query}**.`,
          components: [createCloseButtonRow()],
        });
      } else {
        // Para consistencia con el resto de paginaciones, usar editReply tras deferUpdate
        await (interaction as ButtonInteraction).editReply({
          content: `No se encontraron resultados para **${query}**.`,
          embeds: [],
          components: [createCloseButtonRow()],
        });
      }
      return;
    }

    // Usar helper de paginación para mostrar resultados
    const assignedDates = new Map(
      playerData.map((p) => [p.userId, p.assignedAt])
    );

    const ranksByUser = new Map();

    const paginationResult = await createPlayerPaginationEmbed(guild, {
      members,
      page,
      playersPerPage: MAX_PLAYERS_PER_PAGE,
      buttonIdPrefix: 'player_search',
      color: '#2ecc71',
      title: `Resultados de búsqueda: ${query}`,
      showNumbers: true,
      showPresence: true,
      showPlatform: true,
      showRoles: false,
      assignedDates,
      showDates: true,
      ranksByUser,
      showRankEmoji: false,
      useDisplayName: true,
    });

    if ((interaction as ModalSubmitInteraction).fields) {
      await (interaction as ModalSubmitInteraction).editReply({
        embeds: [paginationResult.embed],
        components: paginationResult.components,
      });

      // Guardar la query en la caché asociada al mensaje enviado para soportar paginado
      try {
        const sent = (await (
          interaction as ModalSubmitInteraction
        ).fetchReply()) as any;
        if (sent && sent.id) {
          storeQueryForMessage(sent.id, query!);
        }
      } catch {
        // Ignorar fallos de fetchReply
      }
    } else {
      // Para consistencia con player-list y demás paginaciones, usar editReply tras deferUpdate
      await (interaction as ButtonInteraction).editReply({
        embeds: [paginationResult.embed],
        components: paginationResult.components,
      });

      // Guardar la query en la caché asociada al mensaje (obtenido tras el editReply)
      try {
        const sent = (await (
          interaction as ButtonInteraction
        ).fetchReply()) as any;
        if (sent && sent.id) {
          storeQueryForMessage(sent.id, query!);
        }
      } catch {
        // Ignorar fallos de fetchReply
      }
    }
  } catch (error) {
    const stack = (error && (error as any).stack) || String(error);
    await logApp(`[player-search] Error procesando búsqueda: ${stack}`);
    try {
      if ((interaction as ModalSubmitInteraction).fields) {
        await (interaction as ModalSubmitInteraction).editReply({
          content: 'Error al procesar la búsqueda.',
          components: [createCloseButtonRow()],
        });
      } else {
        if (!interaction.replied && !interaction.deferred) {
          await (interaction as ButtonInteraction).reply({
            content: 'Error al procesar la navegación de la búsqueda.',
            ephemeral: true,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }
}

export default {};
