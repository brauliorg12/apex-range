import { ChatInputCommandInteraction, Client } from 'discord.js';
import { logInteraction, logApp } from '../../utils/logger';

/**
 * Maneja interacciones de comandos de chat input
 * @param interaction La interacción del comando
 * @param client El cliente de Discord
 * @returns Promise<void>
 */
export async function handleChatInputCommand(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  await logInteraction({
    type: 'ChatInputCommand',
    userTag: interaction.user.tag,
    userId: interaction.user.id,
    guildName: interaction.guild!.name,
    guildId: interaction.guild!.id,
    commandName: interaction.commandName,
    details: `Options: ${JSON.stringify(interaction.options?.data ?? {})}`,
  });

  const commands = (client as any).commands;

  const command = commands.get(interaction.commandName);
  if (!command) {
    await logApp(
      `[Advertencia] Comando desconocido: ${interaction.commandName}`
    );
    return;
  }
  try {
    await command.execute(interaction);
    await logApp(
      `[Interacción] Comando '${interaction.commandName}' ejecutado por ${interaction.user.tag}.`
    );
  } catch (error) {
    await logApp(
      `[ERROR] Error al ejecutar el comando '${interaction.commandName}': ${error}`
    );
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '¡Hubo un error al ejecutar este comando!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: '¡Hubo un error al ejecutar este comando!',
        ephemeral: true,
      });
    }
  }
}
