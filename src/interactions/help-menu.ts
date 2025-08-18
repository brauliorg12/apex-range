import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { createCloseButtonRow } from '../utils/button-helper';

export async function handleHelpMenu(interaction: ButtonInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const embed = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('📖 Ayuda de Comandos')
    .setDescription(
      [
        '**/setup-roles** — Configura el panel de selección de rango y el mensaje de estadísticas.',
        '**/total-jugadores** — Muestra el número total de jugadores con un rol de rango.',
        '**/api-status** — Muestra el estado actual de la API externa.',
        '',
        'También puedes usar los botones para gestionar tu rango o ver jugadores en línea.',
      ].join('\n')
    );

  await interaction.editReply({ embeds: [embed], components: [createCloseButtonRow()] });
}

export async function handleCloseHelpMenu(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  await interaction.deleteReply();
}
