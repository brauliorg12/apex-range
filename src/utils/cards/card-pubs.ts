import { EmbedBuilder } from 'discord.js';

/**
 * Formatea el tiempo restante en horas, minutos y segundos.
 *
 * @param remaining - Cadena de tiempo en formato "HH:MM:SS" (opcional).
 * @returns Cadena formateada como "X hrs Y mins Z segs" o "N/A" si no hay datos.
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
 */
function formatNextMap(map?: string, dateStr?: string) {
  if (!map || !dateStr) return 'No disponible';
  const nextDate = new Date(dateStr.replace(' ', 'T') + 'Z');
  const timestamp = Math.floor(nextDate.getTime() / 1000);
  return ` ${map} • <t:${timestamp}:D> <t:${timestamp}:t>`;
}

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
