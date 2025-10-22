import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Guild,
} from 'discord.js';
import {
  ALL_PLAYERS_EMOGI,
  APEX_LOGO_EMOJI,
  FILTER_LIST_EMOGI,
  GAME_PLATFORMS_EMOGI,
  HELP_EMOGI,
  LOGO_APP_EMOGI,
  SEARCH_EMOGI,
} from '../models/constants';
import { getRankEmoji } from './emoji-helper';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';

/**
 * Crea los botones de selección de rango para el panel principal.
 * Cada botón representa un rango de Apex y muestra su emoji y nombre.
 * Los botones se dividen en filas de máximo 5 por fila, como requiere Discord.
 * IMPORTANTE: Usa los roles mapeados del servidor para soportar roles personalizados.
 * @param client Cliente de Discord.
 * @param guild Guild donde se mostrarán los botones.
 * @returns Array de ActionRowBuilder<ButtonBuilder> con los botones de rango.
 */
export function createRankButtons(
  client: Client,
  guild: Guild
): ActionRowBuilder<ButtonBuilder>[] {
  // Obtener los rangos mapeados del servidor (soporta roles personalizados)
  const ranks = getApexRanksForGuild(guild.id, guild);

  // Mapea los rangos de Apex a botones con emoji y nombre
  const buttons = ranks.map((rank) =>
    new ButtonBuilder()
      .setCustomId(rank.shortId)
      .setLabel(rank.label)
      .setEmoji(getRankEmoji(client, rank))
      .setStyle(ButtonStyle.Secondary)
  );

  // Divide los botones en filas de máximo 5 componentes
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttons.slice(i, i + 5)
      )
    );
  }
  return rows;
}

/**
 * Crea filas de botones para gestión y navegación en el panel principal del bot.
 *
 * Esta función genera dos filas de botones interactivos que permiten al usuario acceder a diversas funcionalidades:
 *
 * Primera fila:
 * - Ver rango Apex Global: Muestra el perfil de rango global del usuario en Apex Legends.
 * - Ver todos los jugadores: Lista todos los jugadores registrados en el servidor.
 * - Filtrar: Abre opciones para filtrar la lista de jugadores por criterios específicos.
 * - Gestionar mi Rango: Permite al usuario actualizar o gestionar su propio rango.
 *
 * Segunda fila:
 * - Gestionar Plataforma (Acceso Rápido): Permite al usuario cambiar su plataforma de juego directamente desde el panel principal.
 * - Ayuda de Comandos: Muestra información sobre los comandos disponibles del bot.
 *
 * Los botones se organizan en dos filas, optimizada para la interfaz de Discord.
 * NOTA: También existe un botón "Gestionar Plataforma" en el menú de gestión de rango con funcionalidad similar.
 *
 * @returns Array con dos ActionRowBuilder<ButtonBuilder> que contienen los botones de gestión.
 */
export function createManagementButtons(): ActionRowBuilder<ButtonBuilder>[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('show_apex_profile_modal')
      .setLabel('Ver perfil Apex Global')
      .setEmoji(APEX_LOGO_EMOJI)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('open_player_search')
      .setLabel('Buscar Jugador')
      .setEmoji(SEARCH_EMOGI)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('manage_rank_menu')
      .setLabel('Gestionar mi Rango')
      .setEmoji(LOGO_APP_EMOGI)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('manage_platform')
      .setLabel('Gestionar mi Plataforma')
      .setEmoji(GAME_PLATFORMS_EMOGI)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_all_players_menu')
      .setLabel('Ver todos los jugadores')
      .setEmoji(ALL_PLAYERS_EMOGI)
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('show_more_options')
      .setLabel('Filtrar jugadores en línea')
      .setEmoji(FILTER_LIST_EMOGI)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_help_menu')
      .setLabel('Ayuda')
      .setEmoji(HELP_EMOGI)
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

/**
 * Crea una fila con un solo botón para cerrar el menú de ayuda.
 * @returns ActionRowBuilder<ButtonBuilder> con el botón de cerrar.
 */
export function createCloseButtonRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('close_help_menu')
      .setLabel('Cerrar')
      .setStyle(ButtonStyle.Secondary)
  );
}
