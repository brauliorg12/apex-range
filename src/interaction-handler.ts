import { Interaction, Client, Events } from 'discord.js';
import {
  handleButtonInteraction,
  handleSelectMenuInteraction,
} from './button-interactions';
import { handleModalInteraction } from './modal-interactions';
import { handleServerStatusInfo } from './commands/apex-status';
import {
  handleCreateMissingRoles,
  handleShowManualInstructions,
  handleContinueSetup,
  handleCancelSetup,
} from './configs/setup-roles-handlers';
import { logInteraction } from './utils/logger';
import { getRankPageEmbed } from './utils/online-embed-helper';
import { MAX_PLAYERS_PER_CARD } from './models/constants';

/**
 * Registra el manejador principal de interacciones del bot.
 * Procesa comandos, botones, menús select y modales,
 * gestionando la lógica y los errores de cada tipo de interacción.
 */
export function registerInteractionHandler(client: Client) {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.guild) return;

    const commands = (client as any).commands;

    if (interaction.isChatInputCommand()) {
      await logInteraction({
        type: 'ChatInputCommand',
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        guildName: interaction.guild.name,
        guildId: interaction.guild.id,
        commandName: interaction.commandName,
        details: `Options: ${JSON.stringify(interaction.options?.data ?? {})}`,
      });

      const command = commands.get(interaction.commandName);
      if (!command) {
        console.warn(
          `[Advertencia] Comando desconocido: ${interaction.commandName}`
        );
        return;
      }
      try {
        await command.execute(interaction);
        console.log(
          `[Interacción] Comando '${interaction.commandName}' ejecutado por ${interaction.user.tag}.`
        );
      } catch (error) {
        console.error(
          `[ERROR] Error al ejecutar el comando '${interaction.commandName}':`,
          error
        );
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: '¡Hubo un error al ejecutar este comando!',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '¡Hubo un error al ejecutar este comando!',
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isUserContextMenuCommand()) {
      await logInteraction({
        type: 'UserContextMenuCommand',
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        guildName: interaction.guild.name,
        guildId: interaction.guild.id,
        commandName: interaction.commandName,
      });

      const command = commands.get(interaction.commandName);
      if (!command) {
        console.warn(
          `[Advertencia] Comando de contexto desconocido: ${interaction.commandName}`
        );
        return;
      }

      try {
        await command.execute(interaction);
        console.log(
          `[Interacción] Comando de contexto '${interaction.commandName}' ejecutado por ${interaction.user.tag}.`
        );
      } catch (error) {
        console.error(
          `[ERROR] Error al ejecutar el comando de contexto '${interaction.commandName}':`,
          error
        );
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: '¡Hubo un error al ejecutar este comando!',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '¡Hubo un error al ejecutar este comando!',
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isButton()) {
      await logInteraction({
        type: 'Button',
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        guildName: interaction.guild.name,
        guildId: interaction.guild.id,
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

      if (interaction.customId === 'continue_setup') {
        await handleContinueSetup(interaction);
        return;
      }

      if (interaction.customId === 'cancel_setup') {
        await handleCancelSetup(interaction);
        return;
      }

      // Handler para botón "Ver más"
      if (interaction.customId.startsWith('rank_')) {
        const match = interaction.customId.match(/^rank_(\w+)_vermas$/);
        if (match) {
          const rankId = match[1];
          const pageResult = await getRankPageEmbed(
            interaction.guild,
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
            interaction.guild,
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
        console.log(
          `[Interacción] Botón '${interaction.customId}' procesado exitosamente por ${interaction.user.tag}.`
        );
      } catch (error) {
        console.error(
          `[ERROR] Error al manejar el botón '${interaction.customId}':`,
          error
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
    } else if (interaction.isStringSelectMenu()) {
      await logInteraction({
        type: 'StringSelectMenu',
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        guildName: interaction.guild.name,
        guildId: interaction.guild.id,
        customId: interaction.customId,
        details: `Values: ${JSON.stringify(interaction.values)}`,
      });

      try {
        await handleSelectMenuInteraction(interaction);
      } catch (error) {
        console.error('[ERROR] Error al manejar el select:', error);
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: '¡Hubo un error al procesar tu selección!',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '¡Hubo un error al procesar tu selección!',
            ephemeral: true,
          });
        }
      }
    } else if (interaction.isModalSubmit()) {
      await logInteraction({
        type: 'ModalSubmit',
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        guildName: interaction.guild.name,
        guildId: interaction.guild.id,
        customId: interaction.customId,
      });

      try {
        await handleModalInteraction(interaction);
      } catch (error) {
        console.error('[ERROR] Error al manejar el modal:', error);
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: '¡Hubo un error al procesar tu solicitud!',
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: '¡Hubo un error al procesar tu solicitud!',
            ephemeral: true,
          });
        }
      }
    }
  });
}
