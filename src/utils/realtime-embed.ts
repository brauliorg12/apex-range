import { EmbedBuilder } from 'discord.js';
import { APEX_LOGO_EMOJI } from '../models/constants';

// Genera el embed de realtime
export function buildRealtimeEmbed(
  realtime: Record<string, any>,
  playerName: string
) {
  // Emojis de estado (ajusta según tus constantes)
  const ONLINE_EMOJI = '🟢';
  const OFFLINE_EMOJI = '🔴';
  const LOBBY_EMOJI = '💬';
  const GAME_EMOJI = '🎮';

  const isOnline = realtime.isOnline === 1;
  const isInGame = realtime.isInGame === 1;
  const canJoin = realtime.canJoin === 1;
  const partyFull = realtime.partyFull === 1;
  const legend = realtime.selectedLegend || 'Desconocida';

  let stateText = '';
  if (!isOnline) {
    stateText = `${OFFLINE_EMOJI} Offline`;
  } else if (isInGame) {
    stateText = `${GAME_EMOJI} En partida`;
  } else if (realtime.lobbyState === 'invite') {
    stateText = `${LOBBY_EMOJI} En lobby (invite only)`;
  } else {
    stateText = `${ONLINE_EMOJI} Online`;
  }

  const embedColor = isOnline ? 0x2ecc71 : 0xe74c3c;

  const embed = new EmbedBuilder()
    .setTitle(`${APEX_LOGO_EMOJI} Estado en tiempo real: \`\`${playerName}\`\``)
    .setColor(embedColor)
    .addFields(
      {
        name: 'Estado',
        value: `\`\`\`${stateText}\`\`\``,
        inline: true,
      },
      {
        name: 'Leyenda actual',
        value: `\`\`\`${legend}\`\`\``,
        inline: true,
      },
      {
        name: '¿Se puede unir?',
        value: `\`\`\`${canJoin ? 'Sí' : 'No'}${
          partyFull ? ' (Grupo lleno)' : ''
        }\`\`\``,
        inline: true,
      }
    )
    .setFooter({
      text: `Datos en tiempo real | API Mozambique`,
    });

  return embed;
}
