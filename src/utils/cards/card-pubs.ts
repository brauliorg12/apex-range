import { EmbedBuilder } from 'discord.js';
import { formatTimeLeft, formatNextMap, formatCacheAge } from './formatters';

/**
 * Construye un embed de Discord con información de Battle Royale (partidas normales) de Apex Legends.
 *
 * @param br - Objeto con datos de Battle Royale, incluyendo mapas actuales y próximos, tiempos restantes.
 * @param cacheInfo - Objeto con indicadores booleanos sobre si los datos están en cache (e.g., mapRotation).
 * @param cacheTimestamps - Objeto opcional con timestamps de cuando se cargaron los datos en cache, para calcular la antigüedad.
 * @returns Un objeto EmbedBuilder configurado con el mapa actual, tiempo restante y próximo mapa.
 */
export function buildPubsEmbed(
  br: any,
  cacheInfo: Record<string, boolean>,
  cacheTimestamps?: Record<string, number | undefined>
) {
  const hasData =
    br && br.current && br.current.map && br.current.remainingTimer;
  const footerText =
    cacheInfo.mapRotation && hasData && cacheTimestamps?.mapRotation
      ? `⚠️ Datos en cache cargados ${formatCacheAge(
          cacheTimestamps.mapRotation
        )}`
      : undefined;

  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('🗺️ Battle Royale | Normales')
    .setImage(hasData ? br.current.asset : null)
    .addFields(
      {
        name: 'Mapa actual:',
        value: hasData ? `\`\`\`${br.current.map}\`\`\`` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante:',
        value: hasData
          ? `\`\`\`${formatTimeLeft(br.current.remainingTimer)}\`\`\``
          : 'No disponible',
        inline: true,
      }
    );

  // Agregar campo para próximo mapa si hay datos
  if (br?.next?.map) {
    embed.addFields({
      name: 'Próximo mapa:',
      value: formatNextMap(br.next.map, br.next.readableDate_start),
      inline: false,
    });
  }

  // Footer solo con info de cache si aplica
  if (footerText) {
    embed.setFooter({
      text: footerText,
    });
  }

  return embed;
}
