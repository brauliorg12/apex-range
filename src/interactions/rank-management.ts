import {
  ButtonInteraction,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Guild,
  TextChannel,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { getRankEmoji } from '../utils/emoji-helper';
import { createCloseButtonRow } from '../utils/button-helper';
import { updatePlayerRankDate } from '../utils/player-data-manager';
import { ensureCommonApexRole } from '../utils/role-helper';
import { readRolesState } from '../utils/state-manager';
import { updateRankCardMessage } from '../helpers/update-rank-card-message';

/**
 * Construye el payload (embed y botones) para el menú de gestión de rango privado de un usuario.
 * Muestra el rango actual y permite cambiarlo o eliminarlo.
 * @param guild Servidor Discord.
 * @param member Miembro de Discord.
 * @returns Objeto con embeds y componentes (botones) para mostrar al usuario.
 */
async function buildManageRankPayload(guild: Guild, member: GuildMember) {
  const memberRankRoles = member.roles.cache.filter((role) =>
    APEX_RANKS.some((rank) => rank.roleName === role.name)
  );
  const currentRank = APEX_RANKS.find(
    (rank) =>
      memberRankRoles.size > 0 &&
      rank.roleName === memberRankRoles.first()!.name
  );

  const title = currentRank
    ? `Rango actual: ${getRankEmoji(guild.client, currentRank)} **${
        currentRank.label
      }**`
    : 'Selección de Rango';
  const description = currentRank
    ? 'Puede actualizar su rango seleccionando una nueva opción.'
    : 'Selecciona tu rango actual en Apex Legends para que otros jugadores puedan encontrarte.';

  const embed = new EmbedBuilder()
    .setColor('#95a5a6')
    .setTitle(title)
    .setDescription(description);

  const row1Buttons = APEX_RANKS.slice(0, 4).map((rank) =>
    new ButtonBuilder()
      .setCustomId(rank.shortId)
      .setLabel(rank.label)
      .setEmoji(getRankEmoji(guild.client, rank))
      .setStyle(ButtonStyle.Secondary)
  );
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(row1Buttons);

  const row2Buttons = APEX_RANKS.slice(4).map((rank) =>
    new ButtonBuilder()
      .setCustomId(rank.shortId)
      .setLabel(rank.label)
      .setEmoji(getRankEmoji(guild.client, rank))
      .setStyle(ButtonStyle.Secondary)
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(row2Buttons);

  if (currentRank) {
    row2.addComponents(
      new ButtonBuilder()
        .setCustomId('remove_apex_rank')
        .setLabel('Eliminar Rango')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger)
    );
  }

  // Agrega el botón de cerrar como última fila
  return { embeds: [embed], components: [row1, row2, createCloseButtonRow()] };
}

/**
 * Construye los componentes principales del menú de interacción.
 *
 * - Incluye botones para gestionar el rango del usuario, ver todos los jugadores y acceder a la ayuda de comandos.
 * - Devuelve una fila de botones para mostrar en los paneles principales del bot.
 *
 * @returns Array de ActionRowBuilder con los botones principales.
 */
export function buildMainMenuComponents() {
  const allPlayersButton = new ButtonBuilder()
    .setCustomId('show_all_players_menu')
    .setLabel('Ver todos los jugadores')
    .setStyle(ButtonStyle.Secondary);

  const manageRankButton = new ButtonBuilder()
    .setCustomId('manage_rank_menu')
    .setLabel('Gestionar mi rango')
    .setStyle(ButtonStyle.Primary);

  const helpButton = new ButtonBuilder()
    .setCustomId('show_help_menu')
    .setLabel('Ayuda de Comandos')
    .setEmoji('❓')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    manageRankButton,
    allPlayersButton,
    helpButton
  );

  return [row];
}

/**
 * Muestra al usuario el menú privado de gestión de rango.
 * Permite visualizar el rango actual, cambiarlo o eliminarlo, y presenta los botones de selección y cierre.
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function handleManageRankMenu(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.member) return;
  const member = interaction.member as GuildMember;

  console.log(
    `[Interacción] Abriendo menú 'Gestionar mi rango' para ${interaction.user.tag}.`
  );

  await interaction.deferReply({ ephemeral: true });
  const payload = await buildManageRankPayload(interaction.guild, member);
  await interaction.editReply(payload);
}

/**
 * Asigna el rango de Apex seleccionado al usuario.
 * Elimina cualquier rango anterior, agrega el nuevo, actualiza la fecha de asignación y actualiza los paneles principales.
 * Muestra mensajes de éxito o error según el resultado.
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function handleRoleAssignment(interaction: ButtonInteraction) {
  const { customId, member, guild } = interaction;
  if (!(member instanceof GuildMember) || !guild) return;

  const selectedRank = APEX_RANKS.find((rank) => rank.shortId === customId);
  if (!selectedRank) return;

  console.log(
    `[Interacción] ${interaction.user.tag} está intentando asignarse el rango '${selectedRank.label}'.`
  );

  await interaction.deferReply({ ephemeral: true });

  try {
    const roleToAssign = guild.roles.cache.find(
      (role) => role.name === selectedRank.roleName
    );
    if (!roleToAssign) {
      const errorEmbed = new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle('❌ Error de Configuración')
        .setDescription(
          `El rol "${selectedRank.roleName}" no existe. Por favor, avisa a un administrador.`
        );
      await interaction.editReply({
        embeds: [errorEmbed],
        components: [createCloseButtonRow()],
      });
      return;
    }

    const allRankRoleNames = APEX_RANKS.map((r) => r.roleName);
    const rolesToRemove = member.roles.cache.filter((role) =>
      allRankRoleNames.includes(role.name)
    );

    await member.roles.remove(rolesToRemove);
    await member.roles.add(roleToAssign);
    await ensureCommonApexRole(member);

    // Guardar la fecha de asignación
    await updatePlayerRankDate(guild.id, member.id);

    console.log(
      `[Interacción] Rango '${selectedRank.label}' asignado a ${interaction.user.tag}.`
    );

    const successEmbed = new EmbedBuilder()
      .setColor('#2ecc71')
      .setTitle('✅ Rango Asignado')
      .setDescription(
        `${getRankEmoji(guild.client, selectedRank)} **${
          roleToAssign.name
        }**\n\n` +
          '_¡Excelente! Ahora puedes ver tu rango actual y los demás jugadores encontrarte._'
      );
    await interaction.editReply({
      embeds: [successEmbed],
      components: [createCloseButtonRow()],
    });

    if (guild) {
      await updateRoleCountMessage(guild);

      // Actualiza solo los cards afectados
      const rolesState = await readRolesState(guild.id);
      if (rolesState && rolesState.channelId) {
        const channel = guild.channels.cache.get(
          rolesState.channelId
        ) as TextChannel;

        // Actualiza todos los cards de rangos para máxima consistencia
        for (const rank of APEX_RANKS) {
          const msgId = rolesState.rankCardMessageIds?.[rank.shortId];
          if (msgId) {
            await updateRankCardMessage(guild, channel, rank.shortId, msgId);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al asignar el rol:', error);

    // Determinar el tipo de error específico
    let errorMessage =
      'Hubo un error al intentar asignar tu rol. Asegúrate de que tengo los permisos necesarios.';
    let errorTitle = '❌ Error';

    if (error instanceof Error) {
      if (
        error.message.includes('Missing Permissions') ||
        error.message.includes('50013')
      ) {
        errorMessage =
          '❌ **Permiso faltante:** No tengo permisos para gestionar roles en este servidor.\n\n**Solución:** Un administrador debe activar "Gestionar Roles" para el rol del bot.';
        errorTitle = '❌ Permiso Insuficiente';
      } else if (
        error.message.includes('Missing Access') ||
        error.message.includes('50001')
      ) {
        errorMessage =
          '❌ **Acceso denegado:** No puedo acceder a los roles en este servidor.\n\n**Solución:** Verifica que el rol del bot esté por encima de los roles de Apex en la jerarquía.';
        errorTitle = '❌ Acceso Denegado';
      }
    }

    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle(errorTitle)
      .setDescription(errorMessage);
    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
