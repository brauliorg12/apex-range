import { EmbedBuilder, ButtonInteraction } from 'discord.js';

/**
 * Crea un embed de error estándar para respuestas de setup.
 * @param title Título del embed
 * @param description Descripción del error
 * @returns EmbedBuilder configurado
 */
export function createErrorEmbed(
  title: string,
  description: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xff0000);
}

/**
 * Crea un embed de error para configuración fallida.
 * @param mode Modo de configuración que falló
 * @returns EmbedBuilder configurado con mensaje detallado
 */
export function createSetupErrorEmbed(mode: string): EmbedBuilder {
  const modeText =
    mode === 'auto'
      ? 'automática'
      : mode === 'manual'
      ? 'manual'
      : 'con canales existentes';

  return new EmbedBuilder()
    .setTitle('❌ Error en la Configuración')
    .setDescription(
      `Ocurrió un error durante la configuración ${modeText}.\n\n` +
        '**Posibles causas:**\n' +
        '• El bot no tiene permisos para crear canales\n' +
        `${mode === 'manual' ? '• Nombres de canales inválidos\n' : ''}` +
        `${
          mode === 'existente' ? '• Los canales especificados no existen\n' : ''
        }` +
        '• Error interno del servidor\n\n' +
        'Por favor, verifica los permisos del bot e intenta nuevamente.'
    )
    .setColor(0xff0000);
}

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
        name:
          '📍 Canales ' + (mode === 'existente' ? 'Configurados' : 'Creados'),
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
        name: '⏱️ Tiempo de Configuración:',
        value: `${result.elapsed} segundos`,
        inline: false,
      },
      {
        name: '👥 Usuarios Registrados:',
        value: `${userCount} ${userCount === 0 ? '(inicial)' : ''}`,
        inline: false,
      },
      {
        name: '📊 Estado:',
        value: result.statsUpdated
          ? '✅ Estadísticas actualizadas'
          : '⚠️ Error en estadísticas',
        inline: false,
      },
      {
        name: '🎮 Funcionalidades:',
        value:
          `• Panel interactivo ${
            mode === 'manual'
              ? 'personalizado'
              : mode === 'existente'
              ? 'configurado'
              : 'de rangos'
          }\n` +
          '• Sistema de selección automática\n' +
          '• Estadísticas en tiempo real\n' +
          '• Gestión de plataformas\n' +
          '• Búsqueda por rangos',
        inline: false,
      }
    )
    .setFooter({
      text: '¡Los usuarios ya pueden seleccionar sus rangos en el panel!',
      iconURL: interaction.guild?.iconURL() || undefined,
    })
    .setTimestamp();
}
