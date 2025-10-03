import {
  ButtonInteraction,
  GuildMember,
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { createCloseButtonRow } from '../utils/button-helper';
import {
  removePlayerRankDate,
  removePlayerPlatform,
} from '../utils/player-data-manager';
import { removeCommonApexRoleIfNoRank } from '../utils/role-helper';
import { readRolesState } from '../utils/state-manager';
import { updateRankCardMessage } from './update-rank-card-message';
import { logApp } from '../utils/logger';
import { getApexRanksForGuild } from './get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from './get-apex-platforms-for-guild';

/**
 * Maneja la confirmación y eliminación completa de roles de rango y plataforma de Apex Legends.
 *
 * Proceso:
 * 1. Verifica si el usuario tiene roles de rango asignados (usa roles mapeados del servidor)
 * 2. Muestra mensaje de confirmación con botones de aceptar/cancelar
 * 3. Espera respuesta del usuario (30 segundos timeout)
 * 4. Si confirma: elimina roles de Discord, limpia base de datos, actualiza mensajes de estado
 * 5. Si cancela o timeout: muestra mensaje correspondiente
 *
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function confirmRemoveRank(interaction: ButtonInteraction) {
  const { member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  await logApp(
    `[Interacción] ${interaction.user.tag} está intentando eliminar su rango.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    // Usar roles mapeados del servidor (soporta roles personalizados)
    const ranks = getApexRanksForGuild(guild.id, guild);
    const allRankRoleNames = ranks.map((r) => r.roleName);
    const rolesToRemove = member.roles.cache.filter((role) =>
      allRankRoleNames.includes(role.name)
    );

    if (rolesToRemove.size === 0) {
      const warningEmbed = new EmbedBuilder()
        .setColor('#f1c40f')
        .setTitle('⚠️ Sin Rango')
        .setDescription('No tienes ningún rol de rango de Apex para quitar.');
      await interaction.editReply({
        embeds: [warningEmbed],
        components: [createCloseButtonRow()],
      });
      return;
    }

    // Mensaje de confirmación
    const confirmEmbed = new EmbedBuilder()
      .setColor('#ffa500')
      .setTitle('⚠️ Confirmar Eliminación')
      .setDescription(
        '¿Estás seguro de que quieres eliminar tus roles de rango y plataforma de Apex? Esta acción no se puede deshacer.'
      );

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_remove')
        .setLabel('Sí, eliminar')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_remove')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
      embeds: [confirmEmbed],
      components: [confirmRow],
    });

    // Esperar la respuesta del usuario
    if (!interaction.channel) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('❌ Error')
            .setDescription(
              'No se puede procesar la confirmación en este contexto.'
            ),
        ],
        components: [createCloseButtonRow()],
      });
      return;
    }

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 30000, // 30 segundos
    });

    collector?.on('collect', async (i: ButtonInteraction) => {
      try {
        if (i.customId === 'confirm_remove') {
          await i.deferUpdate();

          // Proceder con la eliminación
          await member.roles.remove(rolesToRemove);
          await removeCommonApexRoleIfNoRank(member);

          // Eliminar roles de plataforma (usar roles mapeados)
          const platforms = getApexPlatformsForGuild(guild.id, guild);
          const allPlatformRoleNames = platforms.map((p) => p.roleName);
          const platformRolesToRemove = member.roles.cache.filter((role) =>
            allPlatformRoleNames.includes(role.name)
          );
          if (platformRolesToRemove.size > 0) {
            await member.roles.remove(platformRolesToRemove);
          }

          // Eliminar la plataforma de la DB siempre
          await removePlayerPlatform(guild.id, member.id);

          // Eliminar el registro completo
          await removePlayerRankDate(guild.id, member.id);
          await logApp(
            `[Interacción] Roles de rango y plataforma eliminados para ${interaction.user.tag}.`
          );

          const successEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('🗑️ Rango Eliminado')
            .setDescription(
              'Se han quitado tus roles de rango y plataforma de Apex.'
            );

          await i.editReply({
            embeds: [successEmbed],
            components: [createCloseButtonRow()],
          });

          // Actualizaciones
          if (guild) {
            await updateRoleCountMessage(guild);
            const rolesState = await readRolesState(guild.id);
            if (rolesState && rolesState.channelId) {
              const channel = guild.channels.cache.get(
                rolesState.channelId
              ) as TextChannel;
              // Usar roles mapeados del servidor
              const ranksForUpdate = getApexRanksForGuild(guild.id, guild);
              for (const rank of ranksForUpdate) {
                const msgId = rolesState.rankCardMessageIds?.[rank.shortId];
                if (msgId) {
                  await updateRankCardMessage(
                    guild,
                    channel,
                    rank.shortId,
                    msgId
                  );
                }
              }
            }
          }

          collector.stop();
        } else if (i.customId === 'cancel_remove') {
          const cancelEmbed = new EmbedBuilder()
            .setColor('#95a5a6')
            .setTitle('❌ Cancelado')
            .setDescription('La eliminación de rangos ha sido cancelada.');

          await i.update({
            embeds: [cancelEmbed],
            components: [createCloseButtonRow()],
          });
          collector.stop();
        }
      } catch (error) {
        await logApp(`Error en collector collect: ${error}`);
        try {
          await i.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor('#e74c3c')
                .setTitle('❌ Error')
                .setDescription('Hubo un error procesando tu respuesta.'),
            ],
            components: [createCloseButtonRow()],
          });
        } catch (editError) {
          await logApp(`Error editando respuesta en collect: ${editError}`);
        }
        collector.stop();
      }
    });

    collector?.on('end', async (collected, reason) => {
      if (reason === 'time') {
        try {
          const timeoutEmbed = new EmbedBuilder()
            .setColor('#e74c3c')
            .setTitle('⏰ Tiempo Agotado')
            .setDescription(
              'No confirmaste a tiempo. La eliminación ha sido cancelada.'
            );

          await interaction.editReply({
            embeds: [timeoutEmbed],
            components: [createCloseButtonRow()],
          });
        } catch (error) {
          await logApp(`Error en collector end: ${error}`);
        }
      }
    });
  } catch (error) {
    await logApp(`Error al quitar el rol: ${error}`);
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar quitar tu rol. Asegúrate de que tengo los permisos necesarios.'
      );
    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
