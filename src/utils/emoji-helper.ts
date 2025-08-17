import { Client } from 'discord.js';
import { ApexRank } from '../constants';

/**
 * Obtiene la representación del emoji para un rango de Apex.
 * Intenta encontrar el emoji personalizado en la caché global del cliente. Si no lo encuentra,
 * devuelve el emoji de Unicode de respaldo.
 * @param client El cliente del bot para acceder a la caché global de emojis.
 * @param rank El objeto de rango de Apex.
 * @returns Una cadena con el emoji personalizado o el emoji de respaldo.
 */
export function getRankEmoji(client: Client, rank: ApexRank): string {
  const match = rank.id.match(/<a?:.*:(\d+)>/);
  if (!match || !match[1]) {
    return rank.icon;
  }
  const emojiId = match[1];

  // Buscamos en la caché global del cliente, que contiene emojis de todos los servidores.
  const emoji = client.emojis.cache.get(emojiId);

  if (!emoji) {
    console.warn(
      `[Advertencia de caché] No se pudo encontrar el emoji con ID ${emojiId} en la caché global. ¿El bot está en el servidor que contiene este emoji?`
    );
  }

  return emoji?.toString() ?? rank.icon;
}
