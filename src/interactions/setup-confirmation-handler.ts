import { ButtonInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { getServerLogger } from '../utils/server-logger';
import {
  verifyChannelAccessForButton,
  verifyBotPermissionsForButton,
} from '../helpers/button-verifications';
import { performSetup } from '../helpers/setup-roles/perform-setup';

/**
 * Maneja la confirmación y ejecución completa del setup para cualquier modo de configuración.
 *
 * Esta función central coordina todo el proceso de configuración del bot de Apex Legends,
 * desde la verificación de permisos hasta la ejecución final del setup. Soporta tres modos:
 * automático (canales predeterminados), manual (nombres personalizados) y existente (canales ya creados).
 *
 * El proceso incluye múltiples pasos de validación y proporciona feedback detallado al usuario
 * a través de embeds informativos durante todo el proceso.
 *
 * @param interaction - La interacción de botón que activó la confirmación del setup
 * @param mode - El modo de configuración seleccionado ('auto', 'manual', o 'existente')
 * @param options - Opciones adicionales específicas del modo (opcional)
 *                 Para modo manual: { canal_admin?: string, canal_publico?: string }
 * @returns Promise<void> - No retorna valor, maneja la respuesta directamente en la interacción
 */
export async function handleSetupConfirmation(
  interaction: ButtonInteraction,
  mode: 'auto' | 'manual' | 'existente',
  options?: { canal_admin?: string; canal_publico?: string }
): Promise<void> {
  if (!interaction.guild || !interaction.guildId) return;

  // Crear logger específico para este servidor
  const logger = getServerLogger(interaction.guild.id, interaction.guild.name);

  logger.info('=== INICIANDO handleSetupConfirmation ===');
  logger.info(`Modo: ${mode}`);
  logger.info(`CustomId: ${interaction.customId}`);
  logger.info(`Usuario: ${interaction.user.username} (${interaction.user.id})`);
  logger.info(`Guild: ${interaction.guild.name} (${interaction.guild.id})`);

  await interaction.deferUpdate();

  logger.info('deferUpdate completado');

  // PASO 1: Verificar acceso al canal
  const channel = interaction.channel;
  if (!channel || !('name' in channel) || channel.type !== 0) {
    // ChannelType.GuildText = 0
    logger.error(
      'No se pudo identificar el canal actual o no es un canal de texto'
    );
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription(
        'No se pudo identificar el canal actual o no es un canal de texto válido.'
      )
      .setColor(0xff0000);

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [],
    });
    return;
  }

  const textChannel = channel as TextChannel;

  logger.info(`Canal identificado: ${textChannel.name} (${textChannel.id})`);

  if (!(await verifyChannelAccessForButton(interaction, textChannel, logger))) {
    logger.info('Falta acceso al canal');
    return; // verifyChannelAccessForButton ya maneja la respuesta
  }
  logger.info('Acceso al canal verificado');

  // PASO 2: Verificar permisos del bot
  if (
    !(await verifyBotPermissionsForButton(interaction, textChannel, logger))
  ) {
    logger.info('Faltan permisos del bot');
    return; // verifyBotPermissionsForButton ya maneja la respuesta
  }
  logger.info('Permisos del bot verificados');

  // Configurar título y descripción según el modo
  const modeConfig = {
    auto: {
      title: '🔄 Ejecutando Configuración Automática',
      description:
        'Creando canales y configurando roles...\n\nEsto puede tomar unos segundos.',
      color: 0x00ff00,
      successTitle: '🎯 ¡Configuración Completada!',
      successDescription:
        'El sistema de rangos de **Apex Legends** ha sido configurado exitosamente en tu servidor.',
      successColor: 0x00ff00,
    },
    manual: {
      title: '⚙️ Ejecutando Configuración Manual',
      description:
        'Creando canales con nombres personalizados...\n\nEsto puede tomar unos segundos.',
      color: 0x0099ff,
      successTitle: '⚙️ ¡Configuración Manual Completada!',
      successDescription:
        'El sistema de rangos de **Apex Legends** ha sido configurado exitosamente con nombres personalizados.',
      successColor: 0x0099ff,
    },
    existente: {
      title: '📎 Ejecutando Configuración con Canales Existentes',
      description:
        'Configurando los canales existentes...\n\nEsto puede tomar unos segundos.',
      color: 0xffa500,
      successTitle: '📎 ¡Configuración con Canales Existentes Completada!',
      successDescription:
        'El sistema de rangos de **Apex Legends** ha sido configurado exitosamente usando tus canales existentes.',
      successColor: 0xffa500,
    },
  };

  const config = modeConfig[mode];

  // Mostrar embed de carga
  const loadingEmbed = new EmbedBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setColor(config.color);

  await interaction.editReply({
    embeds: [loadingEmbed],
    components: [], // Remover botones mientras se ejecuta
  });

  // Ejecutar el setup
  try {
    logger.info(`Iniciando configuración ${mode}...`);

    // Configurar opciones según el modo
    const setupOptions: any = { modo: mode };

    if (mode === 'manual') {
      // Para el modo manual, usar opciones pasadas o extraer del customId
      if (options?.canal_admin && options?.canal_publico) {
        setupOptions.canal_admin = options.canal_admin;
        setupOptions.canal_publico = options.canal_publico;
        logger.info(
          `Nombres desde opciones - Admin: ${setupOptions.canal_admin}, Panel: ${setupOptions.canal_publico}`
        );
      } else {
        // Fallback: extraer nombres de canales del customId
        const parts = interaction.customId.split('_');
        logger.info(`CustomId completo: ${interaction.customId}`);
        logger.info(`Partes del customId: ${JSON.stringify(parts)}`);
        if (parts.length >= 4) {
          setupOptions.canal_admin = parts[2]; // tercer elemento después de split
          setupOptions.canal_publico = parts[3]; // cuarto elemento
          logger.info(
            `Nombres extraídos - Admin: ${setupOptions.canal_admin}, Panel: ${setupOptions.canal_publico}`
          );
        } else {
          // Fallback a valores por defecto si no se pudieron extraer
          setupOptions.canal_admin = 'apex-range-admin';
          setupOptions.canal_publico = 'apex-rangos';
          logger.warn(
            'No se pudieron extraer nombres del customId, usando valores por defecto'
          );
        }
      }
    } else if (mode === 'existente') {
      // Para el modo existente, usar el canal actual como panel
      setupOptions.panelChannelId = textChannel.id;
    }

    logger.info(
      `Opciones finales para performSetup: ${JSON.stringify(setupOptions)}`
    );

    // Llamar a performSetup
    logger.info('Llamando a performSetup...');
    const result = await performSetup(
      textChannel,
      interaction,
      logger,
      setupOptions
    );
    logger.info('performSetup completado exitosamente');

    logger.info(`Configuración ${mode} completada exitosamente`);

    // Obtener información de los canales usando los nombres personalizados
    const guild = interaction.guild!;
    let controlChannelName = 'apex-range-admin'; // por defecto
    let panelChannelName = 'apex-rangos'; // por defecto

    // Si es modo manual, usar los nombres personalizados
    if (
      mode === 'manual' &&
      setupOptions.canal_admin &&
      setupOptions.canal_publico
    ) {
      controlChannelName = setupOptions.canal_admin;
      panelChannelName = setupOptions.canal_publico;
    }

    const controlChannel = guild.channels.cache.find(
      (ch) => ch.name === controlChannelName && ch.type === 0
    );
    const panelChannel =
      mode === 'existente'
        ? textChannel
        : guild.channels.cache.find(
            (ch) => ch.name === panelChannelName && ch.type === 0
          );

    // Obtener estadísticas de usuarios registrados
    const { readPlayers } = await import('../utils/state-manager');
    const registeredUsers = await readPlayers(guild.id);
    const userCount = registeredUsers.length;

    // Crear embed detallado de éxito
    const successEmbed = new EmbedBuilder()
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
                : `#${controlChannelName}`
            } *(Administración)*\n` +
            `• ${
              panelChannel ? `<#${panelChannel.id}>` : `#${panelChannelName}`
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

    await interaction.editReply({
      embeds: [successEmbed],
      components: [],
    });
  } catch (error) {
    console.error(`Error en setup ${mode}:`, error);
    logger.error(`Error en configuración ${mode}:`, error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error en la Configuración')
      .setDescription(
        `Ocurrió un error durante la configuración ${
          mode === 'auto'
            ? 'automática'
            : mode === 'manual'
            ? 'manual'
            : 'con canales existentes'
        }.\n\n` +
          '**Posibles causas:**\n' +
          '• El bot no tiene permisos para crear canales\n' +
          `${mode === 'manual' ? '• Nombres de canales inválidos\n' : ''}` +
          `${
            mode === 'existente'
              ? '• Los canales especificados no existen\n'
              : ''
          }` +
          '• Error interno del servidor\n\n' +
          'Por favor, verifica los permisos del bot e intenta nuevamente.'
      )
      .setColor(0xff0000);

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [],
    });
  }
}
