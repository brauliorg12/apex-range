import { ButtonInteraction, GuildMember, EmbedBuilder } from 'discord.js';
import { APEX_PLATFORMS, PC_ONLY_EMOGI } from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';
import { updatePlayerRankDate } from '../utils/player-data-manager';
import { logApp } from '../utils/logger';

/**
 * Maneja la asignación de plataforma seleccionada por el usuario.
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function handlePlatformAssignment(interaction: ButtonInteraction) {
  const { customId, member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const platformShortId = customId.replace('platform_', '');
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
        `${selectedPlatform.icon || PC_ONLY_EMOGI} **${
          selectedPlatform.label
        }**\n\nTu plataforma ha sido actualizada correctamente.`
      );

    await interaction.editReply({
      embeds: [successEmbed],
      components: [createCloseButtonRow()],
    });
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
