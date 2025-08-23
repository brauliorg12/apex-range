import { Interaction, Client, Events, Guild } from 'discord.js';
import { handleButtonInteraction } from './button-interactions';
import { handleRankFilterSelect } from './interactions/show-more';
import {
  data as showMyRankCommand,
  execute as showMyRankExecute,
} from './commands/show-my-rank';

export function registerInteractionHandler(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.guild) return;

    const commands = (client as any).commands;

    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) {
        console.warn(
          `[Advertencia] Comando desconocido: ${interaction.commandName}`
        );
        return;
      }
      try {
        await command.execute(interaction);
        console.log(
          `[Interacción] Comando '${interaction.commandName}' ejecutado por ${interaction.user.tag}.`
        );
      } catch (error) {
        console.error(
          `[ERROR] Error al ejecutar el comando '${interaction.commandName}':`,
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
    } else if (interaction.isUserContextMenuCommand()) {
      try {
        if (interaction.commandName === showMyRankCommand.name) {
          await showMyRankExecute(interaction);
        }
      } catch (error) {
        console.error(
          '[ERROR] Error al manejar el comando de contexto:',
          error
        );
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: '¡Hubo un error al procesar tu solicitud!',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '¡Hubo un error al procesar tu solicitud!',
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isButton()) {
      try {
        await handleButtonInteraction(interaction);
        console.log(
          `[Interacción] Botón '${interaction.customId}' procesado exitosamente por ${interaction.user.tag}.`
        );
      } catch (error) {
        console.error(
          `[ERROR] Error al manejar el botón '${interaction.customId}':`,
          error
        );
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: '¡Hubo un error al procesar este botón!',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '¡Hubo un error al procesar este botón!',
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isStringSelectMenu()) {
      try {
        if (interaction.customId === 'RANK_FILTER') {
          await handleRankFilterSelect(interaction);
        }
      } catch (error) {
        console.error('[ERROR] Error al manejar el select:', error);
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: '¡Hubo un error al procesar tu selección!',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '¡Hubo un error al procesar tu selección!',
            ephemeral: true,
          });
        }
      }
    }
  });
}
