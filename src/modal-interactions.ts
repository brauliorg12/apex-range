import { ModalSubmitInteraction } from 'discord.js';
import { createCloseButtonRow } from './utils/button-helper';
import { getApexProfileByName } from './services/apex-api';
import { buildApexProfileEmbed } from './utils/apex-profile-embed'; // Nuevo import

/**
 * Handler principal para interacciones de modal de perfil de Apex.
 * Valida plataforma, consulta la API y responde con un embed profesional.
 */
export async function handleModalInteraction(
  interaction: ModalSubmitInteraction
) {
  try {
    if (interaction.customId === 'apex_profile_modal') {
      await interaction.deferReply({ ephemeral: true });

      // Obtiene datos del modal
      const playerName = interaction.fields.getTextInputValue('apex_name');
      const platform = interaction.fields
        .getTextInputValue('apex_platform')
        .toUpperCase();

      // Valida plataforma permitida
      const allowed = ['PC', 'PS4', 'X1'];
      if (!allowed.includes(platform)) {
        await interaction.editReply({
          content: `Plataforma inválida. Solo se permite: PC, PS4 o X1.`,
          components: [createCloseButtonRow()],
        });
        return;
      }

      // Consulta la API externa
      const profile = await getApexProfileByName(playerName, platform);

      // Si hay error en la respuesta, muestra mensaje de error
      if (!profile || profile.Error) {
        console.log('[API][Perfil] status: ERROR');
        await interaction.editReply({
          embeds: [
            {
              title: 'Error al obtener perfil',
              description: `No se pudo obtener el perfil para **${playerName}** (${platform}).`,
              color: 0xed4245,
            },
          ],
          components: [createCloseButtonRow()],
        });
        return;
      } else {
        console.log('[API][Perfil] status: OK');
      }

      // Genera el embed profesional usando función separada
      const embed = buildApexProfileEmbed(profile, playerName, platform);

      await interaction.editReply({
        embeds: [embed],
        components: [createCloseButtonRow()],
      });
    }
  } catch (error) {
    console.error('Error en handleModalInteraction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Ocurrió un error al procesar el modal.',
        ephemeral: true,
        components: [createCloseButtonRow()],
      });
    }
  }
}
