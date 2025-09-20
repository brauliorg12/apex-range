import { ButtonInteraction, GuildMember, EmbedBuilder } from 'discord.js';
import { createCloseButtonRow } from '../utils/button-helper';
import { logApp } from '../utils/logger';

/**
 * Maneja el menú de gestión de rango para un usuario.
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function handleManageRankMenu(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.member) return;
  const member = interaction.member as GuildMember;

  await logApp(
    `[Interacción] ${interaction.user.tag} abrió el menú de gestión de rango.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    const { buildManageRankPayload } = await import('./rank-menu-builder');
    const payload = await buildManageRankPayload(interaction.guild, member);

    await interaction.editReply(payload);
  } catch (error) {
    console.error('Error al mostrar menú de gestión de rango:', error);

    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription('Hubo un error al cargar el menú de gestión de rango.');

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
