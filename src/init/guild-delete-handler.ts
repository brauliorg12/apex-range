import { Client, Events } from 'discord.js';
import { logApp } from '../utils/logger';

/**
 * Configura el evento para cuando el bot es removido de un servidor.
 * Registra el evento y opcionalmente puede limpiar archivos (deshabilitado por defecto).
 *
 * @param client - El cliente de Discord.
 */
export function setupGuildDeleteHandler(client: Client): void {
  client.on(Events.GuildDelete, async (guild) => {
    await handleGuildDelete(guild);
  });
}

/**
 * Maneja la lógica cuando el bot es removido de un servidor.
 * Registra el evento y preserva los archivos JSON para datos históricos.
 *
 * @param guild - El guild del que fue removido el bot.
 */
async function handleGuildDelete(guild: any): Promise<void> {
  logApp(`Bot removido de servidor: ${guild.name} (${guild.id})`);

  // Los archivos JSON se conservan para preservar datos históricos
  // Si deseas limpiar automáticamente, descomenta el código siguiente en el comentario

  /*
  try {
    const fs = require('fs/promises');
    const path = require('path');
    const stateFile = path.join(__dirname, '../../.bot-state', `${guild.id}.json`);
    const playersFile = path.join(__dirname, '../../db', `players_${guild.id}.json`);

    await fs.unlink(stateFile).catch(() => {});
    await fs.unlink(playersFile).catch(() => {});

    logApp(`Archivos limpiados para servidor removido: ${guild.name} (${guild.id})`);
  } catch (error) {
    logApp(`Error limpiando archivos para servidor removido ${guild.id}: ${error}`);
  }
  */
}
