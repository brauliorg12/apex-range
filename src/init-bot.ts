import { Client, Guild, Events } from 'discord.js';
import {
  readRolesState,
  readApexStatusState,
  writePlayers,
} from './utils/state-manager';
import {
  updateApexInfoMessage,
  updateRoleCountMessage,
} from './utils/update-status-message';
import { updateBotPresence } from './utils/presence-helper';
import { getGlobalApiStatus } from './utils/global-api-status';
import { checkApiHealth } from './utils/api-health-check';
import { createUpdateThrottler } from './utils/update-throttler';
import { logApp } from './utils/logger';
import { getPlayerData } from './utils/player-data-manager';
import { getAllRankedPlayers } from './interactions/player-list';

function printBanner(client: Client, guild: Guild, channelInfo: string) {
  const now = new Date();
  const fechaLocal = now.toLocaleString();
  const fechaUTC = now.toISOString();
  console.log('\x1b[36m');
  console.log('   🛡️  Apex Discord Bot - Panel de Jugadores 🛡️');
  console.log('   by Burlon23 - CubaNova');
  console.log('\x1b[0m');
  console.log('\x1b[32m%s\x1b[0m', '🟢 Bot conectado');
  console.log(`[App] Usuario Discord: ${client.user?.tag}`);
  console.log(`[App] Inicio: ${fechaLocal} (local) | ${fechaUTC} (UTC)`);
  console.log(`[App] Servidor: ${guild.name} (${guild.id})`);
  console.log(`[App] ${channelInfo}`);
  logApp(
    `Bot conectado como ${client.user?.tag} en guild ${guild.name} (${guild.id}). ${channelInfo}`
  );
}

export async function initBot(client: Client) {
  client.once(Events.ClientReady, async (readyClient) => {
    try {
      for (const [guildId] of readyClient.guilds.cache) {
        const rolesState = await readRolesState(guildId);
        if (rolesState?.guildId) {
          const guild = await readyClient.guilds.fetch(rolesState.guildId);
          let channelInfo = '';
          if (rolesState.channelId) {
            try {
              const channel = await guild.channels.fetch(rolesState.channelId);
              if (channel && 'name' in channel) {
                channelInfo = `Canal: #${channel.name} (${channel.id})`;
              } else {
                channelInfo = `Canal: (no encontrado, id=${rolesState.channelId})`;
              }
            } catch {
              channelInfo = `Canal: (no encontrado, id=${rolesState.channelId})`;
            }
          } else {
            channelInfo = 'Canal: (no configurado)';
          }

          printBanner(client, guild, channelInfo);

          logApp(
            `Inicializando ciclo de actualización para guild ${guild.name} (${guild.id})`
          );

          const throttler = createUpdateThrottler(
            60_000,
            async (guild: Guild) => {
              // --- SINCRONIZA EL JSON DE JUGADORES CON LOS ROLES ACTUALES ---
              const players = await getAllRankedPlayers(guild);
              const playerData = await getPlayerData(guild);

              const playerIdsWithRank = new Set(
                players.map((p) => p.member.id)
              );
              let updated = false;

              // 1. Agrega jugadores con rol que no están en el JSON
              for (const player of players) {
                if (!playerData.some((p) => p.userId === player.member.id)) {
                  playerData.push({
                    userId: player.member.id,
                    assignedAt: new Date().toISOString(),
                    rank: player.rankName,
                  });
                  updated = true;
                }
              }

              // 2. Elimina del JSON los jugadores que ya no tienen rol de rango
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
              // --- FIN DE SINCRONIZACIÓN ---

              // Actualiza los mensajes y la presencia
              await updateRoleCountMessage(guild);
              await updateBotPresence(client, guild);

              logApp(
                `Actualización de roles y presencia ejecutada en guild ${guild.name} (${guild.id})`
              );
            }
          );

          throttler.requestUpdate(guild);

          // Actualizar mensaje de /apex-status si existe al iniciar
          const apexStatusState = await readApexStatusState(guildId);
          if (apexStatusState?.apexInfoMessageId && apexStatusState.channelId) {
            await updateApexInfoMessage(guild);
          }

          // Update Apex Info message every 5 minutes
          setInterval(() => {
            updateApexInfoMessage(guild);
            logApp(
              `Actualización periódica de mensaje Apex Info en guild ${guild.name} (${guild.id})`
            );
          }, 5 * 60 * 1000);

          // Chequeo de salud y actualización de embed solo al iniciar
          await checkApiHealth();
          const apiStatus = getGlobalApiStatus();
          const color = apiStatus.ok ? '🟢' : '🔴';
          const lastChecked = apiStatus.lastChecked
            ? apiStatus.lastChecked.toLocaleString()
            : 'Nunca';
          logApp(
            `Estado API: ${
              apiStatus.ok ? 'Conectado' : 'Desconectado'
            } | Última vez chequeado: ${lastChecked}`
          );
          console.log('------------------------------------------');
          console.log('  SERVIDOR/API Apex Range ');
          console.log(
            `  Estado: ${color} ${apiStatus.ok ? 'Conectado' : 'Desconectado'}`
          );
          console.log(`  Última vez chequeado: ${lastChecked}`);
          console.log('------------------------------------------');

          // Eventos que disparan actualización coalescida
          client.on(Events.GuildMemberAdd, (member) => {
            logApp(
              `Nuevo miembro: ${member.user.tag} (${member.id}) en guild ${member.guild.name} (${member.guild.id})`
            );
            console.log(
              `[Evento] Nuevo miembro: ${member.user.tag} (${member.id})`
            );
            throttler.requestUpdate(member.guild);
          });

          client.on(Events.GuildMemberRemove, (member) => {
            logApp(
              `Miembro salió: ${member.user.tag} (${member.id}) en guild ${member.guild.name} (${member.guild.id})`
            );
            console.log(
              `[Evento] Miembro salió: ${member.user.tag} (${member.id})`
            );
            throttler.requestUpdate(member.guild);
          });

          client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
            if (!newPresence.guild) return;

            const oldStatus = oldPresence?.status;
            const newStatus = newPresence.status;

            if (oldStatus !== newStatus) {
              logApp(
                `PresenceUpdate: ${newPresence.user?.tag ?? ''} (${
                  newPresence.user?.id ?? ''
                }) cambió de ${oldStatus} a ${newStatus} en guild ${
                  newPresence.guild.name
                } (${newPresence.guild.id})`
              );
              throttler.requestUpdate(newPresence.guild); // Esto llama a updateRoleCountMessage internamente
            }
          });

          // Actualización periódica cada 60 segundos
          setInterval(() => {
            throttler.requestUpdate(guild);
            logApp(
              `Actualización periódica de roles y presencia en guild ${guild.name} (${guild.id})`
            );
          }, 60_000);
        }
      }
    } catch (error) {
      logApp(`ERROR durante la inicialización del bot: ${error}`);
      console.error('Error durante la inicialización del bot:', error);
    }
  });
}
