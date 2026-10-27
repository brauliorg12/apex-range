import {
  MessageFlags,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';
import { logApp } from '../utils/logger';

/** Longitud mínima aceptada por el buscador de jugadores. */
export const MIN_QUERY_LENGTH = 3;

/**
 * Abre el modal de búsqueda de jugadores.
 *
 * Registra el contexto antes de mostrar el modal y, si falla, intenta avisar
 * al usuario sin romper la interacción.
 *
 * @param interaction - Interacción del botón que abre el buscador.
 */
export async function handleOpenPlayerSearchModal(
  interaction: ButtonInteraction
): Promise<void> {
  try {
    await logApp(
      `[player-search] Intentando abrir modal. user=${interaction.user.id} guild=${interaction.guild?.id} channel=${interaction.channel?.id} message=${interaction.message?.id} customId=${interaction.customId}`
    );
    const modal = new ModalBuilder()
      .setCustomId('player_search_modal')
      .setTitle('Buscar Jugador');

    const input = new TextInputBuilder()
      .setCustomId('player_search_query')
      .setLabel('Nombre (mín. 3 caracteres)')
      .setStyle(TextInputStyle.Short)
      .setMinLength(MIN_QUERY_LENGTH)
      .setPlaceholder('Escribe al menos 3 caracteres')
      .setRequired(true);

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);

    modal.addComponents(row);
    await logApp(`[player-search] Llamando interaction.showModal()`);
    await interaction.showModal(modal);
    await logApp(
      `[player-search] showModal invoked successfully for user=${interaction.user.id}`
    );
  } catch (error) {
    const stack = error instanceof Error ? error.stack : String(error);
    await logApp(`[player-search] Error abriendo modal: ${stack}`);

    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            'No se pudo abrir el modal de búsqueda. Intenta usar el panel de gestión directamente o ejecuta `/setup-roles` para recrear el panel si fue modificado.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      const replyStack =
        replyError instanceof Error ? replyError.stack : String(replyError);
      await logApp(
        `[player-search] Error respondiendo al usuario tras fallo de modal: ${replyStack}`
      );
    }
  }
}
