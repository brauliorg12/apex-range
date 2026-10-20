import {
  MessageFlags,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Interaction,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { createApexStatusEmbeds } from '../utils/apex-status-embed';
import { createApexStatusComponents } from '../utils/apex-status-components';
import {
  readApexStatusState,
  writeApexStatusState,
} from '../utils/state-manager';
import { clearApiCache } from '../utils/apex-api-cache';
import { createCloseButtonRow } from '../utils/button-helper';
import { getServerLogger } from '../utils/server-logger';
import {
  cleanupDuplicateApexPanels,
  deletePreviousApexPanel,
  notifyApexPanelCommand,
  rememberApexPanelMessage,
  withApexPanelLock,
} from '../helpers/update-apex-info-message';

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
 * - Serializa la operación con el scheduler mediante un lock por guild.
 * - Limpia la caché de la API antes de consultar el estado actual.
 * - Publica el panel como mensaje independiente en el canal, con sus botones.
 * - Fija el mensaje si el bot tiene permisos.
 * - Guarda el ID en `.bot-state` y en memoria para las actualizaciones.
 * - Elimina paneles de Apex duplicados para mantener un único panel vigente.
 * - Notifica la ejecución al canal de control o al owner.
 * - Responde de forma efímera; el canal solo muestra el panel.
 *
 * El comando exige Gestionar canales o Gestionar servidor en el canal. La
 * visibilidad puede restringirse además en Discord → Integraciones.
 *
 * @param interaction Interacción del comando recibida desde Discord.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;

  if (!guild) {
    await interaction.reply({
      content: 'Este comando solo se puede usar en un servidor.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const member =
    guild.members.resolve(interaction.user.id) ??
    (await guild.members.fetch(interaction.user.id).catch(() => null));

  const permissionChannel = interaction.channel;
  const channelPermissions =
    permissionChannel &&
    'permissionsFor' in permissionChannel &&
    member
      ? permissionChannel.permissionsFor(member)
      : null;

  const canManageChannel =
    channelPermissions?.has(PermissionFlagsBits.ManageChannels) ||
    channelPermissions?.has(PermissionFlagsBits.ManageGuild);

  if (!canManageChannel) {
    await interaction.reply({
      content:
        'Necesitás "Gestionar canales" en este canal o "Gestionar servidor" para ejecutar `/apex-status`.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const guildId = guild.id;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    await withApexPanelLock(guildId, async () => {
      // Limpiar caché antes de consultar la API.
      await clearApiCache(guildId, interaction.channelId ?? undefined);

      // Estado anterior: permite eliminar el panel canónico si el comando se
      // ejecuta en otro canal.
      const previousState = await readApexStatusState(guildId);

      const embeds = await createApexStatusEmbeds(
        guildId,
        interaction.channelId ?? undefined
      );

      const channel = interaction.channel;
      if (!channel || !channel.isTextBased() || !('send' in channel)) {
        await interaction.editReply({
          content: 'No puedo publicar el panel de Apex en este canal.',
        });
        return;
      }

      const textChannel = channel as TextChannel;
      const panelMessage = await textChannel.send({
        embeds,
        components: createApexStatusComponents(),
      });

      // Fijar el mensaje principal de estado
      try {
        await panelMessage.pin();
      } catch (err) {
        console.error('No se pudo fijar el mensaje de estado.', err);
        await interaction
          .followUp({
            content:
              "No pude fijar el mensaje de estado. Por favor, asegúrate de que tengo permisos para 'Gestionar Mensajes'.",
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => {});
      }

      // Registrar el mensaje para actualización automática
      rememberApexPanelMessage(guildId, panelMessage.id, textChannel.id);

      let statePersisted = true;

      try {
        await writeApexStatusState({
          apexInfoMessageId: panelMessage.id,
          channelId: interaction.channelId,
          guildId,
          recoveryAttempts: 0,
          lastRecoveryAt: undefined,
          recoverySuspendedUntil: undefined,
        });
      } catch (stateError) {
        statePersisted = false;
        console.error(
          'No se pudo guardar el estado de Apex; se usará el ID en memoria:',
          stateError
        );
        await interaction
          .followUp({
            content:
              'El panel se creó, pero no se pudo guardar el estado. El bot intentará mantenerlo actualizado y avisará si necesita recrearlo.',
            flags: MessageFlags.Ephemeral,
          })
          .catch(() => {});
      }

      const serverLogger = getServerLogger(guildId, guild.name);

      // Mantener un único panel vigente: eliminar paneles anteriores del bot.
      await cleanupDuplicateApexPanels(
        textChannel,
        panelMessage.id,
        interaction.client.user?.id,
        serverLogger
      );

      const moved =
        !!previousState?.channelId && previousState.channelId !== textChannel.id;

      // Si el panel cambia de canal, eliminar el mensaje canónico anterior.
      if (previousState?.channelId && previousState.apexInfoMessageId) {
        await deletePreviousApexPanel(
          guild,
          previousState.channelId,
          previousState.apexInfoMessageId,
          textChannel.id,
          serverLogger
        );
      }

      await notifyApexPanelCommand(
        {
          guild,
          userTag: interaction.user.tag,
          userId: interaction.user.id,
          newChannelId: textChannel.id,
          newMessageId: panelMessage.id,
          previousChannelId: previousState?.channelId,
          previousMessageId: previousState?.apexInfoMessageId,
          moved,
          statePersisted,
        },
        serverLogger
      );

      await interaction.editReply({
        content:
          'Panel de Apex publicado. Se actualizará automáticamente cada 5 minutos.',
      });
    });
  } catch (error) {
    console.error('Error en /apex-status:', error);
    await interaction
      .editReply({
        content: 'No se pudo obtener el estado de Apex Legends.',
      })
      .catch(() => {});
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
