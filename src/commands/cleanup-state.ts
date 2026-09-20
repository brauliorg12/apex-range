import {
  MessageFlags,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import { cleanupInvalidMessageReferences } from '../utils/message-cleanup';
import { getServerLogger } from '../utils/server-logger';

/**
 * Definición del comando /cleanup-state para Discord.
 */
export const data = new SlashCommandBuilder()
  .setName('cleanup-state')
  .setDescription(
    'Limpia referencias inválidas a mensajes eliminados del estado del bot.'
  );

/**
 * Ejecuta el comando cleanup-state.
 * Este comando limpia las referencias a mensajes que ya no existen en Discord,
 * lo cual es útil cuando los mensajes han sido eliminados manualmente.
 * @param interaction La interacción del comando.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) return;

  // Crear logger específico para este servidor
  const logger = getServerLogger(interaction.guild.id, interaction.guild.name);

  logger.info('=== INICIANDO CLEANUP-STATE ===');
  logger.info(`Usuario: ${interaction.user.tag} (${interaction.user.id})`);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Ejecutar limpieza de referencias inválidas
    await cleanupInvalidMessageReferences(
      interaction.guild.id,
      interaction.client
    );

    logger.info('Limpieza completada exitosamente');

    await interaction.editReply({
      content: `✅ **Limpieza completada**

Se han eliminado las referencias a mensajes que ya no existen en Discord.

💡 **Recomendación:** Ejecuta \`/setup-roles\` para recrear el panel completo si es necesario.`,
    });
  } catch (error) {
    logger.error('Error durante la limpieza:', error);

    await interaction.editReply({
      content:
        '❌ Ocurrió un error durante la limpieza. Revisa los logs del bot.',
    });
  }
}
