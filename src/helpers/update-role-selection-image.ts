import { EmbedBuilder, TextChannel, Client } from 'discord.js';
import { logApp } from '../utils/logger';
import { resolveInitImage } from '../configs/images';
import { SELECT_EMOGI } from '../models/constants';

// Evita reenviar el mismo adjunto en cada actualización periódica.
const lastImageFingerprint = new Map<string, string>();

// Constante para el texto del embed de selección de rango (centralizada para evitar duplicación)
export const ROLE_SELECTION_EMBED_TEXT = [
  'Haz click en el botón correspondiente a tu rango actual de Apex Legends.',
  '',
  '🔹 **¡Es obligatorio seleccionar tu rango para aparecer en los listados y paneles!**',
  '',
  '⬇️ _Selecciona tu rango abajo:_',
].join('\n');

/**
 * Función principal para actualizar la imagen del embed de selección de rango en caliente.
 * Lee el estado guardado, obtiene el mensaje y lo edita con la nueva imagen del JSON.
 * @param guildId ID del servidor para leer el estado.
 * @param client Instancia del cliente de Discord para acceder a guilds y mensajes.
 */
export async function updateInitRoleSelectionImage(
  guildId: string,
  client: Client
) {
  try {
    const { readRolesState } = await import('../utils/state-manager');
    const rolesState = await readRolesState(guildId);
    if (
      !rolesState ||
      !rolesState.roleSelectionMessageId ||
      !rolesState.channelId
    ) {
      logApp(`No hay estado guardado para guild ${guildId}`);
      return;
    }

    const initImage = resolveInitImage();
    if (initImage.warning) {
      logApp(initImage.warning);
    }

    const fingerprint = initImage.fingerprint ?? '';
    if (lastImageFingerprint.get(guildId) === fingerprint) {
      return;
    }

    const guild = await client.guilds.fetch(guildId);
    const channel = (await guild.channels.fetch(
      rolesState.channelId
    )) as TextChannel;
    const message = await channel.messages.fetch(
      rolesState.roleSelectionMessageId
    );

    // Crear el embed actualizado con la imagen configurada y el texto centralizado
    const updatedEmbed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle(SELECT_EMOGI + ' SELECCIONA TU RANGO DE APEX LEGENDS')
      .setDescription(ROLE_SELECTION_EMBED_TEXT);

    if (initImage.imageUrl) {
      updatedEmbed.setImage(initImage.imageUrl);
    }

    await message.edit({
      embeds: [updatedEmbed],
      components: message.components, // Mantener los botones existentes
      files: initImage.file ? [initImage.file] : [],
    });

    lastImageFingerprint.set(guildId, fingerprint);

    logApp(
      `Imagen del embed de selección de rango actualizada para guild ${guildId}`
    );
  } catch (error) {
    logApp(
      `Error actualizando imagen del embed para guild ${guildId}: ${error}`
    );
  }
}
