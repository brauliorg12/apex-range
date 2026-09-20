import {
  MessageFlags,
  ActionRowBuilder,
  ModalBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { logInteraction } from '../../utils/logger';
import { handleShowAllPlayersMenu } from '../player-list';

/**
 * Asynchronously handles select menu interactions initiated by users.
 *
 * This function is responsible for processing user selections from string select menus.
 * It uses the `customId` of the interaction to identify the specific menu being used.
 * Current implementations include handling platform selection for Apex Legends profiles,
 * which then triggers a modal for username input, and filtering online players by their rank.
 * It includes error handling to ensure a smooth user experience.
 *
 * @param {StringSelectMenuInteraction} interaction The select menu interaction object from discord.js.
 */
export async function handleSelectMenuInteraction(
  interaction: StringSelectMenuInteraction
) {
  try {
    await logInteraction({
      type: 'SelectMenu',
      userTag: interaction.user.tag,
      userId: interaction.user.id,
      guildName: interaction.guild?.name,
      guildId: interaction.guild?.id,
      customId: interaction.customId,
    });

    const { customId } = interaction;

    if (customId === 'apex_platform_select') {
      const selectedPlatform = interaction.values[0];
      const modal = new ModalBuilder()
        .setCustomId(`apex_profile_modal_${selectedPlatform}`)
        .setTitle('Consulta tu perfil de Apex Legends');

      const nameInput = new TextInputBuilder()
        .setCustomId('apex_name')
        .setLabel('Nombre de usuario de Apex Legends')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ejemplo: Burlon23')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput)
      );

      await interaction.showModal(modal);
      return;
    }
    // --- RESTAURA EL BLOQUE PARA FILTRO DE RANGO ---
    else if (customId === 'RANK_FILTER') {
      const selectedRankShortId = interaction.values[0];
      // Solo mostrar los jugadores en línea para el filtro
      await handleShowAllPlayersMenu(interaction, selectedRankShortId, true);
      return;
    }
    // ------------------------------------------------
    else if (customId === 'select_channels_existente') {
      // await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.deferUpdate(); // Cambia deferReply a deferUpdate para editar el mensaje público

      if (interaction.values.length !== 2) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Selección Inválida')
          .setDescription(
            'Debes seleccionar exactamente **2 canales** para continuar.'
          )
          .setColor(0xff0000);

        await interaction.editReply({
          // Cambia reply a editReply
          embeds: [errorEmbed],
          components: [],
        });
        return;
      }

      const [adminChannelId, panelChannelId] = interaction.values;

      if (adminChannelId === panelChannelId) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Canales Duplicados')
          .setDescription(
            'Los canales de administración y panel deben ser diferentes.'
          )
          .setColor(0xff0000);

        await interaction.editReply({
          // Cambia reply a editReply
          embeds: [errorEmbed],
          components: [],
        });
        return;
      }

      // Obtener los canales
      const adminChannel =
        interaction.guild!.channels.cache.get(adminChannelId);
      const panelChannel =
        interaction.guild!.channels.cache.get(panelChannelId);

      if (!adminChannel || !panelChannel) {
        const errorEmbed = new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('Uno o ambos canales seleccionados ya no existen.')
          .setColor(0xff0000);

        await interaction.editReply({
          // Cambia reply a editReply
          embeds: [errorEmbed],
          components: [],
        });
        return;
      }

      // Mostrar confirmación
      const confirmEmbed = new EmbedBuilder()
        .setTitle('📎 Confirmación - Canales Existentes')
        .setDescription(
          'Has seleccionado los siguientes canales para la configuración:\n\n' +
            `**Canal de Administración:** ${adminChannel}\n` +
            `**Canal del Panel:** ${panelChannel}\n\n` +
            '¿Deseas usar estos canales para configurar el bot?'
        )
        .setColor(0xffa500)
        .addFields(
          {
            name: '🔒 Canal de Administración',
            value: `• Nombre: \`#${adminChannel.name}\`\n• ID: \`${adminChannel.id}\`\n• Se configurarán permisos restringidos`,
            inline: true,
          },
          {
            name: '📊 Canal del Panel',
            value: `• Nombre: \`#${panelChannel.name}\`\n• ID: \`${panelChannel.id}\`\n• Será visible para todos los usuarios`,
            inline: true,
          }
        );

      const confirmButtons =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('back_to_modes')
            .setLabel('Volver')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️'),
          new ButtonBuilder()
            .setCustomId(
              `confirm_existente_${adminChannelId}_${panelChannelId}`
            )
            .setLabel('Confirmar Canales')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId('cancel_setup')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌')
        );

      await interaction.editReply({
        embeds: [confirmEmbed],
        components: [confirmButtons],
      });
      return;
    }
  } catch (error) {
    console.error('Error en handleSelectMenuInteraction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Ocurrió un error al procesar el menú.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
