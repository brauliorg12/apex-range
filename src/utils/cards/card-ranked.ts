import { EmbedBuilder } from 'discord.js';
import { formatTimeLeft, formatCacheAge, formatNextMap } from './formatters';

/**
 * Construye un embed de Discord con información de Battle Royale Ranked de Apex Legends.
 *
 * @param ranked - Objeto con datos de rotación de mapas Ranked, incluyendo mapas actuales y próximos, tiempos restantes y eventos de temporada.
 * @param cacheInfo - Objeto con indicadores booleanos sobre si los datos están en cache (e.g., mapRotation).
 * @param cacheTimestamps - Objeto opcional con timestamps de cuando se cargaron los datos en cache, para calcular la antigüedad.
 * @returns Un objeto EmbedBuilder configurado con el mapa actual, tiempo restante, próximo mapa y info de temporada/cache.
 */
export function buildRankedEmbed(
  ranked: any,
  cacheInfo: Record<string, boolean>,
  cacheTimestamps?: Record<string, number | undefined>
) {
  // Determina si hay datos válidos para mostrar
  const hasData =
    ranked &&
    ranked.current &&
    ranked.current.map &&
    ranked.current.remainingTimer;

  // Prepara el texto del footer si los datos son cacheados
  const footerText =
    cacheInfo.mapRotation && hasData && cacheTimestamps?.mapRotation
      ? `⚠️ Datos en cache cargados ${formatCacheAge(
          cacheTimestamps.mapRotation
        )}`
      : undefined;

  // TODO revisar datos de split y season end de API
  // Construye la descripción con info de split y fin de temporada
  const rankedDescArr = [
    ranked?.current?.eventType === 'split'
      ? `El split termina en ${ranked?.current?.eventEnd || 'N/A'}`
      : '',
    ranked?.current?.seasonEnd
      ? `La temporada termina en ${ranked?.current?.seasonEnd}`
      : '',
  ].filter(Boolean);

  // Construye el embed visual con color, título, imagen y campos principales
  const embed = new EmbedBuilder()
    .setColor('#8e44ad')
    .setTitle(
      '<:Ranked_Tier6_Master:1406723974313934968> Battle Royale | Ranked'
    )
    .setImage(hasData ? ranked.current.asset : null)
    .setDescription(rankedDescArr.length > 0 ? rankedDescArr.join(' • ') : ' ')
    .addFields(
      {
        name: 'Mapa actual:',
        value: hasData ? `\`\`\`${ranked.current.map}\`\`\`` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante:',
        value: hasData
          ? `\`\`\`${formatTimeLeft(ranked.current.remainingTimer)}\`\`\`` // Formatea el tiempo restante
          : 'No disponible',
        inline: true,
      }
    );

  // Agregar campo para próximo mapa si hay datos
  if (ranked?.next?.map) {
    embed.addFields({
      name: 'Próximo mapa:',
      value: formatNextMap(ranked.next.map, ranked.next.readableDate_start),
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
