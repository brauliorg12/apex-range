import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { APEX_LOGO_EMOJI, HELP_EMOGI } from '../models/constants';

/**
 * Construye los botones del panel de estado de Apex.
 * Se usa tanto al crear el panel con `/apex-status` como al recrearlo
 * automaticamente si el mensaje fue eliminado.
 *
 * @returns Una fila de componentes lista para enviar o editar en Discord.
 */
export function createApexStatusComponents() {
  const apexProfileButton = new ButtonBuilder()
    .setCustomId('show_apex_profile_modal')
    .setLabel('Ver perfil Apex Global')
    .setEmoji(APEX_LOGO_EMOJI)
    .setStyle(ButtonStyle.Secondary);

  const moreInfoButton = new ButtonBuilder()
    .setCustomId('server_status_info')
    .setLabel('Ayuda')
    .setEmoji(HELP_EMOGI)
    .setStyle(ButtonStyle.Secondary);

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      apexProfileButton,
      moreInfoButton
    ),
  ];
}
