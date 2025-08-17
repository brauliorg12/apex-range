import {
  ButtonInteraction,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { APEX_RANKS } from './constants';
import { updateRoleCountMessage } from './utils/update-status-message';
import { getOnlineMembersByRole } from './utils/player-stats';

async function handleRoleAssignment(interaction: ButtonInteraction) {
  const { customId, member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const selectedRank = APEX_RANKS.find((rank) => rank.id === customId);
  if (!selectedRank) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const roleToAssign = guild.roles.cache.find(
      (role) => role.name === selectedRank.roleName
    );
    if (!roleToAssign) {
      await interaction.editReply({
        content: `El rol "${selectedRank.roleName}" no existe. Por favor, avisa a un administrador.`,
      });
      return;
    }

    const allRankRoleNames = APEX_RANKS.map((r) => r.roleName);
    const rolesToRemove = member.roles.cache.filter((role) =>
      allRankRoleNames.includes(role.name)
    );

    await member.roles.remove(rolesToRemove);
    await member.roles.add(roleToAssign);

    await interaction.editReply({
      content: `¡Se te ha asignado el rol de ${roleToAssign.name}!`,
    });

    await updateRoleCountMessage(guild);
  } catch (error) {
    console.error('Error al asignar el rol:', error);
    await interaction.editReply({
      content:
        'Hubo un error al intentar asignar tu rol. Asegúrate de que tengo permisos para gestionar roles.',
    });
  }
}

async function handleRemoveRank(interaction: ButtonInteraction) {
  const { member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const allRankRoleNames = APEX_RANKS.map((r) => r.roleName);
    const rolesToRemove = member.roles.cache.filter((role) =>
      allRankRoleNames.includes(role.name)
    );

    if (rolesToRemove.size === 0) {
      await interaction.editReply({
        content: 'No tienes ningún rol de rango de Apex para quitar.',
      });
      return;
    }

    await member.roles.remove(rolesToRemove);

    await interaction.editReply({
      content: 'Se han quitado tus roles de rango de Apex.',
    });

    await updateRoleCountMessage(guild);
  } catch (error) {
    console.error('Error al quitar el rol:', error);
    await interaction.editReply({
      content:
        'Hubo un error al intentar quitar tu rol. Asegúrate de que tengo permisos para gestionar roles.',
    });
  }
}

async function handleShowOnlinePlayersMenu(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  // Actualizar el panel principal de selección de roles
  await updateRoleCountMessage(interaction.guild);

  const rankButtons = APEX_RANKS.map((rank) => {
    const role = interaction.guild!.roles.cache.find(
      (r) => r.name === rank.roleName
    );
    const onlineMemberCount = role ? getOnlineMembersByRole(role).size : 0;
    return new ButtonBuilder()
      .setCustomId(`show_online_rank_${rank.id}`)
      .setLabel(`${rank.label} (${onlineMemberCount})`)
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

  await interaction.editReply({
    content: 'Selecciona un rango para ver los jugadores en línea:',
    components: rows,
  });
}

async function handleShowOnlineByRank(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  const rankId = interaction.customId.replace('show_online_rank_', '');
  const selectedRank = APEX_RANKS.find((rank) => rank.id === rankId);

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
      await interaction.editReply({
        content: `El rol "${selectedRank.roleName}" no existe.`,
      });
      return;
    }

    const onlineMembers = getOnlineMembersByRole(role);

    if (onlineMembers.size === 0) {
      await interaction.editReply({
        content: `No hay jugadores en línea en el rango ${selectedRank.label}.`,
      });
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
        return `- **${member.displayName}**${rolesDisplay}`;
      })
      .join('\n');
    await interaction.editReply({
      content: `**Jugadores en línea en ${selectedRank.label}:**\n${memberList}`,
    });
  } catch (error) {
    console.error('Error al obtener miembros en línea:', error);
    await interaction.editReply({
      content:
        'Hubo un error al intentar obtener la lista de jugadores en línea.',
    });
  }
}

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { customId } = interaction;

  if (APEX_RANKS.some((rank) => rank.id === customId)) {
    await handleRoleAssignment(interaction);
  } else if (customId === 'show_online_players_menu') {
    await handleShowOnlinePlayersMenu(interaction);
  } else if (customId.startsWith('show_online_rank_')) {
    await handleShowOnlineByRank(interaction);
  } else if (customId === 'remove_apex_rank') {
    await handleRemoveRank(interaction);
  }
}
