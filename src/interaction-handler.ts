import { Interaction, Client, Events } from 'discord.js';
import { handleChatInputCommand } from './interactions/handlers/chat-input-command';
import { handleUserContextMenuCommand } from './interactions/handlers/user-context-menu-command';
import { handleButton } from './interactions/handlers/button';
import { handleStringSelectMenu } from './interactions/handlers/string-select-menu';
import { handleModalSubmit } from './interactions/handlers/modal-submit';

/**
 * Registra el manejador principal de interacciones del bot.
 * Procesa comandos, botones, menús select y modales,
 * gestionando la lógica y los errores de cada tipo de interacción.
 * @param client El cliente de Discord
 */
export function registerInteractionHandler(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.guild) return;

    if (interaction.isChatInputCommand()) {
      await handleChatInputCommand(interaction, client);
    } else if (interaction.isUserContextMenuCommand()) {
      await handleUserContextMenuCommand(interaction, client);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleStringSelectMenu(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
  });
}
