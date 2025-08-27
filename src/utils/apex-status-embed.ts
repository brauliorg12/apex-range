import { EmbedBuilder } from 'discord.js';
import { getMapRotation, getPredatorRank } from '../services/apex-api';

// Utilidad para formatear fecha a "HH:MM AM/PM" (corrige zona horaria)
function formatHour(dateStr?: string) {
  if (!dateStr) return 'N/A';
  let iso = dateStr.replace(' ', 'T');
  if (!iso.endsWith('Z')) iso += 'Z';
  const date = new Date(iso);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Utilidad para mostrar "Queda: xx min"
function formatRemaining(remaining?: string) {
  if (!remaining) return '';
  // Espera formato "HH:MM:SS"
  const [h, m, s] = remaining.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '';
  let parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.length ? `Queda: ${parts.join(' ')}.` : '';
}

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
  return `Próximo mapa: ${map} • ${dayText} a las ${formatHour(dateStr)}`;
}

export async function createApexStatusEmbeds() {
  let mapRotation: any = null;
  let predatorRank: any = null;
  const now = new Date();

  try {
    [mapRotation, predatorRank] = await Promise.all([
      getMapRotation(),
      getPredatorRank(),
    ]);
  } catch (error) {
    console.error('Error consultando la API de Mozambique:', error);
  }

  const br = mapRotation?.battle_royale;
  const ranked = mapRotation?.ranked;
  const ltm = mapRotation?.ltm;

  // Card principal de estado
  const mainEmbed = new EmbedBuilder()
    .setColor('#e74c3c')
    .setTitle('ℹ️ Información de Apex Legends')
    .setDescription(
      [
        '🔄 Se actualiza cada 5 minutos.',
        `🕒 Última actualización: ${now.toLocaleString()}`,
        '',
        '🌐 Datos desde la API de Mozambique',
        '[Más info](https://apexlegendsapi.com/)',
      ].join('\n')
    )
    .setFooter({
      text: 'by Burlon23',
      iconURL: 'https://apexlegendsapi.com/favicon.ico',
    });

  // Card Battle Royale (Pubs)
  const pubsEmbed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('🗺️ Battle Royale | Normales')
    .setImage(br?.current?.asset || null)
    .addFields(
      {
        name: 'Mapa actual',
        value: br?.current?.map ? `${br.current.map}` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante',
        value: br?.current?.remainingTimer
          ? formatTimeLeft(br.current.remainingTimer)
          : 'No disponible',
        inline: true,
      },
      {
        name: '\u200B',
        value: br?.next?.map
          ? formatNextMap(br.next.map, br.next.readableDate_start)
          : 'No disponible',
        inline: false,
      }
    );

  // Card Ranked
  const rankedDescArr = [
    ranked?.current?.eventType === 'split'
      ? `El split termina en ${ranked?.current?.eventEnd || 'N/A'}`
      : '',
    ranked?.current?.seasonEnd
      ? `La temporada termina en ${ranked?.current?.seasonEnd}`
      : '',
  ].filter(Boolean);

  const rankedEmbed = new EmbedBuilder()
    .setColor('#8e44ad')
    .setTitle('🏆 Battle Royale | Ranked')
    .setImage(ranked?.current?.asset || null)
    .setDescription(rankedDescArr.length > 0 ? rankedDescArr.join(' • ') : ' ')
    .addFields(
      {
        name: 'Mapa actual',
        value: ranked?.current?.map ? `${ranked.current.map}` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante',
        value: ranked?.current?.remainingTimer
          ? formatTimeLeft(ranked.current.remainingTimer)
          : 'No disponible',
        inline: true,
      },
      {
        name: '\u200B',
        value: ranked?.next?.map
          ? formatNextMap(ranked.next.map, ranked.next.readableDate_start)
          : 'No disponible',
        inline: false,
      }
    );

  // Card LTM
  const ltmEmbed = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('🌀 LTM (Modo por Tiempo Limitado)')
    .setImage(ltm?.current?.asset || null)
    .addFields(
      {
        name: 'Mapa actual',
        value: ltm?.current?.map ? `${ltm.current.map}` : 'No disponible',
        inline: true,
      },
      {
        name: 'Tiempo restante',
        value: ltm?.current?.remainingTimer
          ? formatTimeLeft(ltm.current.remainingTimer)
          : 'No disponible',
        inline: true,
      },
      {
        name: '\u200B',
        value: ltm?.next?.map
          ? formatNextMap(ltm.next.map, ltm.next.readableDate_start)
          : 'No disponible',
        inline: false,
      }
    );

  // Card Predator RP
  const predatorEmbed = new EmbedBuilder()
    .setColor('#e67e22')
    .setTitle('👹 RP necesario para Predator (Top global)')
    .setDescription(
      'RP requerido para entrar al top global Predator en cada plataforma.'
    )
    .addFields(
      predatorRank && predatorRank.RP
        ? [
            {
              name: '🖥️ PC',
              value: `${predatorRank.RP.PC.val} RP`,
              inline: true,
            },
            {
              name: '🎮 PS4',
              value: `${predatorRank.RP.PS4.val} RP`,
              inline: true,
            },
            {
              name: '🎮 Xbox',
              value: `${predatorRank.RP.X1.val} RP`,
              inline: true,
            },
          ]
        : [
            {
              name: 'RP necesario para Predator',
              value: 'No se pudo obtener la información.',
              inline: false,
            },
          ]
    )
    .setThumbnail(
      'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/7/7e/Ranked_Predator.png'
    );

  return [rankedEmbed, pubsEmbed, ltmEmbed, predatorEmbed, mainEmbed];
}
