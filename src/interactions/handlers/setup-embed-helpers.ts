import { EmbedBuilder, ButtonInteraction } from 'discord.js';
import {
  ALL_PLAYERS_EMOGI,
  SETTINGS_ALL_EMOGI,
  STATS_LOGO_EMOGI,
  TIMER_EMOGI,
} from '../../models/constants';

/**
 * Crea el embed de éxito para el setup completado.
 * @param config Configuración del modo
 * @param mode Modo de configuración
 * @param setupOptions Opciones del setup
 * @param result Resultado del performSetup
 * @param userCount Número de usuarios registrados
 * @param interaction Interacción del botón
 * @param guild Guild de Discord
 * @returns EmbedBuilder configurado
 */
export function createSuccessEmbed(
  config: any,
  mode: string,
  setupOptions: any,
  result: any,
  userCount: number,
  interaction: ButtonInteraction,
  guild: any
): EmbedBuilder {
  // Obtener información de los canales
  let controlChannel, panelChannel;

  if (mode === 'existente') {
    controlChannel = guild.channels.cache.get(setupOptions.controlChannelId);
    panelChannel = guild.channels.cache.get(setupOptions.panelChannelId);
  } else {
    let controlChannelName = 'apex-range-admin';
    let panelChannelName = 'apex-rangos';

    if (
      mode === 'manual' &&
      setupOptions.canal_admin &&
      setupOptions.canal_publico
    ) {
      controlChannelName = setupOptions.canal_admin;
      panelChannelName = setupOptions.canal_publico;
    }

    controlChannel = guild.channels.cache.find(
      (ch: any) => ch.name === controlChannelName && ch.type === 0
    );
    panelChannel = guild.channels.cache.find(
      (ch: any) => ch.name === panelChannelName && ch.type === 0
    );
  }

  return new EmbedBuilder()
    .setTitle(config.successTitle)
    .setDescription(config.successDescription)
    .setColor(config.successColor)
    .addFields(
      {
        name: SETTINGS_ALL_EMOGI + '  Tipo de Panel Interactivo:',
        value:
          mode === 'manual'
            ? 'Personalizado (nombres definidos por el usuario)'
            : mode === 'existente'
            ? 'Configurado con canales existentes'
            : 'Estándar de rangos (creado automáticamente)',
        inline: false,
      },
      {
        name:
          '📍 Canales ' + (mode === 'existente' ? 'Configurados:' : 'Creados:'),
        value:
          `• ${
            controlChannel
              ? `<#${controlChannel.id}>`
              : mode === 'existente'
              ? `<#${setupOptions.controlChannelId}>`
              : `Canal no encontrado`
          } *(Administración)*\n` +
          `• ${
            panelChannel
              ? `<#${panelChannel.id}>`
              : mode === 'existente'
              ? `<#${setupOptions.panelChannelId}>`
              : `Canal no encontrado`
          } *(Panel de Rangos)*`,
        inline: false,
      },
      {
        name: TIMER_EMOGI + ' Tiempo de Configuración:',
        value: `${result.elapsed} segundos`,
        inline: false,
      },
      {
        name: ALL_PLAYERS_EMOGI + ' Usuarios Registrados:',
        value: `${userCount} ${userCount === 0 ? '(inicial)' : ''}`,
        inline: false,
      },
      {
        name: STATS_LOGO_EMOGI + ' Estadísticas:',
        value: result.statsUpdated
          ? '✅ actualizadas'
          : '⚠️ Error en estadísticas',
        inline: false,
      },
      {
        name: SETTINGS_ALL_EMOGI + ' Funcionalidades',
        value:
          '• Gestión de rangos y plataformas\n' +
          '• Visualización de jugadores registrados con Estadísticas en tiempo real\n' +
          '• Panel de Gestión (Ver perfil Apex Global, Ayuda, etc.)',
        inline: false,
      }
    )
    .setFooter({
      text: '¡Los usuarios ya pueden seleccionar sus rangos en el panel!',
      iconURL: interaction.guild?.iconURL() || undefined,
    })
    .setTimestamp();
}
