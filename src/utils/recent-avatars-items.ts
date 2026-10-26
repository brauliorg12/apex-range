import { Guild, GuildMember } from 'discord.js';
import { Image, loadImage } from '@napi-rs/canvas';
import { performance } from 'node:perf_hooks';
import { APEX_PLATFORMS, PC_ONLY_EMOGI } from '../models/constants';
import { buildRankResolver } from '../helpers/rank-priority';
import { getRankEmoji } from './emoji-helper';
import { logCanvas } from './logger';
import {
  emojiToCdnPng,
  fetchAvatarImage,
} from './recent-avatars-images';
import type { ApexRank } from '../interfaces/apex-rank';
import type { AvatarCardItem } from '../interfaces/avatars';
import type { PlayerRecord } from '../interfaces/player';

// #region Tipos

/**
 * Métricas de un ítem del card de avatares.
 */
export interface AvatarItemMetrics {
  /** Posición del ítem dentro del card, empezando en 1. */
  position: number;
  /** Duración total de avatar y badge, en milisegundos. */
  totalMs: number;
}

/**
 * Contadores agregados de imágenes del card de avatares.
 */
export interface AvatarItemCounters {
  /** Avatares descargados y decodificados correctamente. */
  avatarOk: number;
  /** Avatares que no se pudieron descargar o decodificar. */
  avatarFail: number;
  /** Badges descargados y decodificados correctamente. */
  badgeOk: number;
  /** Badges que no se pudieron descargar o decodificar. */
  badgeFail: number;
}

/**
 * Ítem preparado para renderizar el card de avatares.
 */
export interface RecentAvatarItem extends AvatarCardItem {
  /** Color del rango para el aura del badge. */
  badgeColor?: string;
}

/**
 * Resultado de preparar los ítems del card de avatares.
 */
export interface RecentAvatarsPreparation {
  /** Ítems en el orden de los jugadores recientes. */
  items: RecentAvatarItem[];
  /** Descripciones en el orden en que terminó cada preparación. */
  descriptions: string[];
  /** Métricas por ítem para detectar preparaciones lentas. */
  metrics: AvatarItemMetrics[];
  /** Contadores agregados de avatares y badges. */
  counters: AvatarItemCounters;
}

// #endregion

// #region Builders

/**
 * Prepara los avatares, badges y descripciones de los jugadores recientes.
 *
 * Descarga las imágenes en paralelo y conserva el orden de las descripciones
 * según la finalización de cada ítem. Para cada miembro usa su rango de mayor
 * tier. No renderiza el canvas ni construye el embed.
 *
 * @param guild - Guild del que se resuelven miembros y emojis.
 * @param players - Jugadores recientes a mostrar.
 * @param ranks - Rangos resueltos para el guild.
 * @returns Ítems, descripciones, métricas y contadores.
 */
export async function prepareRecentAvatarItems(
  guild: Guild,
  players: readonly PlayerRecord[],
  ranks: readonly ApexRank[]
): Promise<RecentAvatarsPreparation> {
  const counters: AvatarItemCounters = {
    avatarOk: 0,
    avatarFail: 0,
    badgeOk: 0,
    badgeFail: 0,
  };
  const itemMetrics: AvatarItemMetrics[] = [];
  const descriptions: string[] = [];
  const resolver = buildRankResolver(ranks);

  const items = await Promise.all(
    players.map(async (player, index) => {
      const itemStartedAt = performance.now();
      const timestamp = Math.floor(
        new Date(player.assignedAt).getTime() / 1000
      );
      let avatarUrl: string | null = null;
      let displayName = 'Usuario';
      let emoji = '';
      let rank: ApexRank | undefined;
      const platformInfo = APEX_PLATFORMS.find(
        (platform) => platform.apiName === player.platform
      );
      const platformIcon = platformInfo ? platformInfo.id : PC_ONLY_EMOGI;
      let member: GuildMember | null = null;

      try {
        member = guild.members.cache.get(player.userId) ?? null;

        if (!member) {
          try {
            member = await guild.members.fetch(player.userId);
          } catch {
            // Si falla el fetch del miembro, se intenta solo el usuario.
          }
        }

        if (member) {
          const user = member.user;
          avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
          displayName = member.displayName || user.username;

          rank = resolver.pickHighest(member.roles.cache.values());
          if (rank) {
            emoji = getRankEmoji(guild.client, rank) || rank.icon;
          }
        } else {
          const user = await guild.client.users
            .fetch(player.userId)
            .catch(() => null);
          if (user) {
            avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
            displayName = user.displayName || user.username;
          }
        }
      } catch {
        // Ignorar errores por usuario no disponible.
      }

      const playerName = member
        ? `\`${displayName}\` <@${player.userId}>`
        : `\`${displayName}\``;

      const parts = [`${index + 1}. ${platformIcon} ${playerName}`];
      if (emoji) parts.push(emoji);
      parts.push(`<t:${timestamp}:R>`);
      descriptions.push(parts.join(' — '));

      let avatar: Image | null = null;
      if (!avatarUrl) {
        counters.avatarFail++;
      } else {
        const fetched = await fetchAvatarImage(avatarUrl, 'avatar');
        if (!fetched.ok || !fetched.buffer) {
          counters.avatarFail++;
        } else {
          try {
            avatar = await loadImage(fetched.buffer);
            counters.avatarOk++;
          } catch (error) {
            counters.avatarFail++;
            const errorName =
              error instanceof Error ? error.name : 'Error desconocido';
            logCanvas(
              `[canvas] avatar: error de decodificación (${errorName})`
            );
          }
        }
      }

      let badgeImg: Image | null = null;
      let badgeText: string | null = null;
      let badgeColor: string | undefined;

      if (emoji && member) {
        badgeColor = rank?.color || '#2ecc71';
        const cdn = emojiToCdnPng(emoji);

        if (cdn) {
          const fetched = await fetchAvatarImage(cdn, 'badge');
          if (fetched.ok && fetched.buffer) {
            try {
              badgeImg = await loadImage(fetched.buffer);
              counters.badgeOk++;
            } catch (error) {
              badgeImg = null;
              counters.badgeFail++;
              const errorName =
                error instanceof Error ? error.name : 'Error desconocido';
              logCanvas(
                `[canvas] badge: error de decodificación (${errorName})`
              );
            }
          } else {
            counters.badgeFail++;
          }
        } else {
          badgeText = emoji;
          counters.badgeOk++;
        }
      }

      itemMetrics.push({
        position: index + 1,
        totalMs: Math.round(performance.now() - itemStartedAt),
      });

      return {
        avatar,
        badgeImg,
        badgeText,
        label: displayName || 'Usuario',
        badgeColor,
      };
    })
  );

  return { items, descriptions, metrics: itemMetrics, counters };
}

// #endregion
