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
    // Si la llamada viene desde un ModalSubmitInteraction, extraer la query
    if ((interaction as ModalSubmitInteraction).fields) {
      const modal = interaction as ModalSubmitInteraction;
      await modal.deferReply({ ephemeral: true });
      query = modal.fields.getTextInputValue('player_search_query');
    } else {
      // Si viene de ButtonInteraction (navegación), ya se pasó query opcionalmente
      await (interaction as ButtonInteraction).deferUpdate();
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
        await (interaction as ButtonInteraction).followUp({
          content: `No se encontraron resultados para **${query}**.`,
          ephemeral: true,
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
    } else {
      // ButtonInteraction: editar mensaje original
      await (interaction as ButtonInteraction).editReply({
        embeds: [paginationResult.embed],
        components: paginationResult.components,
      });
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
