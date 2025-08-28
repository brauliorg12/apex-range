import { EmbedBuilder } from 'discord.js';

function formatCacheAge(ts?: number) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'hace menos de 1 minuto';
  if (mins === 1) return 'hace 1 minuto';
  return `hace ${mins} minutos`;
}

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
    .setColor('#e67e22')
    .setTitle(
      '<:pred_top:1410642581934571560> RP necesario para Predator (Top global)'
    )
    .setDescription(
      'RP requerido para entrar al top global Predator en cada plataforma.'
    )
    .addFields(
      hasData
        ? [
            {
              name: '🖥️ PC',
              value: `\`\`${predatorRank.RP.PC.val} RP\`\``,
              inline: true,
            },
            {
              name: '🎮 PS4',
              value: `\`\`${predatorRank.RP.PS4.val} RP\`\``,
              inline: true,
            },
            {
              name: '🎮 Xbox',
              value: `\`\`${predatorRank.RP.X1.val} RP\`\``,
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
