import {
  Guild,
  TextChannel,
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { readState } from './state-manager';
import { APEX_RANKS } from '../constants';
import { getTotalUniquePlayers, getOnlinePlayersCount } from './player-stats';

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
      .setDescription(
        `**📊 Jugadores Registrados:** **${totalPlayers}**\n**🟢 Jugadores en Línea:** **${onlinePlayers}**`
      )
      .setTimestamp();

    const components: ActionRowBuilder<ButtonBuilder>[] = [];
    const showOnlineButton = new ButtonBuilder()
      .setCustomId('show_online_players_menu')
      .setLabel('Ver jugadores en línea')
      .setStyle(ButtonStyle.Primary);
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      showOnlineButton
    );
    components.push(actionRow);

    await message.edit({ content: '', embeds: [embed], components }).catch(console.error);
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

      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        APEX_RANKS.slice(0, 4).map((rank) => {
          const role = guild.roles.cache.find((r) => r.name === rank.roleName);
          const memberCount = role ? role.members.size : 0;
          return new ButtonBuilder()
            .setCustomId(rank.id)
            .setLabel(`${rank.icon} ${rank.label} (${memberCount})`)
            .setStyle(ButtonStyle.Secondary);
        })
      );
      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        APEX_RANKS.slice(4).map((rank) => {
          const role = guild.roles.cache.find((r) => r.name === rank.roleName);
          const memberCount = role ? role.members.size : 0;
          return new ButtonBuilder()
            .setCustomId(rank.id)
            .setLabel(`${rank.icon} ${rank.label} (${memberCount})`)
            .setStyle(ButtonStyle.Secondary);
        })
      );

      const removeRankButton = new ButtonBuilder()
        .setCustomId('remove_apex_rank')
        .setLabel('X')
        .setStyle(ButtonStyle.Danger);

      row2.addComponents(removeRankButton);

      await roleSelectionMessage.edit({
        embeds: roleSelectionMessage.embeds, // Preserve existing embeds
        components: [row1, row2],
      });
    } catch (error) {
      console.error(
        'No se pudo encontrar o actualizar el panel de selección de roles. Quizás fue borrado.'
      );
    }
  }
}
