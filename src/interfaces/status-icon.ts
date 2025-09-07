import { PresenceStatus } from 'discord.js';

/**
 * Devuelve el emoji de estado según PresenceStatus.
 */
export const getStatusIcon = (status?: PresenceStatus): string => {
  switch (status) {
    case 'online':
      return '🟢';
    case 'idle':
      return '🌙';
    case 'dnd':
      return '⛔';
    case 'offline':
      return '⚫';
    case 'invisible':
      return '⚫';
    default:
      return '❔';
  }
};
