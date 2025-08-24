import { Client, Guild, Events } from 'discord.js';
import { readState } from './utils/state-manager';
import { updateRoleCountMessage } from './utils/update-status-message';
import { updateBotPresence } from './utils/presence-helper';
import { getGlobalApiStatus } from './utils/global-api-status';
import { checkApiHealth } from './utils/api-health-check';
import { createUpdateThrottler } from './utils/update-throttler';

function printBanner(client: Client, guild: Guild, channelInfo: string) {
  const now = new Date();
  const fechaLocal = now.toLocaleString();
  const fechaUTC = now.toISOString();
  console.log('\x1b[36m');
  console.log('   🛡️  Apex Discord Bot - Panel de Jugadores 🛡️');
  console.log('   by Braulio Rodriguez');
  console.log('\x1b[0m');
  console.log('\x1b[32m%s\x1b[0m', '🟢 Bot conectado');
  console.log(`[App] Usuario Discord: ${client.user?.tag}`);
  console.log(`[App] Inicio: ${fechaLocal} (local) | ${fechaUTC} (UTC)`);
  console.log(`[App] Servidor: ${guild.name} (${guild.id})`);
  console.log(`[App] ${channelInfo}`);
}

export async function initBot(client: Client) {
  client.once(Events.ClientReady, async (readyClient) => {
    try {
      const state = await readState();
      if (state.guildId) {
        const guild = await readyClient.guilds.fetch(state.guildId);
        let channelInfo = '';
        if (state.channelId) {
          try {
            const channel = await guild.channels.fetch(state.channelId);
            if (channel && 'name' in channel) {
              channelInfo = `Canal: #${channel.name} (${channel.id})`;
            } else {
              channelInfo = `Canal: (no encontrado, id=${state.channelId})`;
            }
          } catch {
            channelInfo = `Canal: (no encontrado, id=${state.channelId})`;
          }
        } else {
          channelInfo = 'Canal: (no configurado)';
        }

        printBanner(client, guild, channelInfo);

        const throttler = createUpdateThrottler(
          60_000,
          async (guild: Guild) => {
            await updateRoleCountMessage(guild);
            await updateBotPresence(client, guild);
          }
        );

        throttler.requestUpdate(guild);

        // Chequeo de salud y actualización de embed solo al iniciar
        await checkApiHealth();
        const apiStatus = getGlobalApiStatus();
        const color = apiStatus.ok ? '🟢' : '🔴';
        const lastChecked = apiStatus.lastChecked
          ? apiStatus.lastChecked.toLocaleString()
          : 'Nunca';
        console.log('------------------------------------------');
        console.log('  SERVIDOR/API Apex Range ');
        console.log(
          `  Estado: ${color} ${apiStatus.ok ? 'Conectado' : 'Desconectado'}`
        );
        console.log(`  Última vez chequeado: ${lastChecked}`);
        console.log('------------------------------------------');

        // Eventos que disparan actualización coalescida
        client.on(Events.GuildMemberAdd, (member) => {
          console.log(
            `[Evento] Nuevo miembro: ${member.user.tag} (${member.id})`
          );
          throttler.requestUpdate(member.guild);
        });

        client.on(Events.GuildMemberRemove, (member) => {
          console.log(
            `[Evento] Miembro salió: ${member.user.tag} (${member.id})`
          );
          throttler.requestUpdate(member.guild);
        });

        client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
          if (newPresence.guild) {
            throttler.requestUpdate(newPresence.guild);
          }
        });
      }
    } catch (error) {
      console.error('Error durante la inicialización del bot:', error);
    }
  });
}
