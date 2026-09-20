import {
  MessageFlags,
  ButtonInteraction,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { getServerLogger } from '../utils/server-logger';
import { extractChannelsForExistingMode } from './handlers/setup-channels-extractor';
import { validateChannelAccess } from './handlers/setup-channel-access-validator';
import { validateBotPermissions } from './handlers/setup-bot-permissions-validator';
import { buildSetupOptions } from './handlers/setup-options-builder';
import { executeSetup } from './handlers/setup-executor';
import {
  createErrorEmbed,
  createSetupErrorEmbed,
} from './handlers/setup-error-embed';

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
 * @param interaction La interacción de botón que activó la confirmación del setup
 * @param mode El modo de configuración seleccionado ('auto', 'manual', o 'existente')
 * @param options Opciones adicionales específicas del modo (opcional)
 * @returns Promise<void>
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

  // Extraer canales para modo existente
  let controlChannel: TextChannel | undefined;
  let panelChannel: TextChannel | undefined;
  if (mode === 'existente') {
    // Si se pasaron opciones con IDs de canales, usarlos directamente
    if (options?.canal_admin && options?.canal_publico) {
      const adminCh = interaction.guild!.channels.cache.get(
        options.canal_admin
      );
      const panelCh = interaction.guild!.channels.cache.get(
        options.canal_publico
      );

      if (!adminCh || !panelCh || adminCh.type !== 0 || panelCh.type !== 0) {
        await interaction.followUp({
          embeds: [
            createErrorEmbed(
              '❌ Error',
              'Los canales seleccionados ya no existen o no son válidos.'
            ),
          ],
          components: [],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      controlChannel = adminCh as TextChannel;
      panelChannel = panelCh as TextChannel;
      logger.info(
        `Canales obtenidos de opciones - Admin: #${controlChannel.name}, Panel: #${panelChannel.name}`
      );
    } else {
      // Método alternativo: extraer del customId (para compatibilidad)
      const channels = await extractChannelsForExistingMode(
        interaction,
        logger
      );
      if (!channels) {
        await interaction.followUp({
          embeds: [
            createErrorEmbed(
              '❌ Error',
              'Los canales seleccionados ya no existen o no son válidos.'
            ),
          ],
          components: [],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      controlChannel = channels.controlChannel;
      panelChannel = channels.panelChannel;
    }
  }

  // Validar acceso al canal actual
  const textChannel = await validateChannelAccess(interaction, mode, logger);
  if (!textChannel) {
    await interaction.followUp({
      embeds: [
        createErrorEmbed(
          '❌ Error',
          'No se pudo identificar el canal actual o no es un canal de texto válido.'
        ),
      ],
      components: [],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Validar permisos del bot
  if (
    !(await validateBotPermissions(
      interaction,
      mode,
      textChannel,
      controlChannel,
      panelChannel,
      logger
    ))
  ) {
    return; // validateBotPermissions maneja la respuesta de error
  }

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
    components: [],
  });

  // Ejecutar setup
  try {
    logger.info(`Iniciando configuración ${mode}...`);

    // Construir opciones de setup
    const setupOptions = buildSetupOptions(
      mode,
      controlChannel,
      panelChannel,
      options,
      interaction,
      logger
    );

    await executeSetup(
      interaction,
      mode,
      textChannel,
      setupOptions,
      config,
      logger
    );
  } catch (error) {
    console.error(`Error en setup ${mode}:`, error);
    logger.error(`Error en configuración ${mode}:`, error);

    await interaction.editReply({
      embeds: [createSetupErrorEmbed(mode)],
      components: [],
    });
  }
}
