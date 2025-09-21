import { ButtonInteraction } from 'discord.js';
import { handleServerStatusInfo } from '../../commands/apex-status';
import {
  handleCreateMissingRoles,
  handleShowManualInstructions,
  handleCancelSetup,
  handleConfirmMappings,
  handleSkipMappings,
  handleProceedCreateRoles,
} from '../../configs/setup-roles-handlers';
import { logInteraction, logApp } from '../../utils/logger';
import { getRankPageEmbed } from '../../utils/online-embed-helper';
import { MAX_PLAYERS_PER_CARD } from '../../models/constants';
import { handleButtonInteraction } from '../../button-interactions';
import { handlePlatformAssignment } from '../rank-management';

/**
 * Maneja interacciones de botones
 * @param interaction La interacción del botón
 * @returns Promise<void>
 */
export async function handleButton(interaction: ButtonInteraction) {
  await logInteraction({
    type: 'Button',
    userTag: interaction.user.tag,
    userId: interaction.user.id,
    guildName: interaction.guild!.name,
    guildId: interaction.guild!.id,
    customId: interaction.customId,
  });

  if (interaction.customId === 'server_status_info') {
    await handleServerStatusInfo(interaction);
    return;
  }

  // Handlers para setup-roles
  if (interaction.customId === 'create_missing_roles') {
    await handleCreateMissingRoles(interaction);
    return;
  }

  if (interaction.customId === 'show_manual_instructions') {
    await handleShowManualInstructions(interaction);
    return;
  }

  if (interaction.customId === 'cancel_setup') {
    await handleCancelSetup(interaction);
    return;
  }

  if (interaction.customId === 'confirm_mappings') {
    await handleConfirmMappings(interaction);
    return;
  }

  if (interaction.customId === 'skip_mappings') {
    await handleSkipMappings(interaction);
    return;
  }

  if (interaction.customId === 'proceed_create_roles') {
    await handleProceedCreateRoles(interaction);
    return;
  }

  // Handler para selección de plataforma
  if (interaction.customId.startsWith('platform_')) {
    await handlePlatformAssignment(interaction);
    return;
  }

  // Handler para botón "Ver más"
  if (interaction.customId.startsWith('rank_')) {
    const match = interaction.customId.match(/^rank_(\w+)_vermas$/);
    if (match) {
      const rankId = match[1];
      const pageResult = await getRankPageEmbed(
        interaction.guild!,
        rankId,
        1,
        MAX_PLAYERS_PER_CARD,
        true
      );
      if (!pageResult)
        return await interaction.reply({
          content: 'No hay datos.',
          ephemeral: true,
        });

      await interaction.reply({
        embeds: [pageResult.embed],
        files: pageResult.files,
        components: pageResult.components,
        ephemeral: true,
      });
      return;
    }

    // Handler para paginación efímera
    const pagMatch = interaction.customId.match(/^rank_(\w+)_(prev|next)$/);
    if (pagMatch) {
      const rankId = pagMatch[1];
      const action = pagMatch[2];
      // Obtener página actual del mensaje
      const footer = interaction.message.embeds[0]?.footer?.text;

      // Expresion regular para paginado
      const pageMatch = footer?.match(/Página (\d+)\s*(?:de|\/)\s*(\d+)/i);

      let page = pageMatch ? parseInt(pageMatch[1]) : 1;
      const totalPages = pageMatch ? parseInt(pageMatch[2]) : 1;

      // Actualiza el número de página según la acción del botón ("Siguiente" o "Anterior")
      if (action === 'next' && page < totalPages) page++;
      if (action === 'prev' && page > 1) page--;

      const pageResult = await getRankPageEmbed(
        interaction.guild!,
        rankId,
        page,
        MAX_PLAYERS_PER_CARD // cantidad por pagina
      );
      if (!pageResult)
        return await interaction.reply({
          content: 'No hay datos.',
          ephemeral: true,
        });

      await interaction.update({
        embeds: [pageResult.embed],
        files: pageResult.files,
        components: pageResult.components,
      });
      return;
    }
  }

  try {
    await handleButtonInteraction(interaction);
    await logApp(
      `[Interacción] Botón '${interaction.customId}' procesado exitosamente por ${interaction.user.tag}.`
    );
  } catch (error) {
    await logApp(
      `[ERROR] Error al manejar el botón '${interaction.customId}': ${error}`
    );
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: '¡Hubo un error al procesar este botón!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: '¡Hubo un error al procesar este botón!',
        ephemeral: true,
      });
    }
  }
}
