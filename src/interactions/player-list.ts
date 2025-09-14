import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';
import { getRankEmoji } from '../utils/emoji-helper';
import { getPlayerData } from '../utils/player-data-manager';
import { Player, PlayerRecord } from '../interfaces/player';

/**
 * Obtiene todos los jugadores del servidor que tienen algún rol de rango de Apex Legends.
 *
 * - Recorre todos los miembros del servidor y verifica si tienen un rol de rango definido en APEX_RANKS.
 * - Devuelve un arreglo de objetos Player con el miembro y el nombre del rango.
 *
 * @param guild Servidor de Discord donde buscar los jugadores.
 * @returns Lista de jugadores con su rango.
 */
export async function getAllRankedPlayers(guild: Guild): Promise<Player[]> {
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

/**
 * Maneja la interacción para mostrar el listado de todos los jugadores registrados por rango.
 * Muestra un embed con los nombres y fechas de registro.
 * @param interaction Interacción de botón de Discord.
 * @param rankShortId ID corto del rango para filtrar (opcional).
 * @param onlyOnline Indica si solo se deben mostrar los jugadores en línea (opcional).
 */
export async function handleShowAllPlayersMenu(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  rankShortId?: string,
  onlyOnline: boolean = false
) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  try {
    const [players, playerData] = await Promise.all([
      getAllRankedPlayers(interaction.guild),
      getPlayerData(interaction.guild),
    ]);

    const playerDateById = new Map<string, string>(
      (playerData as PlayerRecord[]).map((p) => [p.userId, p.assignedAt])
    );

    // --- FILTRA LOS RANGOS SI rankShortId ESTÁ PRESENTE ---
    let filteredRanks = APEX_RANKS;
    if (rankShortId) {
      filteredRanks = APEX_RANKS.filter((r) => r.shortId === rankShortId);
    }
    // ------------------------------------------------------

    // Agrupar jugadores por rango
    const playersByRank: Record<string, GuildMember[]> = {};
    for (const rank of filteredRanks) {
      playersByRank[rank.roleName] = [];
    }

    for (const player of players) {
      if (playersByRank[player.rankName]) {
        if (
          !onlyOnline ||
          (player.member.presence && player.member.presence.status === 'online')
        ) {
          playersByRank[player.rankName].push(player.member);
        }
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle(
        onlyOnline
          ? '🟢 Jugadores en línea por rango'
          : '👥 Todos los Jugadores Registrados'
      )
      .setTimestamp();

    let description = '';
    for (const rank of filteredRanks) {
      const membersInRank = playersByRank[rank.roleName];
      const emoji = getRankEmoji(interaction.client, rank);
      description += `\n**${emoji} ${rank.label} (${membersInRank.length})**\n`;

      if (membersInRank.length > 0) {
        description += membersInRank
          .map((m, index) => {
            const assignedAt = playerDateById.get(m.id);
            const dateString = assignedAt
              ? ` - _${new Date(assignedAt).toLocaleDateString('es-ES')}_`
              : '';
            return `${index + 1}. \`${m.displayName}\`${dateString}`;
          })
          .join('\n');
      } else {
        description += `_...No hay usuarios en línea en este rango._`;
      }
      description += '\n';
    }

    embed.setDescription(
      description.trim().length > 0
        ? description
        : 'No se encontraron jugadores en línea con rango.'
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
