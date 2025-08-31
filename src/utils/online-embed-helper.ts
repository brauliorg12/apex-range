import {
  Guild,
  EmbedBuilder,
  ColorResolvable,
  AttachmentBuilder,
  Role,
  GuildMember,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { getOnlineMembersByRole } from './player-stats';
import { renderRankCardCanvas } from './rank-card-canvas';
import { getRankEmoji } from './emoji-helper';
import { filterAllowedRoles } from './role-filter';
import { getCountryFlag } from './country-flag';

/**
 * Construye un embed visual para mostrar los jugadores online de un rango específico.
 * Incluye el logo pulse y el nombre del rango como imagen principal.
 * @param guild Servidor Discord.
 * @param rank Objeto de rango de APEX_RANKS.
 * @param onlineMembers Lista de miembros online de ese rango.
 * @param cardUrl (opcional) URL de la imagen generada para el card.
 * @returns EmbedBuilder listo para enviar.
 */
export async function buildOnlineEmbedForRank(
  guild: Guild,
  rank: (typeof APEX_RANKS)[number],
  onlineMembers: GuildMember[],
  cardUrl?: string
) {
  const onlineCount = onlineMembers.length;
  const jugadoresLabel =
    onlineCount === 1 ? '_jugador en línea_' : '_jugadores en línea_';

  const rankEmoji = getRankEmoji(guild.client, rank);

  /**
   * Para cada usuario online:
   * - Se filtran los roles extra permitidos (excluyendo rangos, @everyone y los definidos en EXCLUDED_ROLES).
   * - Cada rol permitido se traduce a su bandera de país (si el nombre coincide con un país en mayúsculas, ej: ARGENTINA, MEXICO, VENEZUELA) usando getCountryFlag.
   * - Si el usuario tiene varios roles de país, se muestran varias banderas.
   * - Si el rol no es un país conocido, se muestra el nombre original del rol.
   * Ejemplo de resultado:
   *   • @usuario1 (🇦🇷, 🇪🇸)
   *   • @usuario2 (🇲🇽)
   *   • @usuario3
   */
  let description = `> ${rankEmoji} **${onlineCount}** ${jugadoresLabel}`;

  if (onlineCount > 0) {
    description +=
      '\n\n' +
      onlineMembers
        .map((member: GuildMember) => {
          const allowedRoles = filterAllowedRoles(
            member.roles.cache.map((role) => role)
          );
          // Para cada rol permitido, muestra la bandera y el nombre capitalizado en cursiva si es país, si no, solo el nombre
          const rolesDisplay = allowedRoles.length
            ? ` (${allowedRoles
                .map((role) => {
                  const flag = getCountryFlag(role.name);
                  // Capitaliza el nombre del país o rol
                  const capitalized =
                    role.name.charAt(0).toUpperCase() +
                    role.name.slice(1).toLowerCase();
                  // Siempre muestra en cursiva, con bandera si aplica
                  return flag !== role.name
                    ? `${flag} _${capitalized}_`
                    : `_${capitalized}_`;
                })
                .join(', ')})`
            : '';
          return `• <@${member.id}>${rolesDisplay}`;
        })
        .join('\n');
  }

  const embed = new EmbedBuilder()
    .setColor(rank.color as ColorResolvable)
    .setDescription(description);

  // Imagen principal: solo logo pulse + texto de rango
  if (cardUrl) {
    embed.setImage(cardUrl);
  }

  return embed;
}

/**
 * Genera todos los embeds y archivos de imagen para mostrar los jugadores online por rango.
 * Cada embed contiene el card visual del rango y la lista de jugadores online.
 * @param guild Servidor Discord.
 * @returns { embeds, files } para enviar en un mensaje.
 */
export async function buildAllOnlineEmbeds(guild: Guild) {
  const embeds: EmbedBuilder[] = [];
  const files: AttachmentBuilder[] = [];

  for (const rank of APEX_RANKS) {
    if (files.length >= 10) break;

    const role: Role | undefined = guild.roles.cache.find(
      (r): r is Role => r.name === rank.roleName
    );
    if (!role) continue;

    const onlineMembers = Array.from(
      getOnlineMembersByRole(role).values()
    ) as GuildMember[];

    // Obtener URL del emoji grande
    const emojiMatch =
      typeof rank.id === 'string' && rank.id.match(/^<a?:\w+:(\d+)>$/);
    let emojiUrl = undefined;
    if (emojiMatch) {
      const emojiId = emojiMatch[1];
      emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png?size=96&quality=lossless`;
    }

    // Genera la imagen (solo logo pulse + texto de rango)
    let cardUrl = undefined;
    if (emojiUrl && files.length < 10) {
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

    const embed = await buildOnlineEmbedForRank(
      guild,
      rank,
      onlineMembers,
      cardUrl
    );
    embeds.push(embed);
  }

  return { embeds, files };
}
