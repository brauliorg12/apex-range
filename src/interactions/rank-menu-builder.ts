import {
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Guild,
} from 'discord.js';
import {
  APEX_RANKS,
  APEX_PLATFORMS,
  GAME_PLATFORMS_EMOGI,
  PC_ONLY_EMOGI,
} from '../models/constants';
import { getRankEmoji } from '../utils/emoji-helper';
import { createCloseButtonRow } from '../utils/button-helper';
import { getPlayerPlatform } from '../utils/player-data-manager';
import { logApp } from '../utils/logger';

/**
 * Construye el payload (embed y botones) para el menú de gestión de rango privado de un usuario.
 * Muestra el rango actual y permite cambiarlo o eliminarlo.
 * @param guild Servidor Discord.
 * @param member Miembro de Discord.
 * @returns Objeto con embeds y componentes (botones) para mostrar al usuario.
 */
export async function buildManageRankPayload(
  guild: Guild,
  member: GuildMember
) {
  const memberRankRoles = member.roles.cache.filter((role) =>
    APEX_RANKS.some((rank) => rank.roleName === role.name)
  );
  const currentRank = APEX_RANKS.find(
    (rank) =>
      memberRankRoles.size > 0 &&
      rank.roleName === memberRankRoles.first()!.name
  );

  // Obtener plataforma actual del usuario
  const currentPlatform = await getPlayerPlatform(guild.id, member.id);
  const platformInfo = APEX_PLATFORMS.find(
    (p) => p.apiName === currentPlatform
  );

  const title = currentRank
    ? `Rango actual: ${getRankEmoji(guild.client, currentRank)} **${
        currentRank.label
      }**`
    : 'Selección de Rango';

  const description = currentRank
    ? `Puede actualizar su rango seleccionando una nueva opción.\n\n **Plataforma:** ${
        platformInfo?.id || PC_ONLY_EMOGI
      } **${platformInfo?.label || currentPlatform}**${
        currentPlatform && currentPlatform !== 'PC'
          ? ''
          : '\n\n💡 *¿Juegas en otra plataforma? Usa "' +
            GAME_PLATFORMS_EMOGI +
            ' Gestionar mi Plataforma" para actualizarla*'
      }`
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
      .setStyle(
        rank.shortId === currentRank?.shortId
          ? ButtonStyle.Success
          : ButtonStyle.Secondary
      )
  );
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(row1Buttons);

  const row2Buttons = APEX_RANKS.slice(4).map((rank) =>
    new ButtonBuilder()
      .setCustomId(rank.shortId)
      .setLabel(rank.label)
      .setEmoji(getRankEmoji(guild.client, rank))
      .setStyle(
        rank.shortId === currentRank?.shortId
          ? ButtonStyle.Success
          : ButtonStyle.Secondary
      )
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(row2Buttons);

  // Crear filas adicionales para botones de acción de manera organizada
  const components = [row1, row2];

  if (currentRank) {
    // Si tiene rango, crear fila para acciones de rango
    const rankActionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
      new ButtonBuilder()
        .setCustomId('remove_apex_rank')
        .setLabel('Eliminar Rango')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Danger),
    ]);
    components.push(rankActionRow);
  }

  await logApp(
    `[DEBUG] Componentes finales: ${components
      .map(
        (row, index) =>
          `Fila ${index + 1}: ${row.components?.length || 0} botones`
      )
      .join(', ')}`
  );

  // Agregar fila de cerrar
  components.push(createCloseButtonRow());

  return { embeds: [embed], components };
}
