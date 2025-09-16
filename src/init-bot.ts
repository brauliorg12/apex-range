import { Client, Guild, Events } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';
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

/**
 * Función opcional para limpiar archivos de servidores donde el bot ya no está presente.
 * Útil para mantenimiento, pero deshabilitada por defecto para preservar datos históricos.
 */
async function cleanupOldServerFiles(client: Client): Promise<void> {
  try {
    const stateDir = path.join(__dirname, '../../.bot-state');
    const dbDir = path.join(__dirname, '../../db');

    // Obtener lista de archivos existentes
    const [stateFiles, dbFiles] = await Promise.all([
      fs.readdir(stateDir).catch(() => []),
      fs.readdir(dbDir).catch(() => []),
    ]);

    // Extraer guildIds de los archivos
    const existingGuildIds = new Set<string>();

    // De archivos de estado
    for (const file of stateFiles) {
      if (file.endsWith('.json')) {
        const guildId = file.replace('.json', '');
        existingGuildIds.add(guildId);
      }
    }

    // De archivos de players
    for (const file of dbFiles) {
      if (file.startsWith('players_') && file.endsWith('.json')) {
        const guildId = file.replace('players_', '').replace('.json', '');
        existingGuildIds.add(guildId);
      }
    }

    // Verificar cuáles guilds ya no están accesibles
    const currentGuildIds = new Set(client.guilds.cache.map((g) => g.id));
    const obsoleteGuildIds = [...existingGuildIds].filter(
      (id) => !currentGuildIds.has(id)
    );

    if (obsoleteGuildIds.length > 0) {
      console.log(
        `[Cleanup] Encontrados ${obsoleteGuildIds.length} archivos de servidores obsoletos`
      );

      // Limpiar archivos (deshabilitado por defecto)
      // Descomenta las líneas siguientes si quieres activar la limpieza automática:
      /*
      for (const guildId of obsoleteGuildIds) {
        const stateFile = path.join(stateDir, `${guildId}.json`);
        const playersFile = path.join(dbDir, `players_${guildId}.json`);
        
        await fs.unlink(stateFile).catch(() => {});
        await fs.unlink(playersFile).catch(() => {});
        
        logApp(`Archivo limpiado para servidor obsoleto: ${guildId}`);
      }
      
      console.log(`[Cleanup] ${obsoleteGuildIds.length} archivos limpiados`);
      */
    }
  } catch (error) {
    logApp(`Error en cleanup de archivos antiguos: ${error}`);
  }
}

export async function initBot(client: Client) {
  client.once(Events.ClientReady, async (readyClient) => {
    try {
      // Limpiar archivos antiguos (opcional, deshabilitado por defecto)
      await cleanupOldServerFiles(readyClient);

      for (const [guildId] of readyClient.guilds.cache) {
        const rolesState = await readRolesState(guildId);
        if (rolesState?.guildId) {
          // Código existente para guilds con estado
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
              await updateBotPresence(client);

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

          // Actualización periódica cada 60 segundos
          setInterval(() => {
            throttler.requestUpdate(guild);
            logApp(
              `Actualización periódica de roles y presencia en guild ${guild.name} (${guild.id})`
            );
          }, 60_000);
        } else {
          // Nuevo guild sin configuración
          const guild = await readyClient.guilds.fetch(guildId);
          logApp(
            `Nuevo servidor detectado: ${guild.name} (${guild.id}). Esperando configuración con /setup-roles.`
          );
        }
      }
    } catch (error) {
      logApp(`ERROR durante la inicialización del bot: ${error}`);
      console.error('Error durante la inicialización del bot:', error);
    }
  });

  // Eventos globales que disparan actualización coalescida
  client.on(Events.GuildMemberAdd, async (member) => {
    const rolesState = await readRolesState(member.guild.id);
    if (rolesState) {
      const throttler = createUpdateThrottler(60_000, async (guild: Guild) => {
        await updateRoleCountMessage(guild);
        await updateBotPresence(client);
      });
      throttler.requestUpdate(member.guild);
      logApp(
        `Nuevo miembro: ${member.user.tag} (${member.id}) en guild ${member.guild.name} (${member.guild.id})`
      );
      console.log(`[Evento] Nuevo miembro: ${member.user.tag} (${member.id})`);
    }
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    const rolesState = await readRolesState(member.guild.id);
    if (rolesState) {
      const throttler = createUpdateThrottler(60_000, async (guild: Guild) => {
        await updateRoleCountMessage(guild);
        await updateBotPresence(client);
      });
      throttler.requestUpdate(member.guild);
      logApp(
        `Miembro salió: ${member.user.tag} (${member.id}) en guild ${member.guild.name} (${member.guild.id})`
      );
      console.log(`[Evento] Miembro salió: ${member.user.tag} (${member.id})`);
    }
  });

  client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
    if (!newPresence.guild) return;
    const rolesState = await readRolesState(newPresence.guild.id);
    if (rolesState) {
      const throttler = createUpdateThrottler(60_000, async (guild: Guild) => {
        await updateRoleCountMessage(guild);
        await updateBotPresence(client);
      });
      const oldStatus = oldPresence?.status;
      const newStatus = newPresence.status;
      if (oldStatus !== newStatus) {
        throttler.requestUpdate(newPresence.guild);
        logApp(
          `PresenceUpdate: ${newPresence.user?.tag ?? ''} (${
            newPresence.user?.id ?? ''
          }) cambió de ${oldStatus} a ${newStatus} en guild ${
            newPresence.guild.name
          } (${newPresence.guild.id})`
        );
      }
    }
  });

  // Evento para cuando el bot se une a un nuevo servidor
  client.on(Events.GuildCreate, async (guild) => {
    logApp(`Bot añadido a nuevo servidor: ${guild.name} (${guild.id})`);
    try {
      const channel =
        guild.systemChannel || guild.channels.cache.find((ch) => ch.type === 0); // 0 es TEXT
      if (channel && 'send' in channel) {
        await channel.send({
          content: `¡Hola! Soy Apex Range Bot. Para configurar el panel de rangos, un administrador debe ejecutar el comando \`/setup-roles\` en este canal. ¡Gracias por añadirme!`,
        });
      }
    } catch (error) {
      logApp(
        `Error enviando mensaje de bienvenida en guild ${guild.name}: ${error}`
      );
    }
  });

  // Evento para cuando el bot es removido de un servidor
  client.on(Events.GuildDelete, async (guild) => {
    logApp(`Bot removido de servidor: ${guild.name} (${guild.id})`);
    // Los archivos JSON se conservan para preservar datos históricos
    // Si deseas limpiar automáticamente, descomenta las líneas siguientes:
    /*
    try {
      const fs = require('fs/promises');
      const path = require('path');
      const stateFile = path.join(__dirname, '../../.bot-state', `${guild.id}.json`);
      const playersFile = path.join(__dirname, '../../db', `players_${guild.id}.json`);
      
      await fs.unlink(stateFile).catch(() => {});
      await fs.unlink(playersFile).catch(() => {});
      
      logApp(`Archivos limpiados para servidor removido: ${guild.name} (${guild.id})`);
    } catch (error) {
      logApp(`Error limpiando archivos para servidor removido ${guild.id}: ${error}`);
    }
    */
  });
}
