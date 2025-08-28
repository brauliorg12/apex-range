import { EmbedBuilder } from 'discord.js';

function formatTimeLeft(remaining?: string) {
  if (!remaining) return 'N/A';
  const [h, m, s] = remaining.split(':').map(Number);
  let parts = [];
  if (h > 0) parts.push(`${h} hrs`);
  if (m > 0) parts.push(`${m} mins`);
  if (s > 0) parts.push(`${s} segs`);
  return parts.length ? parts.join(' ') : 'N/A';
}

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

function formatCacheAge(ts?: number) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'hace menos de 1 minuto';
  if (mins === 1) return 'hace 1 minuto';
  return `hace ${mins} minutos`;
}

export function buildRankedEmbed(
  ranked: any,
  cacheInfo: Record<string, boolean>,
  cacheTimestamps?: Record<string, number | undefined>
) {
  const hasData =
    ranked &&
    ranked.current &&
    ranked.current.map &&
    ranked.current.remainingTimer;
  const footerText =
    cacheInfo.mapRotation && hasData && cacheTimestamps?.mapRotation
      ? `⚠️ Datos en cache cargados ${formatCacheAge(
          cacheTimestamps.mapRotation
        )}`
      : undefined;

  const rankedDescArr = [
    ranked?.current?.eventType === 'split'
      ? `El split termina en ${ranked?.current?.eventEnd || 'N/A'}`
      : '',
    ranked?.current?.seasonEnd
      ? `La temporada termina en ${ranked?.current?.seasonEnd}`
      : '',
  ].filter(Boolean);

  const embed = new EmbedBuilder()
    .setColor('#8e44ad')
    .setTitle('🏆 Battle Royale | Ranked')
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
          ? `\`\`\`${formatTimeLeft(ranked.current.remainingTimer)}\`\`\``
          : 'No disponible',
        inline: true,
      }
    );

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
