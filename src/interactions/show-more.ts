import {
  EmbedBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { getRankEmoji } from '../utils/emoji-helper';
import { createCloseButtonRow } from '../utils/button-helper';
import { getOnlineMembersByRole } from '../utils/player-stats';

export async function handleRankFilterSelect(
  interaction: StringSelectMenuInteraction
) {
  const guild = interaction.guild!;
  const selected = interaction.values[0];
  const rank = APEX_RANKS.find((r) => r.shortId === selected);

  if (!rank) {
    await interaction.reply({
      content: 'Rango no válido.',
      ephemeral: true,
    });
    return;
  }

  const role = guild.roles.cache.find((r) => r.name === rank.roleName);
  if (!role) {
    await interaction.reply({
      content: `No se encontró el rol ${rank.roleName}.`,
      ephemeral: true,
    });
    return;
  }

  const onlineMembers = getOnlineMembersByRole(role);
  const emoji = getRankEmoji(guild.client, rank) || rank.icon;
  const list =
    onlineMembers.size > 0
      ? onlineMembers.map((m) => `• <@${m.id}>`).join('\n')
      : '_Nadie en línea_';

  const embed = new EmbedBuilder()
    .setColor(rank.color as any)
    .setTitle(`🟢 En línea — ${emoji} ${rank.label}`)
    .setDescription(list);

  // Responder efímero, sin modificar el mensaje público
  await interaction.reply({
    embeds: [embed],
    components: [createCloseButtonRow()],
    ephemeral: true,
  });
}
