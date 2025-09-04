import { EmbedBuilder } from 'discord.js';

/**
 * Convierte un string de tiempo restante (hh:mm:ss) en formato legible.
 * Ejemplo: "01:23:45" → "1 hrs 23 mins 45 segs"
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
 * Formatea la información del próximo mapa y fecha en texto legible.
 * Ejemplo: "Próximo mapa: World's Edge • hoy a las 08:00 p. m."
 */
function formatNextMap(map?: string, dateStr?: string) {
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
  return `Próximo mapa: ${map} • ${dayText} a las ${nextDate.toLocaleTimeString(
    'es-ES',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }
  )}`;
}

/**
 * Calcula cuántos minutos han pasado desde un timestamp y lo describe.
 * Ejemplo: "hace 3 minutos"
 */
function formatCacheAge(ts?: number) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'hace menos de 1 minuto';
  if (mins === 1) return 'hace 1 minuto';
  return `hace ${mins} minutos`;
}

/**
 * Construye el embed visual para la rotación de mapas Ranked.
 * - Muestra el mapa actual, tiempo restante y próximo mapa.
 * - Incluye descripción de split y fin de temporada si aplica.
 * - Agrega aviso de cache si los datos son cacheados.
 * - Usa color y emoji personalizado en el título.
 * @param ranked Datos de rotación de mapas Ranked.
 * @param cacheInfo Estado de la cache por endpoint.
 * @param cacheTimestamps Timestamps de última actualización de cache.
 * @returns EmbedBuilder listo para enviar.
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
        name: 'Mapa actual',
        value: hasData ? `\`\`\`${ranked.current.map}\`\`\`` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante',
        value: hasData
          ? `\`\`\`${formatTimeLeft(ranked.current.remainingTimer)}\`\`\`` // Formatea el tiempo restante
          : 'No disponible',
        inline: true,
      }
    );

  // Footer con info de próximo mapa y cache
  if (footerText) {
    embed.setFooter({
      text: ranked?.next?.map
        ? `${formatNextMap(
            ranked.next.map,
            ranked.next.readableDate_start
          )} • ${footerText}`
        : `Próximo mapa: No disponible • ${footerText}`,
    });
  } else {
    embed.setFooter({
      text: ranked?.next?.map
        ? formatNextMap(ranked.next.map, ranked.next.readableDate_start)
        : 'Próximo mapa: No disponible',
    });
  }

  return embed;
}
