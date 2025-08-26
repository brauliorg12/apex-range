import { EmbedBuilder } from 'discord.js';
import { getMapRotation, getPredatorRank } from '../services/apex-api';

// Utilidad para formatear fecha a "HH:MM AM/PM" (corrige zona horaria)
function formatHour(dateStr?: string) {
  if (!dateStr) return 'N/A';
  // Forzar a tratar la fecha como UTC si viene en formato "YYYY-MM-DD HH:mm:ss"
  // Reemplaza espacio por 'T' y agrega 'Z' para que sea ISO UTC
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

export async function createApexStatusEmbed() {
  let mapRotation: any = null;
  let predatorRank: any = null;

  try {
    [mapRotation, predatorRank] = await Promise.all([
      getMapRotation(),
      getPredatorRank(),
    ]);
  } catch (error) {
    console.error('Error consultando la API de Mozambique:', error);
  }

  // Selecciona el mapa actual de Battle Royale para la imagen principal
  const br = mapRotation?.battle_royale;
  const ranked = mapRotation?.ranked;
  const ltm = mapRotation?.ltm;

  // Imagen del mapa actual (si la API la provee)
  const mainMapImg =
    br?.current?.asset ||
    ranked?.current?.asset ||
    ltm?.current?.asset ||
    undefined;

  const embed = new EmbedBuilder()
    .setColor('#e74c3c')
    .setTitle('🟢 ESTADO DE APEX LEGENDS')
    .setFooter({
      text: `Fuente: Apex Legends API | ${new Date().toLocaleString()}`,
    });

  // Mostrar la imagen del mapa de Battle Royale como thumbnail (miniatura)
  if (mainMapImg) {
    embed.setThumbnail(mainMapImg);
  }

  // Sección de mapas
  if (mapRotation) {
    embed.addFields(
      {
        name: '🗺️ Battle Royale',
        value: br?.current?.map
          ? [
              `• Ahora: **${br.current.map}** (${formatRemaining(
                br.current.remainingTimer
              )})`,
              `Próximo: **${br.next.map}** a las ${formatHour(
                br.next.readableDate_start
              )}`,
            ].join('\n')
          : 'No disponible',
        inline: false,
      },
      {
        name: '🗺️ Ranked',
        value: ranked?.current?.map
          ? [
              `• Ahora: **${ranked.current.map}** (${formatRemaining(
                ranked.current.remainingTimer
              )})`,
              `Próximo: **${ranked.next.map}** a las ${formatHour(
                ranked.next.readableDate_start
              )}`,
            ].join('\n')
          : 'No disponible',
        inline: false,
      },
      {
        name: '🗺️ LTM (Modo por Tiempo Limitado)',
        value: ltm?.current?.map
          ? [
              `• Ahora: **${ltm.current.map}** (${formatRemaining(
                ltm.current.remainingTimer
              )})`,
              `Próximo: **${ltm.next.map}** a las ${formatHour(
                ltm.next.readableDate_start
              )}`,
            ].join('\n')
          : 'No disponible',
        inline: false,
      }
    );
  } else {
    embed.addFields({
      name: '🗺️ Mapas',
      value: 'No se pudo obtener la información de rotación de mapas.',
    });
  }

  // Sección de Predator RP
  if (predatorRank && predatorRank.RP) {
    embed.addFields({
      name: '👹 RP necesario para Predator (Top global)',
      value: [
        `🖥️ **PC:** ${predatorRank.RP.PC.val} RP`,
        `🎮 **PS4:** ${predatorRank.RP.PS4.val} RP`,
        `🎮 **Xbox:** ${predatorRank.RP.X1.val} RP`,
      ].join('\n'),
      inline: false,
    });
  } else {
    embed.addFields({
      name: '👹 RP necesario para Predator',
      value: 'No se pudo obtener la información.',
    });
  }

  return embed;
}
