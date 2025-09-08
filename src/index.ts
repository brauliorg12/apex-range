import '../config/env';
import { Client, GatewayIntentBits } from 'discord.js';
import { loadCommands } from './command-loader';
import { registerInteractionHandler } from './interaction-handler';
import { initBot } from './init-bot';
import { startHealthServer } from './health-server';

/**
 * Inicia el servidor HTTP de salud para monitoreo (endpoint /health).
 */
startHealthServer();

/**
 * Crea la instancia principal del bot de Discord con los intents necesarios.
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildExpressions,
  ],
});

/**
 * Inicializa el bot:
 * - Carga los comandos slash y de contexto.
 * - Registra el handler de interacciones (botones, selects, etc).
 * - Inicializa la lógica principal del bot (panel, presencia, eventos).
 * - Inicia sesión con el token de Discord.
 */
(async () => {
  await loadCommands(client); // Carga y registra los comandos
  registerInteractionHandler(client); // Registra los handlers de interacciones
  await initBot(client); // Inicializa el bot y panel
  client.login(process.env.DISCORD_TOKEN); // Inicia sesión
})();
