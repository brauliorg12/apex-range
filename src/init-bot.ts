import { Client, Guild, Events } from 'discord.js';
import { readRolesState, readApexStatusState } from './utils/state-manager';
import {
  updateRoleCountMessage,
  updateApexInfoMessage,
} from './utils/update-status-message';
import { updateBotPresence } from './utils/presence-helper';
import { getGlobalApiStatus } from './utils/global-api-status';
import { checkApiHealth } from './utils/api-health-check';
import { createUpdateThrottler } from './utils/update-throttler';
import { logApp } from './utils/logger';

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
  logApp(`Bot conectado como ${client.user?.tag} en guild ${guild.name} (${guild.id}). ${channelInfo}`);
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

          logApp(`Inicializando ciclo de actualización para guild ${guild.name} (${guild.id})`);

          const throttler = createUpdateThrottler(
            60_000,
            async (guild: Guild) => {
              await updateRoleCountMessage(guild);
              await updateBotPresence(client, guild);
              logApp(`Actualización de roles y presencia ejecutada en guild ${guild.name} (${guild.id})`);
            }
          );

          throttler.requestUpdate(guild);

          // Actualizar mensaje de /apex-status si existe al iniciar
          const apexStatusState = await readApexStatusState(guildId);
          if (
            apexStatusState?.apexInfoMessageId &&
            apexStatusState.channelId
          ) {
            await updateApexInfoMessage(guild);
          }

          // Update Apex Info message every 5 minutes
          setInterval(() => {
            updateApexInfoMessage(guild);
            logApp(`Actualización periódica de mensaje Apex Info en guild ${guild.name} (${guild.id})`);
          }, 5 * 60 * 1000);

          // Chequeo de salud y actualización de embed solo al iniciar
          await checkApiHealth();
          const apiStatus = getGlobalApiStatus();
          const color = apiStatus.ok ? '🟢' : '🔴';
          const lastChecked = apiStatus.lastChecked
            ? apiStatus.lastChecked.toLocaleString()
            : 'Nunca';
          logApp(`Estado API: ${apiStatus.ok ? 'Conectado' : 'Desconectado'} | Última vez chequeado: ${lastChecked}`);
          console.log('------------------------------------------');
          console.log('  SERVIDOR/API Apex Range ');
          console.log(
            `  Estado: ${color} ${apiStatus.ok ? 'Conectado' : 'Desconectado'}`
          );
          console.log(`  Última vez chequeado: ${lastChecked}`);
          console.log('------------------------------------------');

          // Eventos que disparan actualización coalescida
          client.on(Events.GuildMemberAdd, (member) => {
            logApp(`Nuevo miembro: ${member.user.tag} (${member.id}) en guild ${member.guild.name} (${member.guild.id})`);
            console.log(
              `[Evento] Nuevo miembro: ${member.user.tag} (${member.id})`
            );
            throttler.requestUpdate(member.guild);
          });

          client.on(Events.GuildMemberRemove, (member) => {
            logApp(`Miembro salió: ${member.user.tag} (${member.id}) en guild ${member.guild.name} (${member.guild.id})`);
            console.log(
              `[Evento] Miembro salió: ${member.user.tag} (${member.id})`
            );
            throttler.requestUpdate(member.guild);
          });

          client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
            if (newPresence.guild) {
              logApp(`PresenceUpdate: ${newPresence.user?.tag ?? ''} (${newPresence.user?.id ?? ''}) en guild ${newPresence.guild.name} (${newPresence.guild.id})`);
              throttler.requestUpdate(newPresence.guild);
            }
          });
        }
      }
    } catch (error) {
      logApp(`ERROR durante la inicialización del bot: ${error}`);
      console.error('Error durante la inicialización del bot:', error);
    }
  });
}