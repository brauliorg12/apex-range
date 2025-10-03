import { Guild, EmbedBuilder, Message } from 'discord.js';
import {
  APEX_LOGO_EMOJI,
  SETTINGS_ALL_EMOGI,
} from '../models/constants';
import { readRolesState, writeRolesState } from './state-manager';
import { createManagementButtons } from './button-helper';
import { buildAllOnlineEmbeds } from './build-all-online-embed';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';

/**
 * Envía el panel de rangos con un header y cards con botón "Ver más".
 */
export async function sendOnlinePanel(channel: any, guild: Guild) {
  // Header embed arriba
  const headerEmbed = new EmbedBuilder()
    .setColor('#bdc3c7')
    .setDescription(
      `${APEX_LOGO_EMOJI} **Jugadores por Rango**\n` +
        '> Haz clic en los nombres para interactuar con perfiles'
    );

  const { embeds, files, componentsList } = await buildAllOnlineEmbeds(guild);

  const sentMessages = [];
  const rankCardMessageIds: { [shortId: string]: string } = {};

  // 👇 USAR ROLES MAPEADOS DEL SERVIDOR
  const ranks = getApexRanksForGuild(guild.id, guild);

  // Envía el header
  const headerMsg = (await channel.send({ embeds: [headerEmbed] })) as Message;
  sentMessages.push(headerMsg);

  // Envía los cards por rango y guarda sus IDs
  for (let i = 0; i < embeds.length; i++) {
    embeds[i].setTitle(null as any);

    const messageOptions: any = {
      embeds: [embeds[i]],
      files: files[i] ? [files[i]] : [],
      components: componentsList[i],
    };
    const msg = (await channel.send(messageOptions)) as Message;
    sentMessages.push(msg);

    // Guarda el ID del mensaje para el rango usando roles mapeados
    rankCardMessageIds[ranks[i].shortId] = msg.id;
  }

  // Envía los botones de gestión como último mensaje
  const managementRow = createManagementButtons();
  const managementEmbed = new EmbedBuilder()
    .setColor('#34495e')
    .setDescription(
      SETTINGS_ALL_EMOGI +
        ' **Panel de Gestión**\n' +
        '> *Estadísticas • Rangos • Plataformas • Búsqueda • Ayuda*'
    );

  const managementMsg = (await channel.send({
    embeds: [managementEmbed],
    components: managementRow,
  })) as Message;
  sentMessages.push(managementMsg);

  // Actualiza el estado con los IDs de los cards por rango
  let rolesState = await readRolesState(guild.id);

  if (!rolesState) {
    rolesState = {
      guildId: guild.id,
      channelId: channel.id,
      roleCountMessageId: undefined,
      roleSelectionMessageId: undefined,
      rankCardMessageIds: {},
    };
  }

  await writeRolesState({
    ...rolesState,
    guildId: guild.id,
    rankCardMessageIds,
  });
}
