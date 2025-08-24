import {
  Guild,
  EmbedBuilder,
  ColorResolvable,
  AttachmentBuilder,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { getOnlineMembersByRole } from './player-stats';
import { getRankEmoji } from './emoji-helper';
import { renderRecentAvatarsCanvas, loadImage } from './recent-avatars-canvas';

export async function buildOnlineEmbedForRank(
  guild: Guild,
  rank: (typeof APEX_RANKS)[number]
) {
  const role = guild.roles.cache.find((r) => r.name === rank.roleName);
  const emoji = getRankEmoji(guild.client, rank);

  if (!role) {
    return new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle(`❌ Error de Configuración`)
      .setDescription(`El rol "${rank.roleName}" no existe.`);
  }

  const onlineMembers = getOnlineMembersByRole(role);

  // Título en negrita normal
  const title = `**${emoji}  ${rank.label.toUpperCase()}**`;
  const onlineCount =
    onlineMembers.size > 0
      ? `**${onlineMembers.size}**`
      : `${onlineMembers.size}`;
  const jugadoresLabel =
    onlineMembers.size === 1 ? 'jugador en línea' : 'jugadores en línea';
  const subtitle = `> _${onlineCount} ${jugadoresLabel}_`; // blockquote y cursiva

  let description = '';
  if (onlineMembers.size > 0) {
    description = onlineMembers
      .map((member) => {
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

  // Subtítulo blockquote arriba, luego la lista de jugadores (si hay)
  description = `${subtitle}${description ? '\n\n' + description : ''}`;

  const embed = new EmbedBuilder()
    .setColor(rank.color as ColorResolvable)
    .setTitle(title)
    .setDescription(description);

  return embed;
}

export async function buildAllOnlineEmbeds(guild: Guild) {
  const embeds: EmbedBuilder[] = [];
  const files: AttachmentBuilder[] = [];

  for (const rank of APEX_RANKS) {
    const role = guild.roles.cache.find((r) => r.name === rank.roleName);
    if (!role) continue;

    const onlineMembers = getOnlineMembersByRole(role);

    // Mostrar la imagen grande del emoji de rango como thumbnail solo si hay jugadores online
    let emojiThumbnailUrl: string | undefined = undefined;
    let canvasAttachment = null;
    let canvasUrl = undefined;

    if (onlineMembers.size > 0) {
      const emojiMatch =
        typeof rank.id === 'string' && rank.id.match(/^<a?:\w+:(\d+)>$/);
      if (emojiMatch) {
        const emojiId = emojiMatch[1];
        emojiThumbnailUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png?size=96&quality=lossless`;
      }

      // Generar miniaturas de avatar para los miembros online de este rango
      const avatarItems = await Promise.all(
        onlineMembers.map(async (member) => {
          let avatar = null;
          try {
            const url = member.user.displayAvatarURL({
              extension: 'png',
              size: 128,
            });
            const res = await fetch(url);
            const buf = await res.arrayBuffer();
            avatar = await loadImage(Buffer.from(buf));
          } catch {}
          return {
            avatar,
            label: member.displayName,
          };
        })
      );

      if (avatarItems.length > 0) {
        const { buffer } = await renderRecentAvatarsCanvas(avatarItems, {
          size: 64, // más calidad
          pad: 8,
          labelHeight: 22, // acorde al tamaño
        });
        const filename = `online_${rank.shortId}.png`;
        canvasAttachment = new AttachmentBuilder(buffer, { name: filename });
        files.push(canvasAttachment);
        canvasUrl = `attachment://${filename}`;
      }
    }

    // Construir el embed (siempre, aunque no haya jugadores online)
    const embed = await buildOnlineEmbedForRank(guild, rank);

    // Solo setear thumbnail e imagen si hay jugadores online
    if (onlineMembers.size > 0) {
      if (emojiThumbnailUrl) {
        embed.setThumbnail(emojiThumbnailUrl);
      }
      if (canvasAttachment && canvasUrl) {
        embed.setImage(canvasUrl);
      }
    }

    embeds.push(embed);
  }

  return { embeds, files };
}
