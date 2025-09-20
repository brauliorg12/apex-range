import { ButtonInteraction, GuildMember, EmbedBuilder } from 'discord.js';
import {
  APEX_RANKS,
  APEX_PLATFORMS,
  PC_ONLY_EMOGI,
} from '../models/constants';
import { getRankEmoji } from '../utils/emoji-helper';
import { createCloseButtonRow } from '../utils/button-helper';
import {
  updatePlayerRankDate,
  getPlayerPlatform,
} from '../utils/player-data-manager';
import { logApp } from '../utils/logger';
import { ensureCommonApexRole } from '../utils/role-helper';
import { handleManagePlatform } from './rank-management';
import { debounceUpdateRoleCountMessage } from '../helpers/debounce-update-role-count';

/**
 * Maneja la asignación de rango cuando un usuario hace clic en un botón de rango.
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function handleRoleAssignment(interaction: ButtonInteraction) {
  const { customId, member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const selectedRank = APEX_RANKS.find((rank) => rank.shortId === customId);
  if (!selectedRank) return;

  await logApp(
    `[Interacción] ${interaction.user.tag} seleccionó rango '${selectedRank.label}'.`
  );

  try {
    // Verificar si el usuario ya tiene plataforma
    const currentPlatform = await getPlayerPlatform(guild.id, member.id);

    if (!currentPlatform) {
      // Si no tiene plataforma configurada, mostrar menú de gestionar plataforma
      await handleManagePlatform(interaction);
      return;
    }

    // Si ya tiene plataforma, proceder con la asignación normal
    await interaction.deferReply({ ephemeral: true });
    await assignRankAndPlatform(interaction, selectedRank, currentPlatform);
  } catch (error) {
    console.error('Error al asignar rango:', error);

    let errorDescription =
      'Hubo un error al actualizar tu rango. Inténtalo de nuevo.';
    if ((error as any)?.code === 50013) {
      errorDescription =
        'El bot no tiene permisos para gestionar roles. Asegúrate de que tenga el permiso "Gestionar roles" y que su rol esté por encima de los roles de Apex.';
    } else if ((error as Error)?.message?.includes('hierarchy')) {
      errorDescription =
        'El bot no puede asignar este rol porque su rol en el servidor está por debajo. Contacta a un administrador para ajustar la jerarquía de roles.';
    } else if ((error as Error)?.message?.includes('ManageRoles')) {
      errorDescription =
        'El bot no tiene el permiso "Gestionar roles". Contacta a un administrador del servidor.';
    }

    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription(errorDescription);

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}

/**
 * Función auxiliar para asignar rango y plataforma
 * @param interaction Interacción
 * @param selectedRank Rango seleccionado
 * @param platform Plataforma del usuario
 */
async function assignRankAndPlatform(
  interaction: ButtonInteraction,
  selectedRank: (typeof APEX_RANKS)[0],
  platform: string
) {
  const { member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const botMember = guild.members.me;
  if (!botMember) {
    throw new Error('Bot not in guild');
  }

  // Verificar permisos del bot
  if (!botMember.permissions.has('ManageRoles')) {
    throw new Error('Bot missing ManageRoles permission');
  }

  // Remover rangos anteriores
  const rankRolesToRemove = member.roles.cache.filter((role) =>
    APEX_RANKS.some(
      (rank) =>
        rank.roleName === role.name && rank.shortId !== selectedRank.shortId
    )
  );

  if (rankRolesToRemove.size > 0) {
    await member.roles.remove(rankRolesToRemove);
  }

  // Asignar nuevo rango
  const rankRole = guild.roles.cache.find(
    (role) => role.name === selectedRank.roleName
  );
  if (rankRole) {
    if (botMember.roles.highest.position <= rankRole.position) {
      throw new Error('Bot role hierarchy too low for rank role');
    }
    await member.roles.add(rankRole);
  }

  // Asignar rol de plataforma si existe
  const platformInfo = APEX_PLATFORMS.find((p) => p.apiName === platform);
  if (platformInfo) {
    const platformRole = guild.roles.cache.find(
      (role) => role.name === platformInfo.roleName
    );
    if (platformRole && !member.roles.cache.has(platformRole.id)) {
      if (botMember.roles.highest.position <= platformRole.position) {
        throw new Error('Bot role hierarchy too low for platform role');
      }
      // Remover otros roles de plataforma
      const otherPlatformRoles = APEX_PLATFORMS.filter(
        (p) => p.apiName !== platform
      ).map((p) => p.roleName);

      const rolesToRemove = member.roles.cache.filter((role) =>
        otherPlatformRoles.includes(role.name)
      );

      if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove);
      }

      await member.roles.add(platformRole);
    }
  }

  // Asegurar que tenga el rol común de Apex
  await ensureCommonApexRole(member);

  // Actualizar base de datos
  await updatePlayerRankDate(
    guild.id,
    member.id,
    selectedRank.shortId,
    platform
  );

  const successEmbed = new EmbedBuilder()
    .setColor(parseInt(selectedRank.color.replace('#', ''), 16))
    .setTitle('✅ Rango Actualizado')
    .setDescription(
      `${getRankEmoji(guild.client, selectedRank)} **${selectedRank.label}**\n${
        platformInfo?.id || PC_ONLY_EMOGI
      } **${
        platformInfo?.label || platform
      }**\n\nTu rango y plataforma han sido actualizados correctamente.`
    );

  await interaction.editReply({
    embeds: [successEmbed],
    components: [createCloseButtonRow()],
  });

  // Actualizar mensajes de estado en background con debounce
  debounceUpdateRoleCountMessage(guild);
}
