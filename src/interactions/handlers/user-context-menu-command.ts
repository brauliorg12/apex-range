import { UserContextMenuCommandInteraction, Client } from 'discord.js';
import { logInteraction } from '../../utils/logger';

/**
 * Maneja interacciones de comandos de contexto de usuario
 * @param interaction La interacción del comando de contexto
 * @param client El cliente de Discord
 * @returns Promise<void>
 */
export async function handleUserContextMenuCommand(
  interaction: UserContextMenuCommandInteraction,
  client: Client
) {
  await logInteraction({
    type: 'UserContextMenuCommand',
    userTag: interaction.user.tag,
    userId: interaction.user.id,
    guildName: interaction.guild!.name,
    guildId: interaction.guild!.id,
    commandName: interaction.commandName,
  });

  const commands = (client as any).commands;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(
      `[Advertencia] Comando de contexto desconocido: ${interaction.commandName}`
    );
    return;
  }

  try {
    await command.execute(interaction);
    console.log(
      `[Interacción] Comando de contexto '${interaction.commandName}' ejecutado por ${interaction.user.tag}.`
    );
  } catch (error) {
    console.error(
      `[ERROR] Error al ejecutar el comando de contexto '${interaction.commandName}':`,
      error
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
