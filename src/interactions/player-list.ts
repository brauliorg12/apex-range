import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
} from 'discord.js';
import { ALL_PLAYERS_EMOGI } from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';
import { getRankEmoji } from '../utils/emoji-helper';
import { getPlayerData } from '../utils/player-data-manager';
import { Player, PlayerRecord } from '../interfaces/player';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { logApp } from '../utils/logger';

/**
 * Obtiene todos los jugadores del servidor que tienen algún rol de rango de Apex Legends.
 * 
 * Utiliza el sistema de mapeo de roles para soportar roles personalizados del servidor.
 * Recorre todos los miembros y verifica si tienen un rol de rango asignado.
 *
 * @param guild Servidor de Discord donde buscar los jugadores.
 * @returns Lista de jugadores con su rango asignado.
 */
export async function getAllRankedPlayers(guild: Guild): Promise<Player[]> {
  await guild.members.fetch(); // Asegurarse de que todos los miembros están en caché

  const players: Player[] = [];
  // Usar roles mapeados del servidor para soportar roles personalizados
  const ranks = getApexRanksForGuild(guild.id, guild);
  const rankRoleNames = ranks.map((r) => r.roleName);

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
 * Muestra el listado de jugadores registrados agrupados por rango.
 * 
 * Presenta un embed con los nombres de jugadores y sus fechas de registro,
 * utilizando los roles mapeados del servidor para soportar nombres personalizados.
 * 
 * @param interaction Interacción de botón o menú de selección de Discord.
 * @param rankShortId ID corto del rango para filtrar (opcional, muestra todos si se omite).
 * @param onlyOnline Si es true, solo muestra jugadores con estado en línea.
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

    // Obtener rangos mapeados del servidor y filtrar si se especificó un rango
    const allRanks = getApexRanksForGuild(
      interaction.guild.id,
      interaction.guild
    );
    let filteredRanks = allRanks;
    if (rankShortId) {
      filteredRanks = allRanks.filter((r) => r.shortId === rankShortId);
    }
    await logApp(
      `[handleShowAllPlayersMenu] Filtrando con ${filteredRanks.length} rangos`
    );

    // Agrupar jugadores por rango usando roles mapeados
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
          ? 'Filtra los jugadores 🟢 en línea por rango'
          : ALL_PLAYERS_EMOGI + ' Jugadores Registrados por Rango'
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
              ? ` - _<t:${Math.floor(
                  new Date(assignedAt).getTime() / 1000
                )}:D>_`
              : '';
            return `${index + 1}. \`${m.displayName}\`${dateString}`;
          })
          .join('\n');
      } else {
        description += onlyOnline
          ? `_...No hay jugadores registrados en línea en este rango._`
          : `_...No hay jugadores registrados en este rango._`;
      }
      description += '\n';
    }

    embed.setDescription(
      description.trim().length > 0
        ? description
        : onlyOnline
        ? 'No se encontraron jugadores registrados en línea.'
        : 'No se encontraron jugadores registrados.'
    );

    await interaction.editReply({
      embeds: [embed],
      components: [createCloseButtonRow()],
    });
  } catch (error) {
    await logApp(
      `Error al mostrar lista de jugadores en ${interaction.guild?.name}: ${error}`
    );
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
