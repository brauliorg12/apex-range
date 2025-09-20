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

/**
 * Maneja la gestión de plataforma para usuarios sin rango
 * @param interaction Interacción del botón
 */
export async function handleManagePlatform(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.member) return;
  const member = interaction.member as GuildMember;

  await logApp(
    `[Interacción] ${interaction.user.tag} abrió gestión de plataforma.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    // Obtener plataforma actual
    const currentPlatform = await getPlayerPlatform(
      interaction.guild.id,
      member.id
    );
    const currentPlatformInfo = APEX_PLATFORMS.find(
      (p) => p.apiName === currentPlatform
    );

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(GAME_PLATFORMS_EMOGI + ' Gestionar mi Plataforma')
      .setDescription(
        `**Plataforma actual:** ${
          currentPlatformInfo?.id || PC_ONLY_EMOGI
        } **${
          currentPlatformInfo?.label || currentPlatform
        }**\n\nSelecciona tu plataforma de Apex Legends para futuras actualizaciones de rango.`
      );

    // Crear botones para cada plataforma
    const platformButtons = APEX_PLATFORMS.map((platform) =>
      new ButtonBuilder()
        .setCustomId(`set_platform_${platform.shortId}`)
        .setLabel(platform.label)
        .setEmoji(platform.id || PC_ONLY_EMOGI)
        .setStyle(
          platform.apiName === currentPlatform
            ? ButtonStyle.Success
            : ButtonStyle.Secondary
        )
    );

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

/**
 * Maneja la asignación de plataforma desde el botón de gestión
 * @param interaction Interacción del botón
 */
export async function handleSetPlatform(interaction: ButtonInteraction) {
  const { customId, member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const platformShortId = customId.replace('set_platform_', '');
  const selectedPlatform = APEX_PLATFORMS.find(
    (p) => p.shortId === platformShortId
  );

  if (!selectedPlatform) return;

  await logApp(
    `[Interacción] ${interaction.user.tag} cambió a plataforma '${selectedPlatform.label}'.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    // Actualizar la plataforma en la base de datos
    await updatePlayerRankDate(
      guild.id,
      member.id,
      undefined,
      selectedPlatform.apiName
    );

    // Asignar el rol de plataforma
    const platformRole = guild.roles.cache.find(
      (role) => role.name === selectedPlatform.roleName
    );
    if (platformRole) {
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

    const successEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Plataforma Actualizada')
      .setDescription(
        `${selectedPlatform.id || PC_ONLY_EMOGI} **${
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
      .setDescription(
        'Hubo un error al cambiar tu plataforma. Inténtalo de nuevo.'
      );

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
