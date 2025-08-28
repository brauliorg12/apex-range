import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import {
  readRolesState,
  writeRolesState,
  readApexStatusState,
  writeApexStatusState,
} from './state-manager';
import { getPlayerStats } from './player-stats';
import { createRankButtons, createManagementButtons } from './button-helper';
import { buildAllOnlineEmbeds } from './online-embed-helper';
import { buildRecentAvatarsCard } from './recent-avatars-card';
import { createApexStatusEmbeds } from './apex-status-embed';

async function fetchChannel(guild: Guild, channelId: string) {
  return (await guild.channels.fetch(channelId)) as TextChannel;
}

export async function updateRoleCountMessage(guild: Guild) {
  try {
    const rolesState = await readRolesState();
    if (
      !rolesState?.channelId ||
      !rolesState.roleCountMessageId ||
      !rolesState.roleSelectionMessageId
    ) {
      return;
    }

    const channel = await fetchChannel(guild, rolesState.channelId);
    if (!channel) return;

    const stats = await getPlayerStats(guild);

    // Actualizar mensaje de selección de roles
    try {
      const roleSelectionMessage = await channel.messages.fetch(
        rolesState.roleSelectionMessageId
      );
      const updatedButtons = createRankButtons(guild.client);
      await roleSelectionMessage.edit({ components: updatedButtons });
    } catch (error: any) {
      if (error.code === 10008) {
        console.warn(
          'El mensaje de selección de roles no fue encontrado. No se pudo actualizar.'
        );
      }
    }

    // Actualizar mensaje de estadísticas
    try {
      const statsMessage = await channel.messages.fetch(
        rolesState.roleCountMessageId
      );

      const fields = [
        { name: 'En Línea', value: `🟢 - **${stats.online}**`, inline: true },
        { name: 'Registrados', value: `👥 - **${stats.total}**`, inline: true },
      ];

      const embed = new EmbedBuilder()
        .setColor('#bdc3c7')
        .setTitle('Estadísticas de Jugadores')
        .setFields(fields);

      const { embeds: onlineEmbeds, files: onlineFiles } =
        await buildAllOnlineEmbeds(guild);
      const recentCard = await buildRecentAvatarsCard(guild);

      const headerEmbed = new EmbedBuilder()
        .setColor('#ffffff')
        .setDescription(
          '🛡️ **Jugadores en línea por Rango**\n' +
            '> Puede clickear sobre los jugadores para interactuar'
        );

      const embedsToSend = [
        embed,
        ...(recentCard ? [recentCard.embed] : []),
        headerEmbed,
        ...onlineEmbeds,
      ];

      const filesToSend = [
        ...(recentCard ? recentCard.files : []),
        ...(onlineFiles ?? []),
      ].slice(0, 10);

      await statsMessage.edit({
        content: '',
        embeds: embedsToSend,
        components: [...createManagementButtons()],
        files: filesToSend,
      });
    } catch (error: any) {
      if (error.code === 10008) {
        console.warn(
          'El mensaje de estadísticas no fue encontrado. No se pudo actualizar.'
        );
      }
    }
  } catch (error) {
    console.error('Error al actualizar el mensaje de conteo de roles:', error);
  }
}

export async function updateApexInfoMessage(guild: Guild) {
  try {
    const apexStatusState = await readApexStatusState();
    if (!apexStatusState?.channelId || !apexStatusState.apexInfoMessageId) {
      return;
    }

    const channel = await fetchChannel(guild, apexStatusState.channelId);
    if (!channel) return;

    const embeds = await createApexStatusEmbeds();

    await channel.messages.edit(apexStatusState.apexInfoMessageId, { embeds });
  } catch (error: any) {
    if (error.code === 10008) {
      console.warn(
        'El mensaje de información de Apex no fue encontrado, limpiando estado.'
      );
      const currentState = await readApexStatusState();
      if (currentState) {
        await writeApexStatusState({
          ...currentState,
          apexInfoMessageId: undefined,
        });
      }
    } else {
      console.error(
        'Error al actualizar el mensaje de información de Apex:',
        error
      );
    }
  }
}
