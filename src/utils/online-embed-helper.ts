import { Guild, EmbedBuilder, ColorResolvable } from 'discord.js';
import { APEX_RANKS } from '../constants';
import { getOnlineMembersByRole } from './player-stats';
import { getRankEmoji } from './emoji-helper';

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
  const subtitle = `_(${onlineMembers.size} jugadores en línea)_`; // pequeño y en cursiva

  let description = '';
  if (onlineMembers.size > 0) {
    description = onlineMembers
      .map((member) => {
        const allRoles = member.roles.cache
          .filter(
            (role) =>
              role.name !== '@everyone' &&
              !APEX_RANKS.some((r) => r.roleName === role.name)
          )
          .map((role) => role.name)
          .join(', ');
        const rolesDisplay = allRoles ? ` (${allRoles})` : '';
        return `- <@${member.id}>${rolesDisplay}`;
      })
      .join('\n');
    description = `${subtitle}\n\n${description}`;
  } else {
    description = `${subtitle}`;
  }

  const embed = new EmbedBuilder()
    .setColor(rank.color as ColorResolvable)
    .setTitle(title)
    .setDescription(description);

  return embed;
}

export async function buildAllOnlineEmbeds(guild: Guild) {
  const embeds = [];
  for (const rank of APEX_RANKS) {
    const embed = await buildOnlineEmbedForRank(guild, rank);
    embeds.push(embed);
  }
  return embeds;
}
