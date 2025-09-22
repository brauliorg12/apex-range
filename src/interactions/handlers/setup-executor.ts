import { ButtonInteraction, TextChannel, EmbedBuilder } from 'discord.js';
import { performSetup } from '../../helpers/setup-roles/perform-setup';
import { createSuccessEmbed } from './setup-embed-helpers';
import { readPlayers } from '../../utils/state-manager';

/**
 * Ejecuta el setup completo y maneja el resultado.
 * @param interaction La interacción del botón
 * @param mode Modo de configuración
 * @param textChannel Canal actual
 * @param setupOptions Opciones del setup
 * @param config Configuración del modo
 * @param logger Logger del servidor
 */
export async function executeSetup(
  interaction: ButtonInteraction,
  mode: string,
  textChannel: TextChannel,
  setupOptions: any,
  config: any,
  logger: any
): Promise<void> {
  logger.info(
    `Opciones finales para performSetup: ${JSON.stringify(setupOptions)}`
  );

  logger.info('Llamando a performSetup...');
  const result = await performSetup(
    textChannel,
    interaction,
    logger,
    setupOptions
  );
  logger.info('performSetup completado exitosamente');

  // Agrega esta línea para refrescar la cache de canales
  await interaction.guild!.channels.fetch();

  logger.info(`Configuración ${mode} completada exitosamente`);

  try {
    logger.info('Creando embed de éxito...');

    // Obtener información de los canales usando los nombres personalizados
    const guild = interaction.guild!;

    // Obtener estadísticas de usuarios registrados
    let userCount = 0;
    try {
      const registeredUsers = await readPlayers(guild.id);
      userCount = registeredUsers.length;
    } catch (error) {
      logger.warn('Error al obtener estadísticas de usuarios:', error);
      // Continuar con userCount = 0
    }

    // Crear embed detallado de éxito
    const successEmbed = createSuccessEmbed(
      config,
      mode,
      setupOptions,
      result,
      userCount,
      interaction,
      guild
    );

    logger.info('Embed de éxito creado correctamente');

    logger.info('Enviando respuesta de éxito...');
    try {
      await interaction.editReply({
        embeds: [successEmbed],
        components: [],
      });
      logger.info('Respuesta de éxito enviada correctamente');

      // Agregar aquí para eliminar el mensaje original público después del éxito
      await interaction.message.delete().catch(() => {}); // Ignora errores si ya se eliminó
    } catch (editError) {
      logger.warn(
        'No se pudo editar el mensaje de carga, intentando followUp:',
        editError
      );
      // Si no se puede editar el mensaje de carga (puede estar expirado), enviar nuevo mensaje
      await interaction.followUp({
        embeds: [successEmbed],
        components: [],
        ephemeral: true,
      });
      logger.info('Respuesta de éxito enviada via followUp');
    }
  } catch (error) {
    logger.error('Error al enviar respuesta de éxito:', error);
    logger.error('Detalles del error:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });

    // Si el setup se completó pero falló la respuesta, intentar enviar el embed de éxito
    if (result && result.elapsed) {
      logger.info(
        'Setup completado, intentando enviar embed de éxito a pesar del error...'
      );
      try {
        const guild = interaction.guild!;

        let userCount = 0;
        try {
          const registeredUsers = await readPlayers(guild.id);
          userCount = registeredUsers.length;
        } catch (statsError) {
          logger.warn('Error al obtener estadísticas en fallback:', statsError);
        }

        const successEmbed = createSuccessEmbed(
          config,
          mode,
          setupOptions,
          result,
          userCount,
          interaction,
          guild
        );

        await interaction.followUp({
          embeds: [successEmbed],
          components: [],
          ephemeral: true,
        });
        logger.info('Embed de éxito enviado exitosamente en fallback');
        return;
      } catch (fallbackError) {
        logger.error('Error en fallback del embed de éxito:', fallbackError);
      }
    }

    // Solo mostrar error si realmente falló el setup
    try {
      logger.info('Intentando enviar respuesta de error...');
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error en la Respuesta')
        .setDescription(
          'La configuración se completó, pero hubo un problema al mostrar el resultado. Revisa los canales creados para confirmar que el setup funcionó.'
        )
        .setColor(0xffa500);

      await interaction.editReply({
        embeds: [errorEmbed],
        components: [],
      });
      logger.info('Mensaje de error editado correctamente');
    } catch (editError: any) {
      logger.warn(
        'No se pudo editar la respuesta, enviando nuevo mensaje:',
        editError.message
      );
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error en la Respuesta')
        .setDescription(
          'La configuración se completó, pero hubo un problema al mostrar el resultado. Revisa los canales creados para confirmar que el setup funcionó.'
        )
        .setColor(0xffa500);

      await interaction.followUp({
        embeds: [errorEmbed],
        components: [],
        ephemeral: true,
      });
      logger.info('Nuevo mensaje de error enviado correctamente');
    }
  }
}
