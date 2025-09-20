import { EmbedBuilder } from 'discord.js';
import {
  NINTENDO_SWITCH_EMOGI,
  PC_ONLY_EMOGI,
  PLAYSTATION_EMOGI,
  XBOX_EMOGI,
} from '../../models/constants';

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
 * Construye un embed de Discord con el RP necesario para Predator (Top global) en Apex Legends.
 *
 * @param predatorRank - Objeto con datos del rango Predator, incluyendo RP por plataforma.
 * @param cacheInfo - Objeto con indicadores booleanos sobre si los datos están en cache (e.g., predatorRank).
 * @param cacheTimestamps - Objeto opcional con timestamps de cuando se cargaron los datos en cache, para calcular la antigüedad.
 * @returns Un objeto EmbedBuilder configurado con el RP requerido por plataforma y footer con info de cache.
 */
export function buildPredatorEmbed(
  predatorRank: any,
  cacheInfo: Record<string, boolean>,
  cacheTimestamps?: Record<string, number | undefined>
) {
  const hasData = predatorRank && predatorRank.RP;
  const footerText =
    cacheInfo.predatorRank && hasData && cacheTimestamps?.predatorRank
      ? `⚠️ Datos en cache cargados ${formatCacheAge(
          cacheTimestamps.predatorRank
        )}`
      : undefined;

  const embed = new EmbedBuilder()
    .setColor('#e74c3c')
    .setTitle(
      '<a:pred_gif:1413017869012308018> RP necesario para Predator (Top global)'
    )
    .setDescription(
      'RP requerido para entrar al top global Predator en cada plataforma.'
    )
    .addFields(
      hasData
        ? [
            {
              name: PC_ONLY_EMOGI + ' PC',
              value: `\`\`\`${predatorRank.RP.PC.val} RP\`\`\``,
              inline: true,
            },
            {
              name: PLAYSTATION_EMOGI + ' PlayStation',
              value: `\`\`\`${predatorRank.RP.PS4.val} RP\`\`\``,
              inline: true,
            },
            {
              name: XBOX_EMOGI + ' Xbox',
              value: `\`\`\`${predatorRank.RP.X1.val} RP\`\`\``,
              inline: true,
            },
            {
              name: NINTENDO_SWITCH_EMOGI + ' Switch',
              value: `\`\`\`${predatorRank.RP.SWITCH.val} RP\`\`\``,
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
    );

  if (footerText) {
    embed.setFooter({ text: footerText });
  }

  return embed;
}
