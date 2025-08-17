import {
  Guild,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { readState } from './state-manager';
import { getTotalUniquePlayers, getOnlinePlayersCount } from './player-stats';
import { APEX_RANKS } from '../constants';
import { getRankEmoji } from './emoji-helper';

export async function updateRoleCountMessage(guild: Guild) {
  const state = await readState();
  if (
    !state.channelId ||
    !state.roleCountMessageId ||
    state.guildId !== guild.id
  ) {
    return;
  }

  const channel = (await guild.channels
    .fetch(state.channelId)
    .catch(() => null)) as TextChannel | null;
  if (!channel) return;

  // Update role count message
  try {
    const message = await channel.messages.fetch(state.roleCountMessageId);

    const totalPlayers = await getTotalUniquePlayers(guild);
    const onlinePlayers = await getOnlinePlayersCount(guild);

    const embed = new EmbedBuilder()
      .setColor('#0099ff') // Color azul
      .setTitle('Estadísticas del Servidor')
      .setDescription(null) // Limpiamos la descripción principal
      .setFields(
        {
          name: '📊 Jugadores Registrados',
          value: `**${totalPlayers}**`,
          inline: true,
        },
        {
          name: '🟢 Jugadores en Línea',
          value: `**${onlinePlayers}**`,
          inline: true,
        }
      )
      .setTimestamp();

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('show_online_players_menu')
        .setLabel('Ver jugadores en línea')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('manage_rank_menu')
        .setLabel('Gestionar mi Rango')
        .setStyle(ButtonStyle.Primary)
    );

    await message
      .edit({ content: '', embeds: [embed], components: [actionRow] })
      .catch(console.error);
  } catch (error) {
    console.error(
      'No se pudo encontrar o actualizar el mensaje de conteo. Quizás fue borrado.'
    );
  }

  // Update role selection panel
  if (state.roleSelectionMessageId) {
    try {
      const roleSelectionMessage = await channel.messages.fetch(
        state.roleSelectionMessageId
      );

      const roleSelectionEmbed = new EmbedBuilder()
        .setColor('#95a5a6')
        .setTitle('Selección de Rango')
        .setDescription(
          'Selecciona tu rango principal en Apex Legends para que otros jugadores puedan encontrarte.'
        );

      const row1Buttons = APEX_RANKS.slice(0, 4).map((rank) => {
        const role = guild.roles.cache.find((r) => r.name === rank.roleName);
        const memberCount = role ? role.members.size : 0;
        return new ButtonBuilder()
          .setCustomId(rank.shortId)
          .setLabel(`${rank.label} - ${memberCount}`)
          .setEmoji(getRankEmoji(guild.client, rank))
          .setStyle(ButtonStyle.Secondary);
      });
      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        row1Buttons
      );

      const row2Buttons = APEX_RANKS.slice(4).map((rank) => {
        const role = guild.roles.cache.find((r) => r.name === rank.roleName);
        const memberCount = role ? role.members.size : 0;
        return new ButtonBuilder()
          .setCustomId(rank.shortId)
          .setLabel(`${rank.label} - ${memberCount}`)
          .setEmoji(getRankEmoji(guild.client, rank))
          .setStyle(ButtonStyle.Secondary);
      });
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        row2Buttons
      );

      await roleSelectionMessage.edit({
        embeds: [roleSelectionEmbed],
        components: [row1, row2],
      });
    } catch (error) {
      console.error(
        'No se pudo encontrar o actualizar el mensaje de selección de roles. Quizás fue borrado.'
      );
    }
  }
}
