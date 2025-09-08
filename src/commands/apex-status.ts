import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Interaction,
  EmbedBuilder,
} from 'discord.js';
import { createApexStatusEmbeds } from '../utils/apex-status-embed';
import { writeApexStatusState } from '../utils/state-manager';
import { clearApiCache } from '../utils/apex-api-cache';
import { APEX_LOGO_EMOJI } from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';

/**
 * Definición del comando /apex-status para Discord.
 *
 * Utiliza SlashCommandBuilder para registrar el comando que muestra el estado actual de Apex Legends,
 * incluyendo la rotación de mapas y el RP de Predator.
 * El nombre y la descripción aparecerán en Discord al desplegar el comando.
 */
export const data = new SlashCommandBuilder()
  .setName('apex-status')
  .setDescription(
    'Muestra el estado actual de Apex Legends (rotación de mapas y Predator RP)'
  );

/**
 * Ejecuta el comando /apex-status.
 *
 * - Limpia la caché de la API antes de consultar el estado actual de Apex Legends.
 * - Obtiene y muestra los embeds con la rotación de mapas y el RP de Predator.
 * - Añade botones para ver el perfil global de Apex y para mostrar información sobre los colores de estado.
 * - Fija el mensaje principal en el canal (si tiene permisos).
 * - Registra el mensaje para futuras actualizaciones automáticas.
 * - Informa al usuario que el estado se actualizará cada 5 minutos.
 * - Maneja errores mostrando mensajes claros al usuario.
 *
 * @param interaction Interacción del comando recibida desde Discord.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  try {
    // Limpiar cache antes de consultar la API
    await clearApiCache(
      interaction.guildId ?? undefined,
      interaction.channelId ?? undefined
    );

    const embeds = await createApexStatusEmbeds(
      interaction.guildId ?? undefined,
      interaction.channelId ?? undefined
    );

    // Botón "Ver perfil Apex Global" y "Más info"
    const apexProfileButton = new ButtonBuilder()
      .setCustomId('show_apex_profile_modal')
      .setLabel('Ver perfil Apex Global')
      .setEmoji(APEX_LOGO_EMOJI)
      .setStyle(ButtonStyle.Secondary);

    const moreInfoButton = new ButtonBuilder()
      .setCustomId('server_status_info')
      .setLabel('¿Qué significan los colores?')
      .setEmoji('🛰️')
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      apexProfileButton,
      moreInfoButton
    );

    const reply = await interaction.editReply({
      embeds,
      components: [buttonRow],
    });

    // Fijar el mensaje principal de estado
    try {
      const channel = await interaction.channel?.fetch();
      if (channel && 'messages' in channel) {
        const msg = await channel.messages.fetch(reply.id);
        await msg.pin();
      }
    } catch (err) {
      console.error('No se pudo fijar el mensaje de estado.', err);
      await interaction.followUp({
        content:
          "No pude fijar el mensaje de estado. Por favor, asegúrate de que tengo permisos para 'Gestionar Mensajes'.",
        ephemeral: true,
      });
    }

    // Registrar el mensaje para actualización automática
    await writeApexStatusState({
      apexInfoMessageId: reply.id,
      channelId: interaction.channelId,
      guildId: interaction.guildId!,
    });

    await interaction.followUp({
      content:
        'El estado de Apex Legends se actualizará automáticamente cada 5 minutos.',
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error en /apex-status:', error);
    await interaction.editReply({
      content: 'No se pudo obtener el estado de Apex Legends.',
    });
  }
}

// Handler para el botón "Más info"
export async function handleServerStatusInfo(interaction: Interaction) {
  if (!interaction.isButton() || interaction.customId !== 'server_status_info')
    return;

  const embed = new EmbedBuilder()
    .setTitle('¿Qué significan los colores de estado de servidor?')
    .setDescription(
      `Los colores representan el estado actual de los servidores de Apex Legends según la región o plataforma:\n\n` +
        `🟢 **UP:** El servidor está operativo y funcionando correctamente.\n` +
        `🟡 **SLOW:** El servidor presenta lentitud o intermitencias.\n` +
        `🔴 **DOWN:** El servidor está caído y no disponible.\n` +
        `⚪ **Desconocido:** No se pudo determinar el estado del servidor.\n\n` +
        `Consulta este panel para saber si puedes jugar sin problemas o si hay incidencias en tu región.`
    )
    .setColor(0x5865f2);

  await interaction.reply({
    embeds: [embed],
    components: [createCloseButtonRow()], // Botón cerrar reutilizable
    ephemeral: true,
  });
}
