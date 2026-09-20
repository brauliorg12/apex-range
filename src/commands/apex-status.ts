import {
  MessageFlags,
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
import { APEX_LOGO_EMOJI, HELP_EMOGI } from '../models/constants';
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
      .setLabel('Ayuda')
      .setEmoji(HELP_EMOGI)
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
        flags: MessageFlags.Ephemeral,
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
      flags: MessageFlags.Ephemeral,
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
    .setTitle('❓ Guía Completa - Estado de Apex Legends')
    .setDescription(
      `**Información detallada sobre el estado actual de Apex Legends**\n\n` +
        `📍 **¿Qué significa cada sección del panel?**\n\n` +
        `🎯 **Rotación de Mapas**\n` +
        `• **Battle Royale**: Mapa principal donde se juega el modo estándar\n` +
        `• **Ranked**: Mapa competitivo con matchmaking por habilidad\n` +
        `• **LTM (Limited Time Mode)**: Modos especiales temporales con reglas únicas\n` +
        `• Los mapas cambian aproximadamente cada 2 horas\n\n` +
        `🏆 **Sistema de Rangos**\n` +
        `• **Bronce → Plata → Oro → Platino → Diamante → Maestro → Apex Predator**\n` +
        `• Cada rango tiene subdivisiones (I, II, III, IV)\n` +
        `• El RP necesario para Predator varía por plataforma:\n` +
        `  ▫️ **PC**: Generalmente más alto\n` +
        `  ▫️ **PlayStation**: Nivel medio\n` +
        `  ▫️ **Xbox**: Similar a PlayStation\n\n` +
        `🛰️ **Estado de Servidores**\n` +
        `• **🟢 Verde (UP)**: Servidor operativo y funcionando correctamente\n` +
        `• **🟡 Amarillo (SLOW)**: Lentitud o intermitencias temporales\n` +
        `• **🔴 Rojo (DOWN)**: Servidor caído y no disponible\n` +
        `• **⚪ Blanco (Desconocido)**: Estado no determinado\n\n` +
        `📊 **Información por Región**\n` +
        `• **PC**: Servidores globales con baja latencia\n` +
        `• **PlayStation**: Red PlayStation Network\n` +
        `• **Xbox**: Red Xbox Live\n` +
        `• **Otras**: Regiones específicas como Asia-Pacífico\n\n` +
        `⚡ **Consejos para Jugadores**\n` +
        `• Consulta este panel antes de jugar para evitar sorpresas\n` +
        `• Si un servidor está lento, considera cambiar de región\n` +
        `• Los mapas cambian cada 2 horas, ¡mantente informado!\n` +
        `• El RP Predator se actualiza semanalmente`
    )
    .setColor(0x5865f2)
    .setFooter({
      text: 'Información actualizada cada 5 minutos • Apex Legends Status',
      iconURL: 'https://cdn.discordapp.com/emojis/1410729026410119269.webp',
    });

  await interaction.reply({
    embeds: [embed],
    components: [createCloseButtonRow()], // Botón cerrar reutilizable
    flags: MessageFlags.Ephemeral,
  });
}
