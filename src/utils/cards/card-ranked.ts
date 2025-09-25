import { EmbedBuilder } from 'discord.js';

/**
 * Formatea el tiempo restante en horas, minutos y segundos.
 *
 * @param remaining - Cadena de tiempo en formato "HH:MM:SS" (opcional).
 * @returns Cadena formateada como "X hrs Y mins Z segs" o "N/A" si no hay datos.
 *  Ejemplo: "01:23:45" → "1 hrs 23 mins 45 segs"
 */
function formatTimeLeft(remaining?: string) {
  if (!remaining) return 'N/A';
  const [h, m, s] = remaining.split(':').map(Number);
  let parts = [];
  if (h > 0) parts.push(`${h} hrs`);
  if (m > 0) parts.push(`${m} mins`);
  if (s > 0) parts.push(`${s} segs`);
  return parts.length ? parts.join(' ') : 'N/A';
}

/**
 * Formatea la información del próximo mapa, incluyendo fecha.
 *
 * @param map - Nombre del mapa (opcional).
 * @param dateStr - Cadena de fecha en formato legible (opcional).
 * @returns Cadena formateada con el mapa y fecha/hora, o "No disponible" si faltan datos.
 * Ejemplo: "Próximo mapa: World's Edge • hoy a las 08:00 p. m."
 */
function formatNextMap(map?: string, dateStr?: string) {
  if (!map || !dateStr) return 'No disponible';
  const nextDate = new Date(dateStr.replace(' ', 'T') + 'Z');
  const timestamp = Math.floor(nextDate.getTime() / 1000);
  return ` ${map} • <t:${timestamp}:D> <t:${timestamp}:t>`;
}

/**
 * Formatea la antigüedad de los datos en cache en minutos.
 *
 * @param ts - Timestamp en milisegundos (opcional).
 * @returns Cadena indicando hace cuánto tiempo se cargaron los datos, o cadena vacía si no hay timestamp.
 */
function formatCacheAge(ts?: number) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'hace menos de 1 minuto';
  if (mins === 1) return 'hace 1 minuto';
  return `hace ${mins} minutos`;
}

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
