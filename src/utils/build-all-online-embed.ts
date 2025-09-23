import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  EmbedBuilder,
  Guild,
  GuildMember,
  Role,
} from 'discord.js';
import {
  MAX_PLAYERS_PER_CARD,
  MAX_PLAYERS_PER_PAGE,
} from '../models/constants';
import { renderRankCardCanvas } from './rank-card-canvas';
import { buildOnlineEmbedForRank } from './build-online-embed-rank';
import { createSeeMoreButtonRow } from './online-embed-helper';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';

/**
 * Ordena los miembros por prioridad para mostrar en los paneles:
 * - Estado de presencia: primero online, luego inactivos (idle), luego dnd, luego offline/invisible.
 * - Si el estado es igual, prioriza por fecha de asignación del rango (más reciente primero).
 * - Los miembros sin datos de presencia quedan al final.
 * @param members Array de miembros del servidor.
 * @param playerData Array de datos de jugadores con fecha de asignación.
 * @returns Array de miembros ordenados por prioridad.
 */
type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';

export function sortMembersByPriority(members: any[], playerData: any[]) {
  const assignedMap = new Map<string, Date>();
  playerData.forEach((p: any) => {
    assignedMap.set(p.userId, new Date(p.assignedAt));
  });

  const statusOrder: Record<PresenceStatus, number> = {
    online: 0,
    idle: 1,
    dnd: 2,
    offline: 3,
    invisible: 4,
  };

  // Prioriza primero por status, luego por fecha
  return [...members].sort((a, b) => {
    if (!a.presence && b.presence) return 1;
    if (a.presence && !b.presence) return -1;
    if (!a.presence && !b.presence) return 0;

    const aStatus =
      statusOrder[(a.presence?.status ?? 'offline') as PresenceStatus];
    const bStatus =
      statusOrder[(b.presence?.status ?? 'offline') as PresenceStatus];
    if (aStatus !== bStatus) return aStatus - bStatus;

    const aAssigned = assignedMap.get(a.id)?.getTime() ?? 0;
    const bAssigned = assignedMap.get(b.id)?.getTime() ?? 0;
    return bAssigned - aAssigned;
  });
}

/**
 * Genera todos los embeds y archivos de imagen para mostrar los jugadores por rango.
 * Muestra solo la primera página de jugadores del rango y agrega botones de paginación si hay más de una página.
 */
export async function buildAllOnlineEmbeds(
  guild: Guild,
  maxPerCard = MAX_PLAYERS_PER_CARD
) {
  const embeds: EmbedBuilder[] = [];
  const files: (AttachmentBuilder | null)[] = [];
  const componentsList: ActionRowBuilder<ButtonBuilder>[][] = [];

  const { getPlayerData } = await import('./player-data-manager');
  const playerData = await getPlayerData(guild);

  const ranks = getApexRanksForGuild(guild.id, guild);
  for (const rank of ranks) {
    const role: Role | undefined = guild.roles.cache.find(
      (r): r is Role => r.name === rank.roleName
    );
    if (!role) continue;

    const allMembers = getAllMembersByRole(guild, role, playerData);
    const sortedMembers = sortMembersByPriority(allMembers, playerData);

    const pageMembers = sortedMembers.slice(0, maxPerCard);

    // ...emoji y card...
    const emojiMatch =
      typeof rank.id === 'string' && rank.id.match(/^<a?:\w+:(\d+)>$/);
    let emojiUrl = undefined;
    if (emojiMatch) {
      const emojiId = emojiMatch[1];
      emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png?size=96&quality=lossless`;
    }

    let cardUrl = undefined;
    let cardAttachment: AttachmentBuilder | undefined;
    if (emojiUrl) {
      const cardBuffer = await renderRankCardCanvas(
        emojiUrl,
        rank.color,
        rank.label
      );
      const cardName = `rankcard_${rank.shortId}.png`;
      cardAttachment = new AttachmentBuilder(cardBuffer, {
        name: cardName,
      });
      cardUrl = `attachment://${cardName}`;
    }

    const embed = await buildOnlineEmbedForRank(
      guild,
      rank,
      pageMembers,
      cardUrl,
      sortedMembers.length, // totalCount
      1, // página actual (si tienes paginación)
      maxPerCard, // máximo por card
      false, // showNumbers (solo true en efímeros)
      allMembers as GuildMember[] // <-- aquí pasas todos los miembros del rango
    );

    embeds.push(embed);
    files.push(cardAttachment ?? null); // Solo un archivo por rango, puede ser null

    // Solo agrega el botón si hay más jugadores que el máximo
    const seeMoreRow = createSeeMoreButtonRow(
      rank,
      sortedMembers.length,
      MAX_PLAYERS_PER_PAGE,
      guild.client
    );

    if (seeMoreRow.length) componentsList.push(seeMoreRow);
    else componentsList.push([]);
  }

  // Log para detectar duplicados
  if (embeds.length !== ranks.length) {
    console.warn(
      `[DUPLICADOS] Se generaron ${embeds.length} cards, pero hay ${ranks.length} rangos.`
    );
  }

  return { embeds, files, componentsList };
}

/**
 * Obtiene todos los miembros del rango, incluyendo desconectados, usando playerData.
 */
export function getAllMembersByRole(
  guild: Guild,
  role: Role,
  playerData: any[]
) {
  const userIds = playerData
    .filter((p) => {
      const member = guild.members.cache.get(p.userId);
      return member && member.roles.cache.has(role.id);
    })
    .map((p) => p.userId);

  return userIds.map((id) => guild.members.cache.get(id) || { id });
}
