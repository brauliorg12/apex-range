import { Guild } from 'discord.js';
import { writePlayers } from '../utils/state-manager';
import { logApp } from '../utils/logger';
import { getPlayerData, getPlayerPlatform } from '../utils/player-data-manager';
import { getAllRankedPlayers } from '../interactions/player-list';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';

/**
 * Sincroniza el JSON de jugadores con los roles actuales del servidor.
 * Agrega nuevos jugadores con roles y elimina aquellos que ya no los tienen.
 *
 * @param guild - El guild a sincronizar.
 */
export async function synchronizePlayersWithRoles(guild: Guild): Promise<void> {
  const players = await getAllRankedPlayers(guild);
  const playerData = await getPlayerData(guild);

  const playerIdsWithRank = new Set(players.map((p) => p.member.id));
  let updated = false;

  // Agregar jugadores con rol que no están en el JSON
  // 👇 USAR ROLES MAPEADOS DEL SERVIDOR
  const ranks = getApexRanksForGuild(guild.id, guild);
  
  for (const player of players) {
    // Convertir el nombre del rol al shortId correcto usando roles mapeados
    const rankInfo = ranks.find((r) => r.roleName === player.rankName);
    const rankShortId = rankInfo ? rankInfo.shortId : player.rankName; // Fallback al nombre si no se encuentra

    // Verificar si el jugador ya existe en playerData; si no, agregarlo con datos actuales
    if (!playerData.some((p) => p.userId === player.member.id)) {
      playerData.push({
        userId: player.member.id,
        assignedAt: new Date().toISOString(),
        rank: rankShortId,
        platform: (await getPlayerPlatform(guild.id, player.member.id)) || 'PC',
      });
      updated = true;
    }
  }

  // Eliminar del JSON los jugadores que ya no tienen rol de rango
  const originalLength = playerData.length;
  const filteredPlayerData = playerData.filter((p) =>
    playerIdsWithRank.has(p.userId)
  );
  if (filteredPlayerData.length !== originalLength) {
    updated = true;
  }

  if (updated) {
    await writePlayers(guild.id, filteredPlayerData);
    logApp(
      `Sincronización de jugadores con roles ejecutada en guild ${guild.name} (${guild.id})`
    );
  }
}
