import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { createApexStatusEmbeds } from '../utils/apex-status-embed';
import { writeApexStatusState } from '../utils/state-manager';
import { clearApiCache } from '../utils/apex-api-cache';

export const data = new SlashCommandBuilder()
  .setName('apex-status')
  .setDescription(
    'Muestra el estado actual de Apex Legends (rotación de mapas y Predator RP)'
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  try {
    // Limpiar cache antes de consultar la API
    await clearApiCache(
      interaction.guildId ?? undefined,
      interaction.channelId ?? undefined
    );

    const embeds = await createApexStatusEmbeds(
      interaction.guildId ?? undefined,
      interaction.channelId ?? undefined
    );

    // Botón "Ver mi perfil Apex"
    const apexProfileButtonRow =
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('show_apex_profile_modal')
          .setLabel('Ver mi perfil Apex')
          .setStyle(ButtonStyle.Primary)
      );

    const reply = await interaction.editReply({
      embeds,
      components: [apexProfileButtonRow],
    });

    // Registrar el mensaje para actualización automática
    await writeApexStatusState({
      apexInfoMessageId: reply.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId!,
    });

    await interaction.followUp({
      content:
        'El estado de Apex Legends se actualizará automáticamente cada 5 minutos.',
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error en /apex-status:', error);
    await interaction.editReply({
      content: 'No se pudo obtener el estado de Apex Legends.',
    });
  }
}
