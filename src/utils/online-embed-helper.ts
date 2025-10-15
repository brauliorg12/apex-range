import {
  Guild,
  AttachmentBuilder,
  Role,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GuildMember,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';
import { renderRankCardCanvas } from './rank-card-canvas';
import { getRankEmoji } from './emoji-helper';
import { createCloseButtonRow } from './button-helper';
import { buildOnlineEmbedForRank } from './build-online-embed-rank';
import { createPlayerPaginationEmbed } from './player-pagination-helper';
import { sortMembersByPriority } from './build-all-online-embed';

/**
 * Crea una fila con el botón "Ver más jugadores" solo si hay más jugadores que el máximo por card.
 * Esta función se usa en los mensajes persistentes del canal público.
 */
export function createSeeMoreButtonRow(
  rank: (typeof APEX_RANKS)[number],
  totalCount: number,
  maxPerCard: number,
  client: Client
) {
  if (totalCount > maxPerCard) {
    const rankEmoji = getRankEmoji(client, rank) || '🎯';
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`rank_${rank.shortId}_vermas`)
          .setLabel('Ver más')
          .setEmoji(rankEmoji)
          .setStyle(ButtonStyle.Secondary)
      ),
    ];
  }
  return [];
}

/**
 * Crea los botones de paginación para un rango (servidores pequeños).
 */
export function createPaginationButtons(
  rankId: string,
  currentPage: number,
  totalPages: number
) {
  if (totalPages <= 1) return [createCloseButtonRow()]; // Solo botón cerrar si no hay paginación

  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`rank_${rankId}_prev_${currentPage}`)
      .setLabel('⬅️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId(`rank_${rankId}_next_${currentPage}`)
      .setLabel('Siguiente ➡️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages),
    // Boton Cerrar
    ...createCloseButtonRow().components
  );
  return [row];
}

/**
 * Genera el embed, archivos y botones para una página específica de jugadores por rango.
 * Solo retorna un embed por card, respetando el máximo por parámetro.
 *
 * - Servidores pequeños (<1000 jugadores): Usa caché de Discord para verificar roles reales
 * - Servidores grandes (>=1000 jugadores): Usa playerData con proxies para mejor rendimiento
 */
export async function getRankPageEmbed(
  guild: Guild,
  rankId: string,
  page: number,
  maxPerCard: number,
  showNumbers: boolean = true
) {
  const { getPlayerData } = await import('./player-data-manager');
  const { logApp } = await import('./logger');
  const playerData = await getPlayerData(guild);

  // LOG: Información inicial
  await logApp(
    `[getRankPageEmbed] Guild: ${guild.name} (${guild.id}) | RankId: ${rankId} | PlayerData: ${playerData.length} registros`
  );

  const rank = APEX_RANKS.find((r) => r.shortId === rankId);
  if (!rank) {
    await logApp(
      `[getRankPageEmbed] ❌ Rank no encontrado con shortId: ${rankId}`
    );
    return null;
  }

  await logApp(
    `[getRankPageEmbed] ✅ Rank encontrado: ${rank.label} (${rank.roleName})`
  );

  // Buscar el rol usando mapeo del servidor o aliases
  const { getApexRanksForGuild } = await import(
    '../helpers/get-apex-ranks-for-guild'
  );
  const serverRanks = getApexRanksForGuild(guild.id, guild);
  const serverRankInfo = serverRanks.find((r: any) => r.shortId === rankId);
  const roleNameToFind = serverRankInfo
    ? serverRankInfo.roleName
    : rank.roleName;

  const role: Role | undefined = guild.roles.cache.find(
    (r): r is Role => r.name === roleNameToFind
  );

  if (!role) {
    await logApp(
      `[getRankPageEmbed] ❌ Rol no encontrado en el servidor: ${roleNameToFind} (buscado para shortId: ${rankId})`
    );
    return null;
  }

  await logApp(
    `[getRankPageEmbed] ✅ Rol encontrado: ${role.name} (${role.id})`
  );

  // Detectar si es servidor grande (igual que en player-list.ts)
  const isLargeServer = playerData.length >= 1000;

  await logApp(
    `[getRankPageEmbed] Servidor ${
      isLargeServer ? 'GRANDE' : 'PEQUEÑO'
    } detectado (${playerData.length} jugadores registrados)`
  );

  // Obtener miembros según el tamaño del servidor
  const { getAllMembersByRole, getAllMembersByRoleWithProxies } = await import(
    './build-all-online-embed'
  );
  const allMembers = isLargeServer
    ? getAllMembersByRoleWithProxies(guild, role, playerData) // Servidores grandes: usa proxies
    : getAllMembersByRole(guild, role, playerData); // Servidores pequeños: verifica caché real

  // Si no hay miembros en playerData, retornar null
  if (!allMembers || allMembers.length === 0) {
    await logApp(
      `[getRankPageEmbed] ❌ NO HAY MIEMBROS con el rango ${rank.roleName}. ` +
        `Esto indica que playerData no tiene jugadores con rank='${rankId}'. ` +
        `Verifica que la sincronización se haya ejecutado y que el archivo JSON tenga datos.`
    );
    return null;
  }

  await logApp(
    `[getRankPageEmbed] ✅ Se encontraron ${allMembers.length} miembros con el rango ${rank.roleName}`
  );

  const sortedMembers = sortMembersByPriority(allMembers, playerData);

  const totalPages = Math.ceil(sortedMembers.length / maxPerCard);
  const pageNum = Math.max(1, Math.min(page, totalPages));
  const pageMembers = sortedMembers.slice(
    (pageNum - 1) * maxPerCard,
    pageNum * maxPerCard
  );

  // Obtener URL del emoji grande
  const emojiMatch =
    typeof rank.id === 'string' && rank.id.match(/^<a?:\w+:(\d+)>$/);
  let emojiUrl = undefined;
  if (emojiMatch) {
    const emojiId = emojiMatch[1];
    emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png?size=96&quality=lossless`;
  }

  let cardUrl = undefined;
  const files: AttachmentBuilder[] = [];
  if (emojiUrl) {
    const cardBuffer = await renderRankCardCanvas(
      emojiUrl,
      rank.color,
      rank.label
    );
    const cardName = `rankcard_${rank.shortId}.png`;
    const cardAttachment = new AttachmentBuilder(cardBuffer, {
      name: cardName,
    });
    files.push(cardAttachment);
    cardUrl = `attachment://${cardName}`;
  }

  // =============================================
  // SERVIDORES PEQUEÑOS: Método original (buildOnlineEmbedForRank)
  // =============================================
  if (!isLargeServer) {
    await logApp(
      `[getRankPageEmbed] � Usando método SIMPLE para servidor pequeño`
    );

    const embed = await buildOnlineEmbedForRank(
      guild,
      rank,
      pageMembers,
      cardUrl,
      sortedMembers.length, // totalCount
      pageNum, // página actual
      maxPerCard, // máximo por página
      showNumbers, // mostrar numeración
      allMembers as GuildMember[] // todos los miembros del rango
    );

    const totalCount = sortedMembers.length;
    const startIdx = (pageNum - 1) * maxPerCard + 1;
    const endIdx = startIdx + pageMembers.length - 1;

    let footerText = `📄 Página ${pageNum} de ${totalPages} | 👥 Mostrando jugadores ${startIdx}-${endIdx} de ${totalCount}`;
    if (totalPages > 1) {
      footerText += '\n👉 Usa los botones para navegar';
    }
    embed.setFooter({ text: footerText });

    const componentsBtns: ActionRowBuilder<ButtonBuilder>[] =
      totalPages > 1
        ? createPaginationButtons(rank.shortId, pageNum, totalPages)
        : [createCloseButtonRow()];

    await logApp(
      `[getRankPageEmbed] ✅ Embed original creado: ${pageMembers.length} jugadores en página ${pageNum}/${totalPages}`
    );

    return {
      embed,
      files,
      components: componentsBtns,
      page: pageNum,
      totalPages,
    };
  }

  // =============================================
  // SERVIDORES GRANDES: Método con paginación avanzada
  // =============================================
  await logApp(
    `[getRankPageEmbed] 🔥 Usando método AVANZADO con emojis para servidor grande`
  );

  // �🔥 FETCH de los miembros de la página actual para resolver menciones
  await logApp(
    `[getRankPageEmbed] 🔄 Haciendo fetch de ${pageMembers.length} miembros para resolver menciones...`
  );
  try {
    // Fetch cada miembro individualmente si no está en caché
    const fetchPromises = pageMembers.map(async (m) => {
      if (!guild.members.cache.has(m.id)) {
        try {
          await guild.members.fetch(m.id);
        } catch {
          // Ignorar errores individuales (usuario pudo haberse ido del servidor)
        }
      }
    });
    await Promise.all(fetchPromises);
    await logApp(
      `[getRankPageEmbed] ✅ Fetch completado. Menciones deberían resolverse correctamente.`
    );
  } catch (fetchError) {
    await logApp(
      `[getRankPageEmbed] ⚠️ Error al hacer fetch de miembros: ${fetchError}`
    );
    // Continuar de todos modos
  }

  // Usar el nuevo helper de paginación
  const paginationResult = await createPlayerPaginationEmbed(guild, {
    members: sortedMembers,
    page: pageNum,
    playersPerPage: maxPerCard,
    buttonIdPrefix: `rank_${rank.shortId}`,
    color: rank.color as any,
    title: '', // Sin título, la descripción incluye el encabezado
    rank: rank,
    imageUrl: cardUrl,
    showNumbers: showNumbers,
    showPresence: true,
    showPlatform: true,
    showRoles: true,
  });

  // Solo retorna el embed, archivos y botones de la página actual
  return {
    embed: paginationResult.embed,
    files,
    components: paginationResult.components,
    page: paginationResult.page,
    totalPages: paginationResult.totalPages,
  };
}
