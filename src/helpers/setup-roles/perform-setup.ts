import {
  TextChannel,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import { cleanupExistingMessages } from '../cleanup-existing-messages';
import {
  createRoleSelectionMessage,
  createStatsMessage,
  pinSetupMessages,
  saveSetupState,
  finalizeSetup,
} from '../setup-roles';

/**
 * Función que ejecuta el setup completo después de la confirmación
 * @param channel El canal donde configurar
 * @param interaction La interacción original
 * @param logger El logger del servidor
 */
export async function performSetup(
  channel: TextChannel,
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  logger: any
) {
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
    interaction.guild!.id,
    logger
  );
  logger.info('Estado guardado');

  // PASO 12: Finalizar configuración con actualización de presencia y estadísticas
  const { statsUpdated, elapsed } = await finalizeSetup(
    channel,
    interaction.guild!,
    interaction.client,
    roleCountMessage,
    logger
  );
  logger.info('Setup finalizado');

  // PASO 13: Respuesta final detallada
  return {
    content: `✅ **¡Configuración completada en ${elapsed} segundos!**

📊 **Estadísticas:** ${
      statsUpdated ? '✅ Actualizadas' : '⚠️ Error - revisa logs'
    }
🔄 **Presencia global actualizada**

📌 _Puedes eliminar los mensajes fijados que no sean de la App para mantener el canal ordenado._

💡 Ejemplo:
*"Apex Range ha fijado un mensaje en este canal. Mira todos los mensajes fijados."*

🏆 ¡Listo para usar el panel de rangos!`,
    statsUpdated,
    elapsed,
  };
}
