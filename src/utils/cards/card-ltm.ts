import { EmbedBuilder } from 'discord.js';
import { formatTimeLeft, formatNextMap, formatCacheAge } from './formatters';

/**
 * Construye un embed de Discord con información de la Mixtape (Limited Time Mode) de Apex Legends.
 *
 * @param ltm - Objeto con datos de la mixtape, incluyendo mapas actuales y próximos, tiempos restantes y nombres de eventos.
 * @param cacheInfo - Objeto con indicadores booleanos sobre si los datos están en cache (e.g., mapRotation).
 * @param cacheTimestamps - Objeto opcional con timestamps de cuando se cargaron los datos en cache, para calcular la antigüedad.
 * @returns Un objeto EmbedBuilder configurado con el modo de juego, mapa actual, tiempo restante y próximo mapa.
 */
export function buildLtmEmbed(
  ltm: any,
  cacheInfo: Record<string, boolean>,
  cacheTimestamps?: Record<string, number | undefined>
) {
  const hasData =
    ltm &&
    ltm.current &&
    ltm.current.map &&
    ltm.current.remainingTimer &&
    ltm.current.eventName;
  const footerText =
    cacheInfo.mapRotation && hasData && cacheTimestamps?.mapRotation
      ? `⚠️ Datos en cache cargados ${formatCacheAge(
          cacheTimestamps.mapRotation
        )}`
      : undefined;

  const embed = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('🎲 Mixtape')
    .setImage(hasData ? ltm.current.asset : null)
    .addFields(
      {
        name: 'Modo de juego:',
        value: hasData
          ? `\`\`\`${ltm.current.eventName}\`\`\``
          : 'No disponible',
        inline: true,
      },
      {
        name: 'Mapa actual:',
        value: hasData ? `\`\`\`${ltm.current.map}\`\`\`` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante:',
        value: hasData
          ? `\`\`\`${formatTimeLeft(ltm.current.remainingTimer)}\`\`\``
          : 'No disponible',
        inline: true,
      }
    );

  // Agregar campo para próximo mapa si hay datos
  if (ltm?.next?.map) {
    embed.addFields({
      name: 'Próximo mapa:',
      value: formatNextMap(
        ltm.next.map,
        ltm.next.readableDate_start,
        ltm.next.eventName
      ),
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
