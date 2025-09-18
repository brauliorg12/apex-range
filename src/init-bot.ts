import { Client, Events } from 'discord.js';
import { initializeExistingGuilds } from './init/guild-initializer';
import { setupGuildEvents } from './init/guild-events';
import { setupNewGuildHandler } from './init/new-guild-handler';
import { setupGuildDeleteHandler } from './init/guild-delete-handler';
import { logApp } from './utils/logger';

/**
 * Inicializa el bot configurando todos los eventos y handlers necesarios.
 * Esta función es el punto de entrada principal para la configuración del bot
 * después de que el cliente de Discord esté listo.
 *
 * Configura:
 * - Inicialización de guilds existentes
 * - Eventos de miembros y presencia
 * - Manejo de nuevos guilds
 * - Manejo de eliminación de guilds
 *
 * @param client - El cliente de Discord que debe estar listo.
 */
export async function initBot(client: Client): Promise<void> {
  client.once(Events.ClientReady, async (readyClient) => {
    try {
      logApp('Iniciando configuración del bot...');

      // Inicializar guilds existentes con configuración previa
      await initializeExistingGuilds(readyClient);

      // Configurar eventos globales de guilds
      setupGuildEvents(readyClient);

      // Configurar handler para nuevos guilds
      setupNewGuildHandler(readyClient);

      // Configurar handler para eliminación de guilds
      setupGuildDeleteHandler(readyClient);

      logApp('Bot inicializado completamente y listo para operar.');
    } catch (error) {
      logApp(`ERROR durante la inicialización del bot: ${error}`);
      console.error('Error durante la inicialización del bot:', error);
    }
  });
}
