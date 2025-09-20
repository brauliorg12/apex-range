import { ButtonInteraction } from 'discord.js';

/**
 * Handler para continuar con el setup después de crear roles
 * @param interaction La interacción del botón que activó este handler
 * @returns Promise<void> No retorna valor, maneja la interacción directamente
 */
export async function handleContinueSetup(interaction: ButtonInteraction) {
  if (!interaction.isButton() || interaction.customId !== 'continue_setup')
    return;

  // TODO revisar
  // Limpiar el mensaje y mostrar instrucciones
  await interaction.update({
    content: '🔄 Continuando con la configuración...',
    embeds: [],
    components: [],
  });

  // Responder con instrucciones
  await interaction.followUp({
    content:
      '✅ **¡Los roles han sido creados exitosamente!**\n\n' +
      'Ahora puedes ejecutar nuevamente el comando `/setup-roles` para completar la configuración.',
    ephemeral: true,
  });
}
