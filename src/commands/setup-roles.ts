import {
  SlashCommandBuilder,
  TextChannel,
  ChatInputCommandInteraction,
} from 'discord.js';
import { getServerLogger } from '../utils/server-logger';
import { cleanupExistingMessages } from '../helpers/cleanup-existing-messages';
import {
  verifyAdminPermissions,
  verifyRolesExist,
  verifyChannelAccess,
  handleSetupError,
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
 * Este comando es solo para administradores y realiza las siguientes acciones:
 * 1. Verifica que todos los roles de rango de Apex existan en el servidor.
 * 2. Envía un mensaje para que los usuarios seleccionen su rango.
 * 3. Envía un mensaje de estadísticas que se mantendrá actualizado.
 * 4. Guarda los IDs de los mensajes en el estado del bot.
 * @param interaction La interacción del comando.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) return;

  // Crear logger específico para este servidor
  const logger = getServerLogger(interaction.guild.id, interaction.guild.name);

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

  // 1. Verificar permisos de administrador con validación detallada
  if (!(await verifyAdminPermissions(interaction, logger))) return;

  // 2. Verificar que los roles de rango existen usando el handler dedicado
  if (!(await verifyRolesExist(interaction, logger))) return;

  const channel = interaction.channel as TextChannel;
  if (!channel) {
    logger.error('No se pudo identificar el canal actual');
    await interaction.editReply({
      content: '❌ Error: No se pudo identificar el canal actual.',
    });
    return;
  }

  logger.info(`Canal identificado: #${channel.name} (${channel.id})`);

  await interaction.deferReply({ ephemeral: true });
  logger.info('Respuesta diferida correctamente');

  try {
    // 3. Verificar acceso al canal con manejo detallado de errores
    if (!(await verifyChannelAccess(interaction, channel, logger))) return;

    // 4. Verificar permisos del bot usando el módulo dedicado
    if (!(await verifyBotPermissions(interaction, channel, logger))) return;

    // 5. Limpiar mensajes existentes antes de crear nuevos
    await cleanupExistingMessages(channel, logger);

    // 6. Crear mensajes de selección de rango y estadísticas
    const roleSelectionMessage = await createRoleSelectionMessage(
      channel,
      logger
    );
    const roleCountMessage = await createStatsMessage(channel, logger);

    // 7. Fijar ambos mensajes
    await pinSetupMessages(
      roleSelectionMessage,
      roleCountMessage,
      channel,
      interaction,
      logger
    );

    // 8. Guardar estado de la configuración
    await saveSetupState(
      roleCountMessage,
      roleSelectionMessage,
      channel,
      interaction.guild.id,
      logger
    );

    // 9. Finalizar configuración con actualización de presencia y estadísticas
    const { statsUpdated, elapsed } = await finalizeSetup(
      channel,
      interaction.guild,
      interaction.client,
      roleCountMessage,
      logger
    );

    // 10. Respuesta final detallada
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
  } catch (error) {
    await handleSetupError(error, interaction, channel, logger);
  }
}
