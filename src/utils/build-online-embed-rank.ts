import {
  ColorResolvable,
  EmbedBuilder,
  Guild,
  GuildMember,
  PresenceStatus,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';
import { getRankEmoji } from './emoji-helper';
import { getStatusIcon } from '../interfaces/status-icon';
import { filterAllowedRoles } from './role-filter';
import { getCountryFlag } from './country-flag';

/**
 * Construye un embed visual para mostrar los jugadores de un rango.
 * Incluye ícono de estado delante de cada jugador.
 */
export async function buildOnlineEmbedForRank(
  guild: Guild,
  rank: (typeof APEX_RANKS)[number],
  members: GuildMember[],
  cardUrl?: string,
  totalCount?: number,
  pageNum?: number,
  maxPerCard?: number,
  showNumbers?: boolean,
  allRankMembers?: GuildMember[] // <-- Todos los del rango
) {
  const count = members.length;

  // Obtiene el emoji del rango
  const rankEmoji = getRankEmoji(guild.client, rank);

  const onlineMembers = members.filter(
    (member) => member.presence && member.presence.status === 'online'
  );

  // onlineCount: Cuenta cuántos miembros están en línea.
  const onlineCount = (allRankMembers ?? onlineMembers).filter(
    (member) => member.presence && member.presence.status === 'online'
  ).length;

  // jugadoresLabel: Usa singular o plural según la cantidad en línea.
  const jugadoresLabel = onlineCount === 1 ? '_jugador_' : '_jugadores_';

  // totalLabel: Muestra el total de jugadores del rango, por ejemplo "de 10".
  // Se utiliza para indicar cuántos jugadores hay en total, además de los que están en línea.
  const totalLabel =
    typeof totalCount === 'number' ? `de **${totalCount}**` : '';

  // Calcula el índice inicial para la numeración en la página actual
  const startIdx = pageNum && maxPerCard ? (pageNum - 1) * maxPerCard + 1 : 1;

  // Encabezado con cantidad de jugadores y emoji de rango
  let description = '';
  if (onlineCount > 0) {
    description = `> ${rankEmoji} **${onlineCount}** ${jugadoresLabel} en línea ${totalLabel}`;
  } else {
    description = `> ${rankEmoji} ${onlineCount} jugadores en línea ${totalLabel}`;
  }

  if (count > 0) {
    // Genera la lista de jugadores con numeración, estado y roles/banderas
    description +=
      '\n\n' +
      members
        .map((member: any, idx: number) => {
          const numero = startIdx + idx;
          const status: PresenceStatus =
            (member.presence?.status as PresenceStatus) || 'offline';
          const icon = getStatusIcon(status);
          const mention = member.id ? `<@${member.id}>` : 'Usuario';
          // Filtra roles permitidos y muestra banderas o nombres
          const allowedRoles = member.roles?.cache
            ? filterAllowedRoles(member.roles.cache.map((role: any) => role), guild)
            : [];
          const rolesDisplay = allowedRoles.length
            ? ` (${allowedRoles
                .map((role) => {
                  const flag = getCountryFlag(role.name);
                  const capitalized =
                    role.name.charAt(0).toUpperCase() +
                    role.name.slice(1).toLowerCase();
                  return flag !== role.name
                    ? `${flag} _${capitalized}_`
                    : `_${capitalized}_`;
                })
                .join(', ')})`
            : '';
          // Solo numerar si showNumbers es true
          return showNumbers
            ? `${numero}. ${icon} ${mention}${rolesDisplay}`
            : `${icon} ${mention}${rolesDisplay}`;
        })
        .join('\n');
  }

  // Crea el embed visual con color y descripción
  const embed = new EmbedBuilder()
    .setColor(rank.color as ColorResolvable)
    .setDescription(description);

  // Agrega imagen si corresponde
  if (cardUrl) {
    embed.setImage(cardUrl);
  }

  // Footer dinámico: solo si hay más jugadores que el máximo permitido
  if (typeof totalCount === 'number' && count < totalCount) {
    embed.setFooter({
      text: `👥 Mostrando ${count} jugadores de ${totalCount}. Usa "Ver más" para ver todos.`,
    });
  }

  return embed;
}
