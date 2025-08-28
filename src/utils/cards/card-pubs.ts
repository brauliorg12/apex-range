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
        name: 'Mapa actual',
        value: hasData ? `\`\`\`${br.current.map}\`\`\`` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante',
        value: hasData
          ? `\`\`\`${formatTimeLeft(br.current.remainingTimer)}\`\`\``
          : 'No disponible',
        inline: true,
      }
    );

  if (footerText) {
    embed.setFooter({
      text: br?.next?.map
        ? `${formatNextMap(
            br.next.map,
            br.next.readableDate_start
          )} • ${footerText}`
        : `Próximo mapa: No disponible • ${footerText}`,
    });
  } else {
    embed.setFooter({
      text: br?.next?.map
        ? formatNextMap(br.next.map, br.next.readableDate_start)
        : 'Próximo mapa: No disponible',
    });
  }

  return embed;
}

function formatCacheAge(ts?: number) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'hace menos de 1 minuto';
  if (mins === 1) return 'hace 1 minuto';
  return `hace ${mins} minutos`;
}
