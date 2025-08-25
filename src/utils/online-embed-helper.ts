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

  let description = `> ${rankEmoji} **${onlineCount}** ${jugadoresLabel}`;
  if (onlineCount > 0) {
    description +=
      '\n\n' +
      onlineMembers
        .map((member: GuildMember) => {
          const allRoles = member.roles.cache
            .filter(
              (role) =>
                role.name !== '@everyone' &&
                !APEX_RANKS.some((r) => r.roleName === role.name) &&
                role.name !== 'Server Booster'
            )
            .map((role) => role.name)
            .join(', ');
          const rolesDisplay = allRoles ? ` (${allRoles})` : '';
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
