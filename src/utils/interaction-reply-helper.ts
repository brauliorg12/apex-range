import {
  MessageFlags,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from 'discord.js';
import { logApp } from './logger';

/**
 * Helper para manejar respuestas de interacciones con manejo de permisos mejorado.
 *
 * Este helper resuelve problemas comunes de permisos en servidores grandes al:
 * 1. Usar reply ephemeral para navegación en lugar de update
 * 2. Proporcionar fallbacks robustos cuando fallan las operaciones
 * 3. Registrar errores específicos de permisos para debugging
 */
export class InteractionReplyHelper {
  /**
   * Responde a una interacción de navegación de forma segura.
   * Usa reply ephemeral para evitar problemas de permisos en servidores grandes.
   *
   * @param interaction La interacción del botón
   * @param embeds Embeds a enviar
   * @param components Componentes a enviar
   * @param isNavigationButton Si es navegación entre páginas (usa reply ephemeral)
   */
  static async safeNavigationReply(
    interaction: ButtonInteraction,
    embeds: EmbedBuilder[],
    components: ActionRowBuilder<ButtonBuilder>[],
    isNavigationButton: boolean = true
  ): Promise<void> {
    try {
      if (isNavigationButton) {
        // Para navegación, usar reply ephemeral para evitar problemas de permisos
        await interaction.reply({
          embeds,
          components,
          flags: MessageFlags.Ephemeral,
        });

        await logApp(
          `[SafeNavigationReply] ✅ Reply ephemeral exitoso para navegación en guild ${interaction.guild?.id}`
        );
      } else {
        // Para primera carga, usar editReply
        await interaction.editReply({
          embeds,
          components,
        });

        await logApp(
          `[SafeNavigationReply] ✅ EditReply exitoso para primera carga en guild ${interaction.guild?.id}`
        );
      }
    } catch (error: any) {
      await logApp(
        `[SafeNavigationReply] ❌ Error en respuesta (guild: ${interaction.guild?.id}): ${error.message}`
      );

      // Intentar fallback según el tipo de error
      if (error.code === 50013) {
        // Missing Permissions
        await this.handlePermissionError(interaction, isNavigationButton);
      } else if (error.code === 10008) {
        // Unknown Message
        await this.handleUnknownMessageError(interaction);
      } else {
        // Otros errores
        await this.handleGenericError(interaction, error);
      }
    }
  }

  /**
   * Maneja específicamente errores de permisos (código 50013).
   */
  private static async handlePermissionError(
    interaction: ButtonInteraction,
    isNavigationButton: boolean
  ): Promise<void> {
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('⚠️ Problema de Permisos')
      .setDescription(
        'El bot no tiene permisos suficientes para actualizar este mensaje. ' +
          'Esto es normal en servidores grandes. La información se ha mostrado de forma temporal.'
      )
      .setFooter({
        text: 'Contacta a un administrador si el problema persiste.',
      });

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [errorEmbed],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.followUp({
          embeds: [errorEmbed],
          flags: MessageFlags.Ephemeral,
        });
      }

      await logApp(
        `[SafeNavigationReply] ✅ Fallback de permisos exitoso para guild ${interaction.guild?.id}`
      );
    } catch (fallbackError) {
      await logApp(
        `[SafeNavigationReply] ❌ Fallo crítico en fallback de permisos: ${fallbackError}`
      );
    }
  }

  /**
   * Maneja errores de mensaje desconocido (código 10008).
   */
  private static async handleUnknownMessageError(
    interaction: ButtonInteraction
  ): Promise<void> {
    const errorEmbed = new EmbedBuilder()
      .setColor('#f39c12')
      .setTitle('🔄 Mensaje Expirado')
      .setDescription(
        'Este mensaje ha expirado o ya no existe. ' +
          'Por favor, usa el comando `/show-my-rank` nuevamente para ver la información actualizada.'
      );

    try {
      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (fallbackError) {
      await logApp(
        `[SafeNavigationReply] ❌ Fallo en manejo de mensaje desconocido: ${fallbackError}`
      );
    }
  }

  /**
   * Maneja errores genéricos.
   */
  private static async handleGenericError(
    interaction: ButtonInteraction,
    error: any
  ): Promise<void> {
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error Inesperado')
      .setDescription(
        'Ocurrió un error inesperado al procesar tu solicitud. ' +
          'Por favor, intenta nuevamente en unos momentos.'
      )
      .setFooter({ text: `Error Code: ${error.code || 'N/A'}` });

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          embeds: [errorEmbed],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.followUp({
          embeds: [errorEmbed],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (fallbackError) {
      await logApp(
        `[SafeNavigationReply] ❌ Fallo crítico en manejo de error genérico: ${fallbackError}`
      );
    }
  }
}
