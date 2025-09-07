import {
  ButtonInteraction,
  GuildMember,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { createCloseButtonRow } from '../utils/button-helper';
import { removePlayerRankDate } from '../utils/player-data-manager';
import { removeCommonApexRoleIfNoRank } from '../utils/role-helper';
import { readRolesState } from '../utils/state-manager';
import { updateRankCardMessage } from '../embeds/update-rank-card-message';

/**
 * Elimina todos los roles de rango de Apex del usuario.
 * Actualiza la base de datos, elimina el rol común si corresponde y actualiza los paneles principales.
 * Muestra mensajes de advertencia, éxito o error según el resultado.
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function handleRemoveRank(interaction: ButtonInteraction) {
  const { member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  console.log(
    `[Interacción] ${interaction.user.tag} está intentando eliminar su rango.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    const allRankRoleNames = APEX_RANKS.map((r) => r.roleName);
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

    await member.roles.remove(rolesToRemove);
    await removeCommonApexRoleIfNoRank(member);

    // Eliminar la fecha de asignación
    await removePlayerRankDate(guild.id, member.id);

    console.log(
      `[Interacción] Roles de rango eliminados para ${interaction.user.tag}.`
    );

    const successEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('🗑️ Rango Eliminado')
      .setDescription('Se han quitado tus roles de rango de Apex.');
    await interaction.editReply({
      embeds: [successEmbed],
      components: [createCloseButtonRow()],
    });

    if (guild) {
      await updateRoleCountMessage(guild);

      // Actualiza los cards del panel principal
      const rolesState = await readRolesState(guild.id);
      if (rolesState && rolesState.channelId) {
        const channel = guild.channels.cache.get(
          rolesState.channelId
        ) as TextChannel;

        for (const rank of APEX_RANKS) {
          const msgId = rolesState.rankCardMessageIds?.[rank.shortId];
          if (msgId) {
            await updateRankCardMessage(guild, channel, rank.shortId, msgId);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al quitar el rol:', error);
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
