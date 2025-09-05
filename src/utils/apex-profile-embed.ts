import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { APEX_RANKS, APEX_LOGO_EMOJI } from '../models/constants';
import { renderPredatorBadge } from './predator-badge-canvas';
import { ApexProfileEmbedResult } from '../interfaces/profile-embed';
import { buildArenasEmbed } from './arenas-embed';
import { buildRealtimeEmbed } from './realtime-embed';

/**
 * Genera un embed profesional para mostrar el perfil de Apex Legends.
 * Si el jugador es Predator, retorna también el badge visual.
 * @param profile Perfil obtenido de la API externa.
 * @param playerName Nombre del jugador consultado.
 * @param platform Plataforma del jugador (PC, PS4, X1).
 * @returns { embed, files? }
 */
export async function buildApexProfileEmbed(
  profile: Record<string, any>,
  playerName: string,
  platform: string
): Promise<ApexProfileEmbedResult> {
  // Extrae datos globales y de leyenda
  const global = profile.global || {};
  const selectedLegend = profile.legends?.selected?.LegendName || 'Desconocida';
  let legendBanner = profile.legends?.selected?.ImgAssets?.banner;
  let rankImg = global.rank?.rankImg;
  const rankName = global.rank?.rankName ?? 'N/A';

  // Codifica URLs de imágenes si existen
  if (legendBanner) legendBanner = encodeURI(legendBanner);
  if (rankImg) rankImg = encodeURI(rankImg);

  // Traducción del rango usando APEX_RANKS
  let rankLabel = rankName;
  const rankConst = APEX_RANKS.find(
    (r) => r.apiName?.toLowerCase() === rankName.toLowerCase()
  );
  if (rankConst && rankConst.label) {
    rankLabel = rankConst.label;
  }
  if (rankLabel.toLowerCase().includes('rookie')) {
    rankLabel = 'Sin rango';
  }

  // Extrae kills y determina fuente
  let kills: number | string | undefined =
    profile.legends?.selected?.data?.find((d: any) => d.key === 'kills')?.value;
  let killsSource: 'legend' | 'global' = 'global';

  if (kills !== undefined && kills !== 0) {
    killsSource = 'legend';
  }
  if (
    (kills === undefined || kills === 0) &&
    profile.legends?.selected?.LegendName &&
    profile.legends?.all?.[profile.legends.selected.LegendName]?.data
  ) {
    kills = profile.legends.all[profile.legends.selected.LegendName].data.find(
      (d: any) => d.key === 'kills'
    )?.value;
    if (kills !== undefined && kills !== 0) {
      killsSource = 'legend';
    }
  }
  if (kills === undefined || kills === 0) {
    kills =
      profile.total?.kills?.value ??
      profile.total?.career_kills?.value ??
      profile.total?.specialEvent_kills?.value ??
      'N/A';
    killsSource = 'global';
  }

  // Extrae otros datos relevantes
  const rankScore = global.rank?.rankScore ?? 'N/A';
  const ladderPos = global.rank?.ladderPosPlatform ?? 'N/A';
  const tag = global?.tag ? `[${global.tag}]` : '';

  // Determina color del embed según rango
  const embedColorStr = (rankConst?.color || 'e67e22').replace(/^#/, '');
  const embedColor = parseInt(embedColorStr, 16);

  // Construye el embed profesional
  const embed = new EmbedBuilder()
    .setTitle(`${APEX_LOGO_EMOJI} Perfil de Ranked: \`\`${playerName}\`\``)
    .setDescription(`**Nombre Global:** \`\`\`${tag} ${global.name}\`\`\``)
    .setColor(embedColor)
    .setThumbnail(rankImg ?? null)
    .addFields(
      {
        name: 'Nivel',
        value: `\`\`\`${global.level ?? 'N/A'}\`\`\``,
        inline: true,
      },
      {
        name: 'RP',
        value: `\`\`\`${rankScore}\`\`\``,
        inline: true,
      },
      ...(rankName === 'Apex Predator'
        ? [
            {
              name: 'Top actual',
              value: `\`\`\`#${ladderPos}\`\`\``,
              inline: true,
            },
          ]
        : []),
      {
        name:
          killsSource === 'legend'
            ? `Kills con ${selectedLegend}`
            : 'Kills globales',
        value: `\`\`\`${kills}\`\`\``,
        inline: true,
      },
      {
        name: 'Leyenda actual',
        value: `\`\`\`${selectedLegend}\`\`\``,
        inline: true,
      },
      {
        name: 'Plataforma',
        value: `\`\`\`${platform}\`\`\``,
        inline: true,
      }
    )
    .setFooter({
      text: `Datos obtenidos de la API de Mozambique | UID: ${
        global.uid ?? 'N/A'
      }`,
    });

  // Si hay banner de leyenda, lo agrega como imagen
  if (legendBanner) embed.setImage(legendBanner ?? null);

  // Si es Predator y tiene ladderPos, genera badge visual
  if (
    rankName === 'Apex Predator' &&
    ladderPos &&
    rankImg &&
    !isNaN(Number(ladderPos))
  ) {
    try {
      const logoRes = await fetch(rankImg);
      const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
      const { buffer } = await renderPredatorBadge(
        logoBuffer,
        Number(ladderPos)
      );
      const attachment = new AttachmentBuilder(buffer, {
        name: 'predator-badge.png',
      });
      embed.setThumbnail('attachment://predator-badge.png');
      // Embed de Arenas
      const arenasEmbed = buildArenasEmbed(profile, playerName);
      // Embed de realtime si existe
      let embeds = [embed, arenasEmbed];
      if (profile.realtime) {
        const realtimeEmbed = buildRealtimeEmbed(profile.realtime, playerName);
        embeds.push(realtimeEmbed);
      }
      return { embeds, files: [attachment] };
    } catch (e) {
      // Si falla, retorna solo el embed
      const arenasEmbed = buildArenasEmbed(profile, playerName);
      // Embed de realtime si existe
      let embeds = [embed, arenasEmbed];
      if (profile.realtime) {
        const realtimeEmbed = buildRealtimeEmbed(profile.realtime, playerName);
        embeds.push(realtimeEmbed);
      }
      return { embeds };
    }
  }

  // Embed de Arenas
  const arenasEmbed = buildArenasEmbed(profile, playerName);
  // Embed de realtime si existe
  let embeds = [embed, arenasEmbed];
  if (profile.realtime) {
    const realtimeEmbed = buildRealtimeEmbed(profile.realtime, playerName);
    embeds.push(realtimeEmbed);
  }
  return { embeds };
}
