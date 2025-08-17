import {
  ButtonInteraction,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Guild,
} from 'discord.js';
import { APEX_RANKS } from './constants';
import { updateRoleCountMessage } from './utils/update-status-message';
import { getOnlineMembersByRole } from './utils/player-stats';
import { getRankEmoji } from './utils/emoji-helper';

// Construye el payload (embed y botones) para el menú de rango privado
async function buildManageRankPayload(guild: Guild, member: GuildMember) {
  const memberRankRoles = member.roles.cache.filter((role) =>
    APEX_RANKS.some((rank) => rank.roleName === role.name)
  );
  const currentRank = APEX_RANKS.find(
    (rank) =>
      memberRankRoles.size > 0 &&
      rank.roleName === memberRankRoles.first()!.name
  );

  const title = currentRank
    ? `Rango actual: ${getRankEmoji(
        guild.client,
        currentRank
      )} **${currentRank.label}**`
    : 'Selección de Rango';
  const description = currentRank
    ? 'Puede actualizar su rango seleccionando una nueva opción.'
    : 'Selecciona tu rango principal en Apex Legends para que otros jugadores puedan encontrarte.';

  const embed = new EmbedBuilder()
    .setColor('#95a5a6')
    .setTitle(title)
    .setDescription(description);

  const row1Buttons = APEX_RANKS.slice(0, 4).map((rank) =>
    new ButtonBuilder()
      .setCustomId(rank.shortId)
      .setLabel(rank.label)
      .setEmoji(getRankEmoji(guild.client, rank))
      .setStyle(ButtonStyle.Secondary)
  );
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(row1Buttons);

  const row2Buttons = APEX_RANKS.slice(4).map((rank) =>
    new ButtonBuilder()
      .setCustomId(rank.shortId)
      .setLabel(rank.label)
      .setEmoji(getRankEmoji(guild.client, rank))
      .setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(row2Buttons);

  // Solo añadir el botón de quitar si el usuario tiene un rango
  if (currentRank) {
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId('remove_apex_rank')
        .setLabel('X')
        .setStyle(ButtonStyle.Danger)
    );
  }

  return { embeds: [embed], components: [row1, row2] };
}

// Muestra el menú de rangos como un mensaje efímero
async function handleManageRankMenu(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.member) return;
  const member = interaction.member as GuildMember;

  await interaction.deferReply({ ephemeral: true });
  const payload = await buildManageRankPayload(interaction.guild, member);
  await interaction.editReply(payload);
}

// Asigna un rol y actualiza el menú efímero
async function handleRoleAssignment(interaction: ButtonInteraction) {
  const { customId, member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const selectedRank = APEX_RANKS.find((rank) => rank.shortId === customId);
  if (!selectedRank) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const roleToAssign = guild.roles.cache.find(
      (role) => role.name === selectedRank.roleName
    );
    if (!roleToAssign) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c') // Rojo
        .setTitle('❌ Error de Configuración')
        .setDescription(
          `El rol "${selectedRank.roleName}" no existe. Por favor, avisa a un administrador.`
        );
      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    const allRankRoleNames = APEX_RANKS.map((r) => r.roleName);
    const rolesToRemove = member.roles.cache.filter((role) =>
      allRankRoleNames.includes(role.name)
    );

    await member.roles.remove(rolesToRemove);
    await member.roles.add(roleToAssign);

    const successEmbed = new EmbedBuilder()
      .setColor('#2ecc71') // Verde
      .setTitle('✅ Rango Asignado')
      .setDescription(`Se te ha asignado el rol **${roleToAssign.name}**.`);

    await interaction.editReply({ embeds: [successEmbed] });

    // Solo actualizamos los contadores del panel público
    await updateRoleCountMessage(guild);
  } catch (error) {
    console.error('Error al asignar el rol:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c') // Rojo
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar asignar tu rol. Asegúrate de que tengo los permisos necesarios.'
      );
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// Quita el rol y actualiza el menú efímero
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
      const warningEmbed = new EmbedBuilder()
        .setColor('#f1c40f') // Amarillo
        .setTitle('⚠️ Sin Rango')
        .setDescription('No tienes ningún rol de rango de Apex para quitar.');
      await interaction.editReply({ embeds: [warningEmbed] });
      return;
    }

    await member.roles.remove(rolesToRemove);

    const successEmbed = new EmbedBuilder()
      .setColor('#e74c3c') // Rojo
      .setTitle('🗑️ Rango Eliminado')
      .setDescription('Se han quitado tus roles de rango de Apex.');
    await interaction.editReply({ embeds: [successEmbed] });

    // Solo actualizamos los contadores del panel público
    await updateRoleCountMessage(guild);
  } catch (error) {
    console.error('Error al quitar el rol:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c') // Rojo
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar quitar tu rol. Asegúrate de que tengo los permisos necesarios.'
      );
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

async function handleShowOnlinePlayersMenu(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  // Actualizar los contadores antes de mostrar el menú
  await updateRoleCountMessage(interaction.guild);

  const rankButtons = APEX_RANKS.map((rank) => {
    const role = interaction.guild!.roles.cache.find(
      (r) => r.name === rank.roleName
    );
    const onlineMemberCount = role ? getOnlineMembersByRole(role).size : 0;
    const emoji = getRankEmoji(interaction.client, rank);
    return new ButtonBuilder()
      .setCustomId(`show_online_rank_${rank.shortId}`)
      .setLabel(`${rank.label} (${onlineMemberCount})`)
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
    .setColor('#3498db') // Azul
    .setTitle('Jugadores en Línea por Rango')
    .setDescription('Selecciona un rango para ver los jugadores en línea:');

  await interaction.editReply({
    embeds: [menuEmbed],
    components: rows,
  });
}

async function handleShowOnlineByRank(interaction: ButtonInteraction) {
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
        .setColor('#e74c3c') // Rojo
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
        `${emoji} Jugadores en línea en ${selectedRank.label}`
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
        return `- **${member.displayName}**${rolesDisplay}`;
      })
      .join('\n');

    embed.setDescription(memberList);
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Error al obtener miembros en línea:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c') // Rojo
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar obtener la lista de jugadores en línea.'
      );
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { customId } = interaction;

  if (customId === 'manage_rank_menu') {
    await handleManageRankMenu(interaction);
  } else if (APEX_RANKS.some((rank) => rank.shortId === customId)) {
    await handleRoleAssignment(interaction);
  } else if (customId === 'remove_apex_rank') {
    await handleRemoveRank(interaction);
  } else if (customId === 'show_online_players_menu') {
    await handleShowOnlinePlayersMenu(interaction);
  } else if (customId.startsWith('show_online_rank_')) {
    await handleShowOnlineByRank(interaction);
  }
}
