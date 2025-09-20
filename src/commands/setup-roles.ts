import {
  SlashCommandBuilder,
  TextChannel,
  ChatInputCommandInteraction,
} from 'discord.js';
import { getServerLogger } from '../utils/server-logger';
import { cleanupExistingMessages } from '../helpers/cleanup-existing-messages';
import { cleanupInvalidMessageReferences } from '../utils/message-cleanup';
import {
  verifyAdminPermissions,
  verifyRolesExist,
  verifyChannelAccess,
  verifyBotPermissions,
  createRoleSelectionMessage,
  createStatsMessage,
  pinSetupMessages,
  saveSetupState,
  finalizeSetup,
} from '../helpers/setup-roles';

/**
 * Definición del comando /setup-roles para Discord.
 */
export const data = new SlashCommandBuilder()
  .setName('setup-roles')
  .setDescription(
    'Configura los paneles de selección de roles y estadísticas.'
  );
/**
 * Ejecuta el comando setup-roles.
 * Este comando configura completamente el bot de Apex Legends en el servidor.
 *
 * Pasos de configuración:
 * 1. Verificar permisos de administrador
 * 2. Deferir respuesta para evitar timeout
 * 3. Limpiar referencias inválidas a mensajes
 * 4. Verificar existencia de roles de rango
 * 5. Identificar y validar canal
 * 6. Verificar acceso al canal
 * 7. Verificar permisos del bot
 * 8. Limpiar mensajes existentes
 * 9. Crear mensajes de selección de rango y estadísticas
 * 10. Fijar mensajes en el canal
 * 11. Guardar estado de configuración
 * 12. Finalizar setup con actualizaciones
 * 13. Enviar respuesta final al usuario
 *
 * @param interaction La interacción del comando.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) return;

  // Crear logger específico para este servidor
  const logger = getServerLogger(interaction.guild.id, interaction.guild.name);

  // PASO 1: Verificar permisos de administrador
  if (!(await verifyAdminPermissions(interaction, logger))) return;

  // PASO 2: Deferir respuesta inmediatamente para evitar timeout
  await interaction.deferReply({ ephemeral: true });
  logger.info('Respuesta diferida correctamente');

  // Log detallado para debugging
  logger.info('=== INICIANDO SETUP-ROLES ===');
  logger.info(
    `Canal: ${
      interaction.channel && 'name' in interaction.channel
        ? interaction.channel.name
        : 'Desconocido'
    } (${interaction.channel?.id || 'Desconocido'})`
  );
  logger.info(`Usuario: ${interaction.user.tag} (${interaction.user.id})`);

  // PASO 3: Limpiar referencias inválidas a mensajes antes de configurar
  try {
    await cleanupInvalidMessageReferences(
      interaction.guild.id,
      interaction.client
    );
    logger.info('Referencias inválidas limpiadas correctamente');
  } catch (error) {
    logger.warn('Error limpiando referencias inválidas:', error);
  }

  // PASO 4: Verificar que los roles de rango existen
  if (!(await verifyRolesExist(interaction, logger))) {
    logger.info('Roles faltantes, esperando interacción del usuario');
    return;
  }
  logger.info('Verificación de roles completada correctamente');

  // PASO 5: Identificar y validar canal
  const channel = interaction.channel as TextChannel;
  if (!channel) {
    logger.error('No se pudo identificar el canal actual');
    await interaction.editReply({
      content: '❌ Error: No se pudo identificar el canal actual.',
    });
    return;
  }

  logger.info(`Canal identificado: #${channel.name} (${channel.id})`);

  // PASO 6: Verificar acceso al canal
  if (!(await verifyChannelAccess(interaction, channel, logger))) {
    logger.info('Falta acceso al canal');
    return;
  }
  logger.info('Acceso al canal verificado');

  // PASO 7: Verificar permisos del bot
  if (!(await verifyBotPermissions(interaction, channel, logger))) {
    logger.info('Faltan permisos del bot');
    return;
  }
  logger.info('Permisos del bot verificados');

  // PASO 8: Limpiar mensajes existentes
  await cleanupExistingMessages(channel, logger);
  logger.info('Mensajes existentes limpiados');

  // PASO 9: Crear mensajes de selección de rango y estadísticas
  const roleSelectionMessage = await createRoleSelectionMessage(
    channel,
    logger
  );
  const roleCountMessage = await createStatsMessage(channel, logger);
  logger.info('Mensajes de selección y estadísticas creados');

  // PASO 10: Fijar ambos mensajes
  await pinSetupMessages(
    roleSelectionMessage,
    roleCountMessage,
    channel,
    interaction,
    logger
  );
  logger.info('Mensajes fijados');

  // PASO 11: Guardar estado de la configuración
  await saveSetupState(
    roleCountMessage,
    roleSelectionMessage,
    channel,
    interaction.guild.id,
    logger
  );
  logger.info('Estado guardado');

  // PASO 12: Finalizar configuración con actualización de presencia y estadísticas
  const { statsUpdated, elapsed } = await finalizeSetup(
    channel,
    interaction.guild,
    interaction.client,
    roleCountMessage,
    logger
  );
  logger.info('Setup finalizado');

  // PASO 13: Respuesta final detallada
  await interaction.editReply({
    content: `✅ **¡Configuración completada en ${elapsed} segundos!**

📊 **Estadísticas:** ${
      statsUpdated ? '✅ Actualizadas' : '⚠️ Error - revisa logs'
    }
🔄 **Presencia global actualizada**

📌 _Puedes eliminar los mensajes fijados que no sean de la App para mantener el canal ordenado._

💡 Ejemplo:
*"Apex Range ha fijado un mensaje en este canal. Mira todos los mensajes fijados."*

🏆 ¡Listo para usar el panel de rangos!`,
  });
  logger.info('Respuesta final enviada');
}
