import { Client, Guild, Events } from 'discord.js';
import { readState } from './utils/state-manager';
import { updateRoleCountMessage } from './utils/update-status-message';
import { updateBotPresence } from './utils/presence-helper';
import { getGlobalApiStatus } from './utils/global-api-status';
import { checkApiHealth } from './utils/api-health-check';
import { createUpdateThrottler } from './utils/update-throttler';

export async function initBot(client: Client) {
  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`¡Listo! Logueado como ${readyClient.user.tag}`);

    try {
      const state = await readState();
      if (state.guildId) {
        const guild = await readyClient.guilds.fetch(state.guildId);
        let channelInfo = '';
        if (state.channelId) {
          try {
            const channel = await guild.channels.fetch(state.channelId);
            if (channel && 'name' in channel) {
              channelInfo = `Canal: ${channel.name} (${channel.id})`;
            } else {
              channelInfo = `Canal: (no encontrado, id=${state.channelId})`;
            }
          } catch {
            channelInfo = `Canal: (no encontrado, id=${state.channelId})`;
          }
        } else {
          channelInfo = 'Canal: (no configurado)';
        }

        const throttler = createUpdateThrottler(
          60_000,
          async (guild: Guild) => {
            await updateRoleCountMessage(guild);
            await updateBotPresence(client, guild);
          }
        );

        throttler.requestUpdate(guild);

        // Chequeo de salud y actualización de embed cada 60 segundos (coalescida por el throttler)
        const updateApiStatusEmbed = async () => {
          await checkApiHealth();
          throttler.requestUpdate(guild);

          // --- LOG  ---
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
          console.log(`  Servidor: ${guild.name} (${guild.id})`);
          console.log(`  ${channelInfo}`);
          console.log('------------------------------------------');
          // --- FIN LOG ---
        };

        // Primer chequeo y actualización al iniciar
        await updateApiStatusEmbed();

        // Luego cada 60 segundos
        setInterval(updateApiStatusEmbed, 60_000);

        // Eventos que disparan actualización coalescida
        client.on(Events.GuildMemberAdd, (member) => {
          throttler.requestUpdate(member.guild);
        });

        client.on(Events.GuildMemberRemove, (member) => {
          throttler.requestUpdate(member.guild);
        });

        client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
          if (newPresence.guild) throttler.requestUpdate(newPresence.guild);
        });
      }
    } catch (error) {
      console.error('Error durante la inicialización del bot:', error);
    }
  });
}
