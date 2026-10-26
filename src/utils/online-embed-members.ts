import { AttachmentBuilder, Guild, GuildMember, Role } from 'discord.js';
import { getActiveRanks } from '../models/rank-catalog';
import { renderRankCardCanvas } from './rank-card-canvas';
import type { ApexRank } from '../interfaces/apex-rank';

/** Datos resueltos para renderizar una página de un rango. */
export interface RankPageData {
  /** Rango solicitado con su nombre de rol resuelto. */
  rank: ApexRank;
  /** Indica si el guild se trata como servidor grande. */
  isLargeServer: boolean;
  /** Todos los miembros del rango, incluidos proxies. */
  allMembers: GuildMember[];
  /** Miembros ordenados por prioridad. */
  sortedMembers: GuildMember[];
  /** Miembros de la página actual. */
  pageMembers: GuildMember[];
  /** Página normalizada. */
  pageNum: number;
  /** Total de páginas. */
  totalPages: number;
  /** Archivos adjuntos del card. */
  files: AttachmentBuilder[];
  /** URL del adjunto del card. */
  cardUrl?: string;
}

/**
 * Resuelve el rango, el rol, los miembros y la imagen de una página de rango.
 *
 * Para servidores grandes usa proxies de `playerData`; para servidores
 * pequeños verifica los roles reales en caché. Devuelve `null` sin modificar
 * nada si falta el rango, el rol o los miembros.
 *
 * @param guild - Servidor de Discord.
 * @param rankId - shortId del rango solicitado.
 * @param page - Página solicitada, empezando en 1.
 * @param maxPerCard - Máximo de jugadores por página.
 * @returns Los datos listos para renderizar o `null`.
 */
export async function loadRankPageData(
  guild: Guild,
  rankId: string,
  page: number,
  maxPerCard: number
): Promise<RankPageData | null> {
  const { getPlayerData } = await import('./player-data-manager');
  const { logApp } = await import('./logger');
  const playerData = await getPlayerData(guild);

  await logApp(
    `[getRankPageEmbed] Guild: ${guild.name} (${guild.id}) | RankId: ${rankId} | PlayerData: ${playerData.length} registros`
  );

  const rank = getActiveRanks().find((r) => r.shortId === rankId);
  if (!rank) {
    await logApp(
      `[getRankPageEmbed] ❌ Rank no encontrado con shortId: ${rankId}`
    );
    return null;
  }

  await logApp(
    `[getRankPageEmbed] ✅ Rank encontrado: ${rank.label} (${rank.roleName})`
  );

  const { getApexRanksForGuild } =
    await import('../helpers/get-apex-ranks-for-guild');
  const serverRanks = getApexRanksForGuild(guild.id, guild);
  const serverRankInfo = serverRanks.find((r) => r.shortId === rankId);
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

  const isLargeServer = playerData.length >= 1000;

  await logApp(
    `[getRankPageEmbed] Servidor ${
      isLargeServer ? 'GRANDE' : 'PEQUEÑO'
    } detectado (${playerData.length} jugadores registrados)`
  );

  const {
    getAllMembersByRole,
    getAllMembersByRoleWithProxies,
    sortMembersByPriority,
  } = await import('./build-all-online-embed');

  const allMembers = (isLargeServer
    ? getAllMembersByRoleWithProxies(guild, role, playerData)
    : getAllMembersByRole(guild, role, playerData)) as GuildMember[];

  if (allMembers.length === 0) {
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

  const sortedMembers = sortMembersByPriority(
    allMembers,
    playerData
  ) as GuildMember[];

  const totalPages = Math.ceil(sortedMembers.length / maxPerCard);
  const pageNum = Math.max(1, Math.min(page, totalPages));
  const pageMembers = sortedMembers.slice(
    (pageNum - 1) * maxPerCard,
    pageNum * maxPerCard
  );

  const emojiMatch =
    typeof rank.id === 'string' && rank.id.match(/^<a?:\w+:(\d+)>$/);
  let emojiUrl: string | undefined;
  if (emojiMatch) {
    const emojiId = emojiMatch[1];
    emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png?size=96&quality=lossless`;
  }

  let cardUrl: string | undefined;
  const files: AttachmentBuilder[] = [];
  if (emojiUrl) {
    const cardBuffer = await renderRankCardCanvas(
      emojiUrl,
      rank.color,
      rank.label
    );
    const cardName = `rankcard_${rank.shortId}.png`;
    files.push(new AttachmentBuilder(cardBuffer, { name: cardName }));
    cardUrl = `attachment://${cardName}`;
  }

  return {
    rank,
    isLargeServer,
    allMembers,
    sortedMembers,
    pageMembers,
    pageNum,
    totalPages,
    files,
    cardUrl,
  };
}
