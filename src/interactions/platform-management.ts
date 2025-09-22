import {
  ButtonInteraction,
  GuildMember,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import {
  APEX_PLATFORMS,
  APEX_RANKS,
  GAME_PLATFORMS_EMOGI,
  PC_ONLY_EMOGI,
} from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';
import {
  updatePlayerRankDate,
  getPlayerPlatform,
} from '../utils/player-data-manager';
import { logApp } from '../utils/logger';
import { debounceUpdateRoleCountMessage } from '../helpers/debounce-update-role-count';
import { ensureCommonApexRole } from '../utils/role-helper';
import { getRankEmoji } from '../utils/emoji-helper';

/**
 * Maneja la gestión de plataforma para usuarios sin rango
 * @param interaction Interacción del botón
 * @param selectedRank Rango seleccionado opcionalmente para asignar junto con la plataforma
 */
export async function handleManagePlatform(
  interaction: ButtonInteraction,
  selectedRank?: (typeof APEX_RANKS)[0]
) {
  if (!interaction.guild || !interaction.member) return;
  const member = interaction.member as GuildMember;

  await logApp(
    `[Interacción] ${interaction.user.tag} abrió gestión de plataforma.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    // Obtener la plataforma actual del usuario desde la base de datos
    const currentPlatform = await getPlayerPlatform(
      interaction.guild.id,
      member.id
    );

    // Buscar información detallada de la plataforma actual
    const currentPlatformInfo = APEX_PLATFORMS.find(
      (p) => p.apiName === currentPlatform
    );

    // Crear embed informativo con el estado actual de la plataforma
    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(GAME_PLATFORMS_EMOGI + ' Gestionar mi Plataforma')
      .setDescription(
        currentPlatformInfo
          ? `**Plataforma actual:** ${
              currentPlatformInfo.id || PC_ONLY_EMOGI
            } **${
              currentPlatformInfo.label
            }**\n\nSelecciona una nueva plataforma si deseas cambiarla.`
          : `**No tienes ninguna plataforma seleccionada.**\n\nSelecciona tu plataforma de Apex Legends para poder elegir un rango.`
      );

    // Crear botones interactivos para cada plataforma disponible
    const platformButtons = APEX_PLATFORMS.map((platform) =>
      new ButtonBuilder()
        .setCustomId(
          selectedRank
            ? `set_platform_and_rank_${platform.shortId}_${selectedRank.shortId}`
            : `set_platform_${platform.shortId}`
        )
        .setLabel(platform.label)
        .setEmoji(platform.id || PC_ONLY_EMOGI)
        .setStyle(
          platform.apiName === currentPlatform
            ? ButtonStyle.Success // Verde para la plataforma actual
            : ButtonStyle.Secondary // Gris para las demás
        )
    );

    // Organizar botones en una fila de acción
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      platformButtons
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row, createCloseButtonRow()],
    });
  } catch (error) {
    console.error('Error al mostrar gestión de plataforma:', error);

    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription('Hubo un error al cargar la gestión de plataforma.');

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}

export async function handleSetPlatform(interaction: ButtonInteraction) {
  const { customId, member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const isWithRank = customId.includes('_and_rank_');
  const parts = customId
    .replace('set_platform', '')
    .replace('_and_rank', '')
    .split('_');
  const platformShortId = parts[1];
  const rankShortId = isWithRank ? parts[2] : undefined;

  const selectedPlatform = APEX_PLATFORMS.find(
    (p) => p.shortId === platformShortId
  );

  if (!selectedPlatform) return;

  const selectedRank = rankShortId
    ? APEX_RANKS.find((r) => r.shortId === rankShortId)
    : undefined;

  await logApp(
    `[Interacción] ${interaction.user.tag} cambió a plataforma '${
      selectedPlatform.label
    }'${selectedRank ? ` y rango '${selectedRank.label}'` : ''}.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    // Actualizar la plataforma en la base de datos (y rango si aplica)
    await updatePlayerRankDate(
      guild.id,
      member.id,
      selectedRank?.shortId,
      selectedPlatform.apiName
    );

    // Asignar roles
    const botMember = guild.members.me;
    if (!botMember) {
      throw new Error('Bot not in guild');
    }

    if (!botMember.permissions.has('ManageRoles')) {
      throw new Error('Bot missing ManageRoles permission');
    }

    // Asignar rol de plataforma
    const platformRole = guild.roles.cache.find(
      (role) => role.name === selectedPlatform.roleName
    );
    if (platformRole) {
      if (botMember.roles.highest.position <= platformRole.position) {
        throw new Error('Bot role hierarchy too low for platform role');
      }
      // Remover roles de plataforma anteriores
      const otherPlatformRoles = APEX_PLATFORMS.filter(
        (p) => p.shortId !== platformShortId
      ).map((p) => p.roleName);

      const rolesToRemove = member.roles.cache.filter((role) =>
        otherPlatformRoles.includes(role.name)
      );

      await member.roles.remove(rolesToRemove);
      await member.roles.add(platformRole);
    }

    // Si hay rango seleccionado, asignar también
    if (selectedRank) {
      // Remover rangos anteriores
      const rankRolesToRemove = member.roles.cache.filter((role) =>
        APEX_RANKS.some(
          (rank) =>
            rank.roleName === role.name && rank.shortId !== selectedRank.shortId
        )
      );

      if (rankRolesToRemove.size > 0) {
        await member.roles.remove(rankRolesToRemove);
      }

      // Asignar nuevo rango
      const rankRole = guild.roles.cache.find(
        (role) => role.name === selectedRank.roleName
      );
      if (rankRole) {
        if (botMember.roles.highest.position <= rankRole.position) {
          throw new Error('Bot role hierarchy too low for rank role');
        }
        await member.roles.add(rankRole);
      }

      // Asegurar que tenga el rol común de Apex
      await ensureCommonApexRole(member);
    }

    const successEmbed = new EmbedBuilder()
      .setColor(
        selectedRank
          ? parseInt(selectedRank.color.replace('#', ''), 16)
          : '#2ecc71'
      )
      .setTitle('✅ Actualización Completada')
      .setDescription(
        selectedRank
          ? `${getRankEmoji(guild.client, selectedRank)} **${
              selectedRank.label
            }**\n${selectedPlatform.id || PC_ONLY_EMOGI} **${
              selectedPlatform.label
            }**\n\nTu rango y plataforma han sido actualizados correctamente.`
          : `${selectedPlatform.id || PC_ONLY_EMOGI} **${
              selectedPlatform.label
            }**\n\nTu plataforma ha sido actualizada correctamente.`
      );

    await interaction.editReply({
      embeds: [successEmbed],
      components: [createCloseButtonRow()],
    });

    // Actualizar mensajes de estado en background con debounce
    debounceUpdateRoleCountMessage(guild);
  } catch (error) {
    console.error('Error al cambiar plataforma:', error);

    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription('Hubo un error al actualizar. Inténtalo de nuevo.');

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
