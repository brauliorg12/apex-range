import {
  ButtonInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { createCloseButtonRow } from '../utils/button-helper';
import { getRankEmoji } from '../utils/emoji-helper';
import { getPlayerData } from '../utils/player-data-manager';

interface Player {
  member: GuildMember;
  rankName: string;
}

async function getAllRankedPlayers(guild: Guild): Promise<Player[]> {
  await guild.members.fetch(); // Asegurarse de que todos los miembros están en caché

  const players: Player[] = [];
  const rankRoleNames = APEX_RANKS.map((r) => r.roleName);

  guild.members.cache.forEach((member) => {
    const rankRole = member.roles.cache.find((role) =>
      rankRoleNames.includes(role.name)
    );
    if (rankRole) {
      players.push({ member, rankName: rankRole.name });
    }
  });

  return players;
}

export async function handleShowAllPlayersMenu(interaction: ButtonInteraction) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  try {
    const [players, playerData] = await Promise.all([
      getAllRankedPlayers(interaction.guild),
      getPlayerData(),
    ]);

    if (players.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('👥 Jugadores Registrados')
        .setDescription('Actualmente no hay jugadores con un rango asignado.');
      await interaction.editReply({
        embeds: [emptyEmbed],
        components: [createCloseButtonRow()],
      });
      return;
    }

    // Agrupar jugadores por rango
    const playersByRank: Record<string, GuildMember[]> = {};
    for (const rank of APEX_RANKS) {
      playersByRank[rank.roleName] = [];
    }

    for (const player of players) {
      if (playersByRank[player.rankName]) {
        playersByRank[player.rankName].push(player.member);
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('👥 Todos los Jugadores Registrados')
      .setTimestamp();

    let description = '';
    for (const rank of APEX_RANKS) {
      const membersInRank = playersByRank[rank.roleName];
      const emoji = getRankEmoji(interaction.client, rank);
      description += `\n**${emoji} ${rank.label} (${membersInRank.length})**\n`;

      if (membersInRank.length > 0) {
        description += membersInRank
          .map((m, index) => {
            const assignedData = playerData[m.id];
            const dateString = assignedData
              ? ` - _${new Date(assignedData.assignedAt).toLocaleDateString(
                  'es-ES'
                )}_`
              : '';
            return `${index + 1}. \`${m.displayName}\`${dateString}`;
          })
          .join('\n');
      } else {
        description += `_...Aún no hay usuarios registrados en este rango._`;
      }
      description += '\n';
    }

    embed.setDescription(
      description.trim().length > 0
        ? description
        : 'No se encontraron jugadores con rango.'
    );

    await interaction.editReply({
      embeds: [embed],
      components: [createCloseButtonRow()],
    });
  } catch (error) {
    console.error('Error al mostrar todos los jugadores:', error);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar obtener la lista de jugadores.'
      );
    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
