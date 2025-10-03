import { Guild } from 'discord.js';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { logApp } from '../utils/logger';

// Map para debounce de actualizaciones en background
const updateTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Actualiza mensajes de roles con debounce para evitar múltiples llamadas rápidas.
 * Espera un delay antes de ejecutar, cancelando actualizaciones previas si llegan nuevas.
 * @param guild El servidor de Discord.
 * @param delay Tiempo de espera en ms (default 5000).
 */
export function debounceUpdateRoleCountMessage(
  guild: Guild,
  delay: number = 5000
) {
  const guildId = guild.id;

  const existingTimeout = updateTimeouts.get(guildId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  const timeout = setTimeout(() => {
    updateTimeouts.delete(guildId);
    updateRoleCountMessage(guild).catch((err) =>
      logApp(`Error en actualización debounced para ${guild.name}: ${err}`)
    );
  }, delay);

  updateTimeouts.set(guildId, timeout);
}
