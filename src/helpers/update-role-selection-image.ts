import { EmbedBuilder, TextChannel, Client } from 'discord.js';
import { logApp } from '../utils/logger';
import { imagesConfig } from '../configs/images';

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
      console.log(`No hay estado guardado para guild ${guildId}`);
      return;
    }

    // Leer la imagen directamente de la configuración
    let currentImage = '';
    try {
      currentImage = imagesConfig.initRoleSelectionImage;
    } catch (error) {
      logApp(`Error leyendo configuración de imágenes: ${error}`);
      return;
    }

    const guild = await client.guilds.fetch(guildId);
    const channel = (await guild.channels.fetch(
      rolesState.channelId
    )) as TextChannel;
    const message = await channel.messages.fetch(
      rolesState.roleSelectionMessageId
    );

    // Crear el embed actualizado con la nueva imagen y texto centralizado
    const updatedEmbed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('🎯 SELECCIONA TU RANGO')
      .setDescription(ROLE_SELECTION_EMBED_TEXT)
      .setImage(currentImage); // Usar la imagen leída del JSON

    await message.edit({
      embeds: [updatedEmbed],
      components: message.components, // Mantener los botones existentes
    });

    console.log(
      `Imagen del embed de selección de rango actualizada para guild ${guildId}`
    );
  } catch (error) {
    console.error(
      `Error actualizando imagen del embed para guild ${guildId}:`,
      error
    );
  }
}
