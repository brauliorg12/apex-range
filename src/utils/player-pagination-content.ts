import { Guild } from 'discord.js';
import type { GuildMember } from 'discord.js';
import { getRankEmoji } from './emoji-helper';
import { logApp } from './logger';
import { buildPlayerLine } from './player-pagination-line';
import type { PlayerLineOptions } from './player-pagination-line';
import type { ApexRank } from '../interfaces/apex-rank';

/**
 * Construye el encabezado de descripción de una página de jugadores.
 *
 * @param guild - Servidor de Discord.
 * @param rank - Rango de la página, si corresponde.
 * @param members - Miembros totales del listado.
 * @param totalPlayers - Total de jugadores a mostrar.
 * @returns El encabezado o una cadena vacía si no hay rango.
 */
export function buildPaginationDescription(
  guild: Guild,
  rank: ApexRank | undefined,
  members: GuildMember[],
  totalPlayers: number
): string {
  if (!rank) return '';

  const rankEmoji = getRankEmoji(guild.client, rank);
  const onlineCount = members.filter(
    (member) => member.presence && member.presence.status === 'online'
  ).length;
  const jugadoresLabel = onlineCount === 1 ? '_jugador_' : '_jugadores_';

  if (onlineCount > 0) {
    return `> ${rankEmoji} **${onlineCount}** ${jugadoresLabel} en línea de **${totalPlayers}**`;
  }

  return `> ${rankEmoji} ${onlineCount} jugadores en línea de **${totalPlayers}**`;
}

/**
 * Resuelve las menciones de los miembros de la página actual.
 *
 * No propaga errores individuales ni del lote: los registra y deja que el
 * render continúe con el nombre que ya esté en caché.
 *
 * @param guild - Servidor de Discord.
 * @param pageMembers - Miembros de la página.
 * @param pageNum - Página normalizada, solo para el log.
 */
export async function fetchPaginationMembers(
  guild: Guild,
  pageMembers: GuildMember[],
  pageNum: number
): Promise<void> {
  await logApp(
    `[createPlayerPaginationEmbed] 🔄 Haciendo fetch de ${pageMembers.length} miembros para resolver menciones...`
  );

  try {
    const fetchPromises = pageMembers.map(async (member) => {
      if (!guild.members.cache.has(member.id)) {
        try {
          await guild.members.fetch(member.id);
        } catch {
          // Ignorar errores individuales (usuario pudo haberse ido del servidor)
        }
      }
    });

    await Promise.all(fetchPromises);
    await logApp(
      `[createPlayerPaginationEmbed] ✅ Fetch completado para página ${pageNum}`
    );
  } catch (fetchError) {
    await logApp(
      `[createPlayerPaginationEmbed] ⚠️ Error al hacer fetch: ${fetchError}`
    );
  }
}

/**
 * Construye las líneas de los miembros de la página.
 *
 * @param guild - Servidor de Discord.
 * @param pageMembers - Miembros de la página.
 * @param startIdx - Índice inicial de la página.
 * @param options - Opciones visuales de cada línea.
 * @returns Las líneas unidas por salto de línea.
 */
export async function buildPaginationMemberLines(
  guild: Guild,
  pageMembers: GuildMember[],
  startIdx: number,
  options: PlayerLineOptions
): Promise<string> {
  const memberLines = await Promise.all(
    pageMembers.map((member, idx) =>
      buildPlayerLine(guild, member, startIdx + idx + 1, options)
    )
  );

  return memberLines.join('\n');
}
