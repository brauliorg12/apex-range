import { Client, Guild } from 'discord.js';
import { logApp } from '../utils/logger';

/**
 * Imprime un banner informativo en la consola al conectar el bot a un servidor.
 *
 * @param client - Instancia del cliente de Discord.js, utilizada para acceder a información del bot.
 * @param guild - Objeto Guild que representa el servidor de Discord donde se ejecuta el bot.
 * @param channelInfo - Cadena de texto con detalles adicionales sobre el canal, como nombre o ID.
 */
export function printBanner(client: Client, guild: Guild, channelInfo: string) {
  // Obtener la fecha y hora actual
  const now = new Date();
  // Formato 24h para evitar ambiguedad entre 00:05 y 12:05.
  const fechaLocal = now.toLocaleString('es-AR', { hour12: false });
  const fechaUTC = now.toISOString();

  // Imprimir el banner con colores ANSI
  console.log('\x1b[36m');
  console.log('   🛡️  Apex Discord Bot - Panel de Jugadores 🛡️');
  console.log('   by Burlon23 - CubaNova');
  console.log('\x1b[0m');
  console.log('\x1b[32m%s\x1b[0m', '🟢 Bot conectado');
  console.log(`[App] Usuario Discord: ${client.user?.tag}`);
  console.log(`[App] Inicio: ${fechaLocal} (local) | ${fechaUTC} (UTC)`);
  console.log(`[App] Servidor: ${guild.name} (${guild.id})`);
  console.log(`[App] ${channelInfo}`);

  logApp('\x1b[36m');
  logApp('   🛡️  Apex Discord Bot - Panel de Jugadores 🛡️');
  logApp('   by Burlon23 - CubaNova');
  logApp('\x1b[0m');
  logApp('\x1b[32m%s\x1b[0m', '🟢 Bot conectado');
  logApp(`[App] Usuario Discord: ${client.user?.tag}`);
  logApp(`[App] Inicio: ${fechaLocal} (local) | ${fechaUTC} (UTC)`);
  logApp(`[App] Servidor: ${guild.name} (${guild.id})`);
  logApp(`[App] ${channelInfo}`);

  // Registrar el evento en el log del sistema
  logApp(
    `Bot conectado como ${client.user?.tag} en guild ${guild.name} (${guild.id}). ${channelInfo}`
  );
}
