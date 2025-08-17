import { Guild } from 'discord.js';
import { APEX_RANKS } from '../constants';

/**
 * Obtiene el emoji personalizado para un rango de Apex.
 * Si no lo encuentra, devuelve el icono de texto de respaldo.
 * @param guild El servidor donde buscar el emoji.
 * @param rank El objeto de rango de Apex.
 * @returns Una promesa que resuelve al emoji como string o el icono de texto.
 */
export async function getRankEmoji(
  guild: Guild,
  rank: (typeof APEX_RANKS)[0]
): Promise<string> {
  const match = rank.id.match(/<a?:.*:(\d+)>/);
  if (!match || !match[1]) {
    // Si el ID en constants.ts no tiene el formato de emoji, usa el icono de texto.
    return rank.icon;
  }
  const emojiId = match[1];

  try {
    const emoji = await guild.emojis.fetch(emojiId);
    return emoji.toString();
  } catch (error) {
    console.error(
      `No se pudo encontrar el emoji con ID ${emojiId}. Usando icono de texto de respaldo.`
    );
    // Si fetch falla, devuelve el icono de texto como alternativa.
    return rank.icon;
  }
}
