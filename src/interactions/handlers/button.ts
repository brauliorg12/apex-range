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
import { MAX_PLAYERS_PER_PAGE } from '../../models/constants';
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

      // LOG: Debug del botón "Ver más"
      await logApp(
        `[Button Ver más] Guild: ${interaction.guild!.name} (${
          interaction.guild!.id
        }) | ` + `RankId: ${rankId} | Usuario: ${interaction.user.tag}`
      );

      const pageResult = await getRankPageEmbed(
        interaction.guild!,
        rankId,
        1,
        MAX_PLAYERS_PER_PAGE, // cantidad por página efímera
        true
      );

      if (!pageResult) {
        // LOG: Por qué no hay datos
        await logApp(
          `[Button Ver más] ⚠️ NO HAY DATOS para rankId: ${rankId} en guild ${
            interaction.guild!.id
          }. ` +
            `Posibles causas: 1) playerData vacío, 2) rol no encontrado, 3) no hay jugadores con ese rango.`
        );

        return await interaction.reply({
          content:
            '⚠️ No hay datos disponibles. Puede que la sincronización aún no se haya ejecutado (espera 2 minutos) o no hay jugadores con este rango.',
          ephemeral: true,
        });
      }

      await logApp(
        `[Button Ver más] ✅ Mostrando página con ${pageResult.page}/${pageResult.totalPages} páginas`
      );

      await interaction.reply({
        embeds: [pageResult.embed],
        files: pageResult.files,
        components: pageResult.components,
        ephemeral: true,
      });
      return;
    }

    // Handler para paginación efímera (nuevo formato con número de página en el ID)
    const pagMatch = interaction.customId.match(
      /^rank_(\w+)_(prev|next)_(\d+)$/
    );
    if (pagMatch) {
      const rankId = pagMatch[1];
      // El tercer grupo contiene LA PÁGINA OBJETIVO que viene embebida en el customId.
      // Antes se trataba como "current page" y se le sumaba/restaba 1, lo que
      // provocaba saltos (ej: 1 -> 3). Usar directamente el número embebido.
      const targetPage = parseInt(pagMatch[3], 10);

      const pageResult = await getRankPageEmbed(
        interaction.guild!,
        rankId,
        targetPage, // usar la página objetivo indicada por el botón
        MAX_PLAYERS_PER_PAGE,
        true
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
