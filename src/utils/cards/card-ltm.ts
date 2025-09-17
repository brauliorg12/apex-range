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
 * Formatea la información del próximo mapa, incluyendo fecha y evento.
 *
 * @param map - Nombre del mapa (opcional).
 * @param dateStr - Cadena de fecha en formato legible (opcional).
 * @param eventName - Nombre del evento (opcional).
 * @returns Cadena formateada con el mapa, evento y fecha/hora, o "No disponible" si faltan datos.
 */
function formatNextMap(map?: string, dateStr?: string, eventName?: string) {
  if (!map || !dateStr) return 'No disponible';
  const now = new Date();
  const nextDate = new Date(dateStr.replace(' ', 'T') + 'Z');
  const isToday = nextDate.toDateString() === now.toDateString();
  const isTomorrow = nextDate.getDate() === now.getDate() + 1;
  let dayText = isToday
    ? 'hoy'
    : isTomorrow
    ? 'mañana'
    : nextDate.toLocaleDateString('es-ES');
  let eventText = eventName ? ` (${eventName})` : '';
  return `Próximo mapa: ${map}${eventText} • ${dayText} a las ${nextDate.toLocaleTimeString(
    'es-ES',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }
  )}`;
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
        name: 'Modo de juego',
        value: hasData
          ? `\`\`\`${ltm.current.eventName}\`\`\``
          : 'No disponible',
        inline: true,
      },
      {
        name: 'Mapa actual',
        value: hasData ? `\`\`\`${ltm.current.map}\`\`\`` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante',
        value: hasData
          ? `\`\`\`${formatTimeLeft(ltm.current.remainingTimer)}\`\`\``
          : 'No disponible',
        inline: true,
      }
    );

  if (footerText) {
    embed.setFooter({
      text: ltm?.next?.map
        ? `${formatNextMap(
            ltm.next.map,
            ltm.next.readableDate_start,
            ltm.next.eventName
          )} • ${footerText}`
        : `Próximo mapa: No disponible • ${footerText}`,
    });
  } else {
    embed.setFooter({
      text: ltm?.next?.map
        ? formatNextMap(
            ltm.next.map,
            ltm.next.readableDate_start,
            ltm.next.eventName
          )
        : 'Próximo mapa: No disponible',
    });
  }

  return embed;
}
