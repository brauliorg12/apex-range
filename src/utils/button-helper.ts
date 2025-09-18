import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
} from 'discord.js';
import { APEX_LOGO_EMOJI, APEX_RANKS } from '../models/constants';
import { getRankEmoji } from './emoji-helper';

/**
 * Crea los botones de selección de rango para el panel principal.
 * Cada botón representa un rango de Apex y muestra su emoji y nombre.
 * Los botones se dividen en filas de máximo 5 por fila, como requiere Discord.
 * @param client Cliente de Discord.
 * @returns Array de ActionRowBuilder<ButtonBuilder> con los botones de rango.
 */
export function createRankButtons(
  client: Client
): ActionRowBuilder<ButtonBuilder>[] {
  // Mapea los rangos de Apex a botones con emoji y nombre
  const buttons = APEX_RANKS.map((rank) =>
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
 * Crea una fila de botones para gestión y navegación en el panel principal del bot.
 *
 * Esta función genera una fila de botones interactivos que permiten al usuario acceder a diversas funcionalidades:
 * - Ver rango Apex Global: Muestra el perfil de rango global del usuario en Apex Legends.
 * - Ver todos los jugadores: Lista todos los jugadores registrados en el servidor.
 * - Filtrar: Abre opciones para filtrar la lista de jugadores por criterios específicos.
 * - Gestionar mi Rango: Permite al usuario actualizar o gestionar su propio rango.
 * - Ayuda de Comandos: Muestra información sobre los comandos disponibles del bot.
 *
 * Los botones se organizan en una sola fila, optimizada para la interfaz de Discord.
 *
 * @returns Array con una sola ActionRowBuilder<ButtonBuilder> que contiene los botones de gestión.
 */
export function createManagementButtons(): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('show_apex_profile_modal')
      .setLabel('Ver perfil Apex Global')
      .setEmoji(APEX_LOGO_EMOJI)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_all_players_menu')
      .setLabel('Ver todos los jugadores')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_more_options')
      .setLabel('Filtrar jugadores en línea')
      .setEmoji('🔎')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('manage_rank_menu')
      .setLabel('Gestionar mi Rango')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_help_menu')
      .setLabel('Ayuda')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
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
