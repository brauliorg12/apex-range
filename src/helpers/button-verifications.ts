import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { REQUIRED_PERMISSIONS } from '../models/required-permissions';

/**
 * Verifica el acceso al canal tanto para el usuario como para el bot durante una interacción de botón.
 *
 * Esta función realiza dos verificaciones críticas:
 * 1. Confirma que el usuario que presionó el botón tiene permisos para ver el canal
 * 2. Verifica que el bot tiene acceso al canal donde debe responder
 *
 * Si alguna verificación falla, envía un mensaje de error al usuario y registra el problema.
 *
 * @param interaction - La interacción de botón que activó la verificación
 * @param channel - El canal de texto donde se realiza la verificación
 * @param logger - Instancia del logger del servidor para registrar eventos
 * @returns Promise<boolean> - true si ambos tienen acceso, false si hay algún problema
 */
export async function verifyChannelAccessForButton(
  interaction: ButtonInteraction,
  channel: any,
  logger: any
): Promise<boolean> {
  // Verificar que el usuario tenga permisos para ver el canal
  if (!channel.permissionsFor(interaction.user)?.has('ViewChannel')) {
    logger.warn(
      `Usuario ${interaction.user.tag} no tiene acceso al canal #${channel.name}`
    );
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Acceso Denegado')
      .setDescription('No tienes permisos para acceder a este canal.')
      .setColor(0xff0000);

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [],
    });
    return false;
  }

  // Verificar que el bot tenga permisos para ver el canal
  if (
    !channel.permissionsFor(interaction.guild?.members.me)?.has('ViewChannel')
  ) {
    logger.warn(`Bot no tiene acceso al canal #${channel.name}`);
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error de Permisos')
      .setDescription('El bot no tiene permisos para acceder a este canal.')
      .setColor(0xff0000);

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [],
    });
    return false;
  }

  return true;
}

/**
 * Verifica que el bot tenga todos los permisos necesarios en el canal especificado durante una interacción de botón.
 *
 * Esta función comprueba una lista completa de permisos críticos que el bot necesita para funcionar
 * correctamente en el canal. Utiliza la constante centralizada REQUIRED_PERMISSIONS para mantener
 * consistencia con otras partes del sistema.
 *
 * Si faltan permisos, proporciona una lista detallada de los permisos faltantes en un embed
 * informativo para que el usuario pueda corregir la configuración.
 *
 * @param interaction - La interacción de botón que activó la verificación
 * @param channel - El canal de texto donde se verifican los permisos del bot
 * @param logger - Instancia del logger del servidor para registrar problemas de permisos
 * @returns Promise<boolean> - true si el bot tiene todos los permisos necesarios, false si faltan permisos
 */
export async function verifyBotPermissionsForButton(
  interaction: ButtonInteraction,
  channel: any,
  logger: any
): Promise<boolean> {
  const botMember = interaction.guild?.members.me;
  if (!botMember) {
    logger.error('No se pudo obtener el miembro del bot');
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('No se pudo verificar los permisos del bot.')
      .setColor(0xff0000);

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [],
    });
    return false;
  }

  const requiredPermissions = REQUIRED_PERMISSIONS.map((perm) => perm.name);

  const missingPermissions = requiredPermissions.filter(
    (perm) => !channel.permissionsFor(botMember)?.has(perm)
  );

  if (missingPermissions.length > 0) {
    logger.warn(
      `Bot falta permisos en #${channel.name}: ${missingPermissions.join(', ')}`
    );
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Permisos Insuficientes')
      .setDescription(
        `El bot necesita los siguientes permisos en este canal:\n\n${missingPermissions
          .map((perm) => `• \`${perm}\``)
          .join('\n')}\n\n` +
          'Por favor, concede estos permisos al bot y vuelve a intentar.'
      )
      .setColor(0xff0000);

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [],
    });
    return false;
  }

  return true;
}
