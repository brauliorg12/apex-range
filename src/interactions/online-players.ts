import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { getOnlineMembersByRole } from '../utils/player-stats';
import { getRankEmoji } from '../utils/emoji-helper';

export async function handleShowOnlinePlayersMenu(
  interaction: ButtonInteraction
) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  await updateRoleCountMessage(interaction.guild);

  const rankButtons = APEX_RANKS.map((rank) => {
    const role = interaction.guild!.roles.cache.find(
      (r) => r.name === rank.roleName
    );
    const onlineMemberCount = role ? getOnlineMembersByRole(role).size : 0;
    const emoji = getRankEmoji(interaction.client, rank);
    return new ButtonBuilder()
      .setCustomId(`show_online_rank_${rank.shortId}`)
      .setLabel(`${rank.label} - ${onlineMemberCount}`)
      .setEmoji(emoji)
      .setStyle(ButtonStyle.Secondary);
  });

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < rankButtons.length; i += 5) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        rankButtons.slice(i, i + 5)
      )
    );
  }

  const menuEmbed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('Jugadores en Línea por Rango')
    .setDescription('Selecciona un rango para ver los jugadores en línea:');

  await interaction.editReply({
    embeds: [menuEmbed],
    components: rows,
  });
}

export async function handleShowOnlineByRank(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const rankShortId = interaction.customId.replace('show_online_rank_', '');
  const selectedRank = APEX_RANKS.find((rank) => rank.shortId === rankShortId);

  if (!selectedRank) {
    await interaction.reply({
      content: 'Rango no encontrado.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const role = interaction.guild.roles.cache.find(
      (r) => r.name === selectedRank.roleName
    );
    if (!role) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error de Configuración')
        .setDescription(`El rol "${selectedRank.roleName}" no existe.`);
      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    const onlineMembers = getOnlineMembersByRole(role);
    const emoji = getRankEmoji(interaction.client, selectedRank);

    const embed = new EmbedBuilder()
      .setColor(role.color || '#95a5a6')
      .setTitle(
        `${onlineMembers.size} - Jugadores en línea en ${emoji} ${selectedRank.label}`
      );

    if (onlineMembers.size === 0) {
      embed.setDescription(
        `No hay jugadores en línea en el rango ${selectedRank.label}.`
      );
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const memberList = onlineMembers
      .map((member) => {
        const allRoles = member.roles.cache
          .filter(
            (role) =>
              role.name !== '@everyone' &&
              !APEX_RANKS.some((rank) => rank.roleName === role.name)
          )
          .map((role) => role.name)
          .join(', ');
        const rolesDisplay = allRoles ? ` (${allRoles})` : '';
        return `- <@${member.id}>${rolesDisplay}`;
      })
      .join('\n');

    embed.setDescription(memberList);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error al obtener miembros en línea:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar obtener la lista de jugadores en línea.'
      );
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
