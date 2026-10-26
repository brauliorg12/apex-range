import * as dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { loadCommands } from './command-loader';
import { registerInteractionHandler } from './interaction-handler';
import { initBot } from './init-bot';
import { startHealthServer } from './health-server';
import { getActiveRanks } from './models/rank-catalog';
import { logApp } from './utils/logger';

const LOCK_FILE = path.join(__dirname, '../.bot-lock');

/**
 * Verifica si ya hay una instancia del bot corriendo.
 */
async function checkDuplicateInstance(): Promise<boolean> {
  try {
    const data = await fs.readFile(LOCK_FILE, 'utf8');
    const { pid, timestamp } = JSON.parse(data);

    // Verificar si el proceso está vivo
    try {
      process.kill(pid, 0); // Signal 0 solo verifica si existe
      const age = Date.now() - timestamp;
      if (age < 300000) {
        // 5 minutos
        await logApp(
          `[App] Ya hay una instancia del bot corriendo (PID: ${pid}). ` +
            'Saliendo sin iniciar otra.'
        ).catch(() => {});
        console.error(
          `[ERROR] Ya hay una instancia del bot corriendo (PID: ${pid}). Saliendo...`
        );
        return true;
      }
    } catch {
      // Proceso no existe, limpiar lock
      await fs.unlink(LOCK_FILE).catch(() => {});
    }
  } catch {
    // No hay lock o error, continuar
  }
  return false;
}

/**
 * Crea el archivo de lock para esta instancia.
 */
async function createLockFile(): Promise<void> {
  const lockData = {
    pid: process.pid,
    timestamp: Date.now(),
    version: process.env.npm_package_version || 'unknown',
  };
  await fs.writeFile(LOCK_FILE, JSON.stringify(lockData, null, 2));
}

/**
 * Limpia el archivo de lock al salir.
 */
async function cleanupLockFile(): Promise<void> {
  try {
    await fs.unlink(LOCK_FILE);
  } catch {
    // Ignorar errores
  }
}

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
  // Verificar instancia duplicada
  if (await checkDuplicateInstance()) {
    process.exit(1);
  }

  // Crear lock file
  await createLockFile();

  const version = process.env.npm_package_version || 'unknown';
  await logApp(`[App] Iniciando Apex Range v${version}`).catch(() => {});

  const activeRanks = getActiveRanks();
  await logApp(
    `[App] Catálogo de rangos activo: ${activeRanks.length} rangos`
  ).catch(() => {});

  // Cleanup al salir
  process.on('exit', cleanupLockFile);
  process.on('SIGINT', async () => {
    await logApp('[App] SIGINT recibido; cerrando bot.').catch(() => {});
    await cleanupLockFile();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await logApp('[App] SIGTERM recibido; cerrando bot.').catch(() => {});
    await cleanupLockFile();
    process.exit(0);
  });

  await loadCommands(client); // Carga y registra los comandos
  registerInteractionHandler(client); // Registra los handlers de interacciones

  // Inicializar el bot con todos los módulos
  await initBot(client);

  client.login(process.env.DISCORD_TOKEN); // Inicia sesión
})();
