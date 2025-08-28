import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { createCloseButtonRow } from '../utils/button-helper';

export async function handleHelpMenu(interaction: ButtonInteraction) {
  console.log(
    `[Interacción] ${interaction.user.tag} ha solicitado el menú de ayuda.`
  );

  await interaction.deferReply({ ephemeral: true });

  const embed = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('📖 Ayuda de Comandos')
    .setDescription(
      [
        '**/setup-roles** — Configura el panel de selección de rango y el mensaje de estadísticas.',
        '**/apex-status** — Muestra el estado de Apex (mapas, Predator RP).',
        '**/total-jugadores** — Muestra el número total de jugadores con un rol de rango.',
        '**/api-status** — Muestra el estado actual de la API externa.',
        '',
        'Botones disponibles:',
        '• Gestionar Rango — Selecciona o cambia tu rango.',
        '• Todos los Jugadores — Lista completa con fecha de registro.',
        '• Ayuda — Abre este menú.',
        '• Cerrar — Cierra el mensaje actual.',
      ].join('\n')
    );

  await interaction.editReply({
    embeds: [embed],
    components: [createCloseButtonRow()],
  });
}

export async function handleCloseHelpMenu(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  await interaction.deleteReply();

  console.log(
    `[Interacción] ${interaction.user.tag} ha cerrado el menú de ayuda.`
  );
}
