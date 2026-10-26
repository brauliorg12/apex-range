import {
  MessageFlags,
  ButtonInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { createCloseButtonRow } from '../utils/button-helper';
import { logApp } from '../utils/logger';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from '../helpers/get-apex-platforms-for-guild';
import {
  buildPublicHelpEmbeds,
  buildStaffHelpEmbed,
} from '../content/user-guide';

/**
 * Indica si el miembro puede ver la guía de staff.
 *
 * Usa los permisos que ya vienen en la interacción: no hace fetch de miembros,
 * no consulta la API de Discord y no agrega trabajo al scheduler.
 *
 * @param interaction - Interacción del botón de ayuda.
 * @returns `true` si el miembro tiene algún permiso de gestión.
 */
function canSeeStaffHelp(interaction: ButtonInteraction): boolean {
  const permissions = interaction.memberPermissions;
  if (!permissions) return false;

  return (
    permissions.has(PermissionFlagsBits.ManageGuild) ||
    permissions.has(PermissionFlagsBits.ManageChannels) ||
    permissions.has(PermissionFlagsBits.ManageRoles)
  );
}

/**
 * Maneja la interacción del botón "Ayuda" del panel.
 *
 * - Muestra una guía pública generada con los rangos y plataformas del guild.
 * - Agrega la guía de staff solo si el miembro tiene permisos de gestión.
 * - El mensaje es efímero y solo visible para el usuario que lo solicitó.
 *
 * @param interaction - Interacción del botón recibida desde Discord.
 */
export async function handleHelpMenu(interaction: ButtonInteraction) {
  await logApp(
    `[Interacción] ${interaction.user.tag} ha solicitado el menú de ayuda.`
  );

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!interaction.guild) return;

  const context = {
    ranks: getApexRanksForGuild(interaction.guild.id, interaction.guild),
    platforms: getApexPlatformsForGuild(
      interaction.guild.id,
      interaction.guild
    ),
  };

  const embeds = buildPublicHelpEmbeds(context);
  if (canSeeStaffHelp(interaction)) {
    embeds.push(buildStaffHelpEmbed());
  }

  await interaction.editReply({
    embeds,
    components: [createCloseButtonRow()],
  });
}

/**
 * Maneja la interacción del botón "Cerrar" en el menú de ayuda.
 *
 * - Confirma la interacción con deferUpdate para evitar timeouts.
 * - Elimina el mensaje efímero del menú de ayuda.
 * - Registra en consola quién cerró el menú para seguimiento.
 *
 * @param interaction - Interacción del botón "Cerrar" recibida desde Discord.
 */
export async function handleCloseHelpMenu(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  await interaction.deleteReply();

  await logApp(
    `[Interacción] ${interaction.user.tag} ha cerrado el menú de ayuda.`
  );
}
