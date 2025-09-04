import { Client, GuildEmoji } from 'discord.js';
import { ApexRank } from '../interfaces/apex-rank';

// Expresión regular para extraer el ID de un emoji personalizado de Discord.
// Soporta emojis estáticos (<:nombre:id>) y animados (<a:nombre:id>).
const CUSTOM_EMOJI_REGEX = /<a?:.*:(\d+)>/;

/**
 * Obtiene la representación de un emoji para un rango de Apex.
 *
 * La estrategia es la siguiente:
 * 1. Intenta encontrar el emoji en la caché del cliente para asegurar que el bot lo conoce.
 *    Esta es la forma más fiable de garantizar que el emoji es válido y está disponible.
 * 2. Si no se encuentra en la caché, devuelve el string completo del emoji (ej: <:nombre:id>).
 *    Discord podría renderizarlo igualmente si el bot está en el servidor del emoji,
 *    incluso si la caché no está sincronizada.
 * 3. Si el `rank.id` no tiene el formato de un emoji personalizado, se devuelve un
 *    emoji de respaldo en formato Unicode.
 *
 * @param client El cliente del bot para acceder a la caché de emojis.
 * @param rank El objeto de rango de Apex que contiene la información del emoji.
 * @returns Una cadena con la representación del emoji.
 */
export function getRankEmoji(client: Client, rank: ApexRank): string {
  const match = rank.id.match(CUSTOM_EMOJI_REGEX);

  // Si no es un emoji personalizado, devolver el icono de respaldo.
  if (!match || !match[1]) {
    return rank.icon;
  }

  const emojiId = match[1];

  // 1. Intentar encontrar en la caché (método preferido).
  const emojiFromCache: GuildEmoji | undefined =
    client.emojis.cache.get(emojiId);

  if (emojiFromCache) {
    // El emoji existe y el bot lo conoce, devolver su representación completa.
    return emojiFromCache.toString();
  }

  // 2. Como fallback, si no está en caché, devolver el ID completo del emoji.
  //    Esto puede funcionar si la caché está desactualizada.
  return rank.id;
}
