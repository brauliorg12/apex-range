import {
  ButtonInteraction,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Guild,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { getRankEmoji } from '../utils/emoji-helper';
import { createCloseButtonRow } from '../utils/button-helper';
import {
  updatePlayerRankDate,
  removePlayerRankDate,
} from '../utils/player-data-manager';
import {
  ensureCommonApexRole,
  removeCommonApexRoleIfNoRank,
} from '../utils/role-helper';

/**
 * Construye el payload (embed y botones) para el menú de gestión de rango privado de un usuario.
 * Muestra el rango actual y permite cambiarlo o eliminarlo.
 * @param guild Servidor Discord.
 * @param member Miembro de Discord.
 * @returns Objeto con embeds y componentes (botones) para mostrar al usuario.
 */
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
    ? `Rango actual: ${getRankEmoji(guild.client, currentRank)} **${
        currentRank.label
      }**`
    : 'Selección de Rango';
  const description = currentRank
    ? 'Puede actualizar su rango seleccionando una nueva opción.'
    : 'Selecciona tu rango actual en Apex Legends para que otros jugadores puedan encontrarte.';

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

  if (currentRank) {
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId('remove_apex_rank')
        .setLabel('Eliminar Rango')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger)
    );
  }

  // Agrega el botón de cerrar como última fila
  return { embeds: [embed], components: [row1, row2, createCloseButtonRow()] };
}

export function buildMainMenuComponents() {
  const allPlayersButton = new ButtonBuilder()
    .setCustomId('show_all_players_menu')
    .setLabel('Ver todos los jugadores')
    .setStyle(ButtonStyle.Secondary);

  const manageRankButton = new ButtonBuilder()
    .setCustomId('manage_rank_menu')
    .setLabel('Gestionar mi rango')
    .setStyle(ButtonStyle.Primary);

  const helpButton = new ButtonBuilder()
    .setCustomId('show_help_menu')
    .setLabel('Ayuda de Comandos')
    .setEmoji('❓')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    manageRankButton,
    allPlayersButton,
    helpButton
  );

  return [row];
}

export async function handleManageRankMenu(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.member) return;
  const member = interaction.member as GuildMember;

  console.log(
    `[Interacción] Abriendo menú 'Gestionar mi rango' para ${interaction.user.tag}.`
  );

  await interaction.deferReply({ ephemeral: true });
  const payload = await buildManageRankPayload(interaction.guild, member);
  await interaction.editReply(payload);
}

export async function handleRoleAssignment(interaction: ButtonInteraction) {
  const { customId, member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const selectedRank = APEX_RANKS.find((rank) => rank.shortId === customId);
  if (!selectedRank) return;

  console.log(
    `[Interacción] ${interaction.user.tag} está intentando asignarse el rango '${selectedRank.label}'.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    const roleToAssign = guild.roles.cache.find(
      (role) => role.name === selectedRank.roleName
    );
    if (!roleToAssign) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error de Configuración')
        .setDescription(
          `El rol "${selectedRank.roleName}" no existe. Por favor, avisa a un administrador.`
        );
      await interaction.editReply({
        embeds: [errorEmbed],
        components: [createCloseButtonRow()],
      });
      return;
    }

    const allRankRoleNames = APEX_RANKS.map((r) => r.roleName);
    const rolesToRemove = member.roles.cache.filter((role) =>
      allRankRoleNames.includes(role.name)
    );

    await member.roles.remove(rolesToRemove);
    await member.roles.add(roleToAssign);
    await ensureCommonApexRole(member);

    // Guardar la fecha de asignación
    await updatePlayerRankDate(guild.id, member.id);

    console.log(
      `[Interacción] Rango '${selectedRank.label}' asignado a ${interaction.user.tag}.`
    );

    const successEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Rango Asignado')
      .setDescription(
        `${getRankEmoji(guild.client, selectedRank)} **${
          roleToAssign.name
        }**\n\n` +
          '_¡Excelente! Ahora puedes ver tu rango actual y los demás jugadores encontrarte._'
      );
    await interaction.editReply({
      embeds: [successEmbed],
      components: [createCloseButtonRow()],
    });

    await updateRoleCountMessage(guild);
  } catch (error) {
    console.error('Error al asignar el rol:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar asignar tu rol. Asegúrate de que tengo los permisos necesarios.'
      );
    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}

export async function handleRemoveRank(interaction: ButtonInteraction) {
  const { member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  console.log(
    `[Interacción] ${interaction.user.tag} está intentando eliminar su rango.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    const allRankRoleNames = APEX_RANKS.map((r) => r.roleName);
    const rolesToRemove = member.roles.cache.filter((role) =>
      allRankRoleNames.includes(role.name)
    );

    if (rolesToRemove.size === 0) {
      const warningEmbed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('⚠️ Sin Rango')
        .setDescription('No tienes ningún rol de rango de Apex para quitar.');
      await interaction.editReply({
        embeds: [warningEmbed],
        components: [createCloseButtonRow()],
      });
      return;
    }

    await member.roles.remove(rolesToRemove);
    await removeCommonApexRoleIfNoRank(member);

    // Eliminar la fecha de asignación
    await removePlayerRankDate(guild.id, member.id);

    console.log(
      `[Interacción] Roles de rango eliminados para ${interaction.user.tag}.`
    );

    const successEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('🗑️ Rango Eliminado')
      .setDescription('Se han quitado tus roles de rango de Apex.');
    await interaction.editReply({
      embeds: [successEmbed],
      components: [createCloseButtonRow()],
    });

    await updateRoleCountMessage(guild);
  } catch (error) {
    console.error('Error al quitar el rol:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar quitar tu rol. Asegúrate de que tengo los permisos necesarios.'
      );
    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
