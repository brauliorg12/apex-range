import { AttachmentBuilder, EmbedBuilder, Guild } from 'discord.js';
import { performance } from 'node:perf_hooks';
import {
  COMMON_AURA_SIZE,
  NEW_EMOGI,
  SLOW_CANVAS_MS,
} from '../models/constants';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { getPlayerData } from './player-data-manager';
import { logCanvas } from './logger';
import { renderRecentAvatarsCanvas } from './recent-avatars-canvas';
import { prepareRecentAvatarItems } from './recent-avatars-items';
import type { AvatarItemMetrics } from './recent-avatars-items';

/**
 * Genera un card visual con los avatares y rangos de los últimos 5 usuarios
 * registrados.
 *
 * Descarga avatares y badges, renderiza la imagen y construye el embed que la
 * adjunta.
 *
 * @param guild - Servidor de Discord.
 * @returns El embed y los archivos para enviar, o `null` si hay menos de 5
 *   jugadores registrados.
 */
export async function buildRecentAvatarsCard(guild: Guild) {
  const startedAt = performance.now();
  const ranks = getApexRanksForGuild(guild.id, guild);
  const playerData = await getPlayerData(guild);

  if (playerData.length < 5) {
    return null;
  }

  const recent = [...playerData]
    .sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    )
    .slice(0, 5);

  const { items, descriptions, metrics, counters } =
    await prepareRecentAvatarItems(guild, recent, ranks);

  const { buffer, encodeMs } = await renderRecentAvatarsCanvas(items, {
    size: 128,
    pad: 16,
    labelHeight: 36,
    auraSize: COMMON_AURA_SIZE,
  });

  const attachment = new AttachmentBuilder(buffer, {
    name: 'recent-avatars.png',
  });
  const embed = new EmbedBuilder()
    .setColor('#2ecc71')
    .setTitle(`${NEW_EMOGI} Últimos 5 registrados`)
    .setDescription(descriptions.join('\n'))
    .setImage('attachment://recent-avatars.png');

  const totalMs = Math.round(performance.now() - startedAt);
  const slowestItem = metrics.reduce<AvatarItemMetrics | null>(
    (slowest, current) =>
      !slowest || current.totalMs > slowest.totalMs ? current : slowest,
    null
  );
  const slowestLabel =
    slowestItem && slowestItem.totalMs >= SLOW_CANVAS_MS
      ? ` masLento=#${slowestItem.position}:${slowestItem.totalMs}ms`
      : '';

  logCanvas(
    `[canvas] Card de avatares: items=${items.length} ` +
      `avataresOk=${counters.avatarOk} avataresFail=${counters.avatarFail} ` +
      `badgesOk=${counters.badgeOk} badgesFail=${counters.badgeFail} ` +
      `encode=${encodeMs}ms total=${totalMs}ms${slowestLabel}`
  );

  return { embed, files: [attachment] };
}
