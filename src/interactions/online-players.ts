import { ButtonInteraction, EmbedBuilder, ColorResolvable } from 'discord.js';
import { APEX_RANKS } from '../constants';
import { getOnlineMembersByRole } from '../utils/player-stats';
import { getRankEmoji } from '../utils/emoji-helper';
import { createCloseButtonRow } from '../utils/button-helper';

/**
 * Muestra un embed con los jugadores online de un rango específico.
 * Incluye el emoji, nombre del rango y la lista de jugadores online.
 * @param interaction Interacción de botón de Discord.
 */
export async function handleShowOnlineByRank(interaction: ButtonInteraction) {
  if (!interaction.guild) return;

  await interaction.deferReply({ ephemeral: true });

  const rankShortId = interaction.customId.replace('show_online_rank_', '');
  const selectedRank = APEX_RANKS.find((rank) => rank.shortId === rankShortId);

  if (!selectedRank) {
    await interaction.editReply({
      content: 'Rango no encontrado.',
    });
    return;
  }

  try {
    const role = interaction.guild.roles.cache.find(
      (r) => r.name === selectedRank.roleName
    );
    if (!role) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error de Configuración')
        .setDescription(`El rol "${selectedRank.roleName}" no existe.`);
      await interaction.editReply({
        embeds: [errorEmbed],
        components: [createCloseButtonRow()],
      });
      return;
    }

    const onlineMembers = getOnlineMembersByRole(role);
    const emoji = getRankEmoji(interaction.client, selectedRank);

    const embed = new EmbedBuilder()
      .setColor(selectedRank.color as ColorResolvable)
      .setTitle(`**${emoji}  ${selectedRank.label.toUpperCase()}**`);

    const subtitle = `_${onlineMembers.size} jugadores en línea)_`;

    if (onlineMembers.size === 0) {
      embed.setDescription(subtitle);
      await interaction.editReply({
        embeds: [embed],
        components: [createCloseButtonRow()],
      });
      return;
    }

    const memberList = onlineMembers
      .map((member) => {
        const allRoles = member.roles.cache
          .filter(
            (role) =>
              role.name !== '@everyone' &&
              !APEX_RANKS.some((rank) => rank.roleName === role.name) &&
              role.name !== 'Server Booster'
          )
          .map((role) => role.name)
          .join(', ');
        const rolesDisplay = allRoles ? ` (${allRoles})` : '';
        return `- <@${member.id}>${rolesDisplay}`;
      })
      .join('\n');

    embed.setDescription(`${subtitle}\n\n${memberList}`);
    await interaction.editReply({
      embeds: [embed],
      components: [createCloseButtonRow()],
    });
  } catch (error) {
    console.error('Error al obtener miembros en línea:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar obtener la lista de jugadores en línea.'
      );
    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
