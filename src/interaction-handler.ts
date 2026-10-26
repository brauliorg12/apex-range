import { Interaction, Client, Events } from 'discord.js';
import { handleChatInputCommand } from './interactions/handlers/chat-input-command';
import { handleUserContextMenuCommand } from './interactions/handlers/user-context-menu-command';
import { handleButton } from './interactions/handlers/button';
import { handleStringSelectMenu } from './interactions/handlers/string-select-menu';
import { handleModalSubmit } from './interactions/handlers/modal-submit';
import { logApp } from './utils/logger';

/**
 * Indica si un error corresponde a una interacción expirada o ya respondida.
 *
 * @param error - Error recibido.
 * @returns `true` si el código de Discord es `10062`.
 */
function isUnknownInteractionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return error.code === 10062;
}

/**
 * Registra el manejador principal de interacciones del bot.
 * Procesa comandos, botones, menús select y modales,
 * gestionando la lógica y los errores de cada tipo de interacción.
 * @param client El cliente de Discord
 */
export function registerInteractionHandler(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.guild) return;

    try {
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
    } catch (error) {
      if (isUnknownInteractionError(error)) {
        await logApp(
          '[Interacción] Interacción expirada o ya respondida; se ignora.'
        ).catch(() => {});
        return;
      }

      await logApp(
        `[Interacción] Error no controlado en guild ${interaction.guild.id}: ${error}`
      ).catch(() => {});
    }
  });
}
