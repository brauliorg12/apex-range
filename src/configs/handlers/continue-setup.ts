import { ButtonInteraction } from 'discord.js';
import { getServerLogger } from '../../utils/server-logger';
import { performSetup } from '../../helpers/setup-roles';

/**
 * Handler para continuar con el setup después de crear roles
 * @param interaction La interacción del botón que activó este handler
 * @returns Promise<void> No retorna valor, maneja la interacción directamente
 */
export async function handleContinueSetup(interaction: ButtonInteraction) {
  if (!interaction.isButton() || interaction.customId !== 'continue_setup')
    return;

  if (!interaction.guild || !interaction.channel) return;

  // Crear logger específico para este servidor
  const logger = getServerLogger(interaction.guild.id, interaction.guild.name);

  // Actualizar el mensaje para mostrar que está procesando
  await interaction.update({
    content: '🔄 Ejecutando configuración completa...',
    embeds: [],
    components: [],
  });

  try {
    // Ejecutar el setup completo
    const channel = interaction.channel as any; // TextChannel
    const result = await performSetup(channel, interaction as any, logger);

    // Responder con el resultado
    await interaction.editReply({
      content: result.content,
    });

    logger.info('Setup completado desde botón');
  } catch (error) {
    logger.error('Error en setup desde botón:', error);
    await interaction.editReply({
      content: '❌ Ocurrió un error durante la configuración. Revisa los logs.',
    });
  }
}
