import { EmbedBuilder } from 'discord.js';
import { APEX_LOGO_EMOJI } from '../models/constants';

// Genera el embed de Arenas
export function buildArenasEmbed(
  profile: Record<string, any>,
  playerName: string
) {
  const arenas = profile.arenas || profile.global?.arena || {};
  const rankName = arenas.rankName ?? 'N/A';
  const rankScore = arenas.rankScore ?? 'N/A';
  const rankImg = arenas.rankImg ? encodeURI(arenas.rankImg) : undefined;

  // Color diferente para Arenas
  const embedColor = 0x3498db;

  const embed = new EmbedBuilder()
    .setTitle(`${APEX_LOGO_EMOJI} Perfil de Arenas: \`\`${playerName}\`\``)
    .setColor(embedColor)
    .setThumbnail(rankImg ?? null)
    .addFields(
      {
        name: 'Rango Arenas',
        value: `\`\`\`${rankName}\`\`\``,
        inline: true,
      },
      {
        name: 'Puntos Arenas',
        value: `\`\`\`${rankScore}\`\`\``,
        inline: true,
      }
    )
    .setFooter({
      text: `Datos de Arenas | API Mozambique`,
    });

  return embed;
}
