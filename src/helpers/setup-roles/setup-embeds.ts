import {
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import {
  ALL_PLAYERS_EMOGI,
  STATS_LOGO_EMOGI,
  TIMER_EMOGI,
} from '../../models/constants';

/**
 * Crea un embed informativo que confirma la finalización exitosa del setup de roles de Apex Legends.
 * @param panelChannel El canal de texto donde se colocará el panel de rangos.
 * @param elapsed El tiempo transcurrido en segundos para completar el setup.
 * @param userCount El número de usuarios registrados durante el setup.
 * @param statsUpdated Indica si las estadísticas se actualizaron correctamente.
 */
export function createSetupCompletedEmbed(
  panelChannel: TextChannel,
  elapsed: string | number,
  userCount: number,
  statsUpdated: boolean
) {
  const embed = new EmbedBuilder()
    .setTitle('🎯 Setup Roles Activado')
    .setDescription(
      '¡El sistema de rangos de Apex Legends ha sido configurado exitosamente!'
    )
    .addFields(
      {
        name: '📍 Canal del Panel:',
        value: `<#${panelChannel.id}>`,
        inline: false,
      },
      {
        name: TIMER_EMOGI + ' Tiempo de Configuración:',
        value: `${elapsed} segundos`,
        inline: false,
      },
      {
        name: ALL_PLAYERS_EMOGI + ' Usuarios Registrados:',
        value: `${userCount} ${userCount === 0 ? '(inicial)' : ''}`,
        inline: false,
      },
      {
        name: STATS_LOGO_EMOGI + ' Estadísticas:',
        value: statsUpdated ? '✅ Actualizado' : '⚠️ Error en estadísticas',
        inline: false,
      }
    )
    .addFields({
      name: 'Información del Setup:',
      value: `- Panel interactivo creado en <#${panelChannel.id}>\n- Mensajes de selección y estadísticas configurados\n- Sistema de roles operativo\n- Actualizaciones automáticas activadas`,
      inline: false,
    })
    .setFooter({
      text: 'Los usuarios ya pueden seleccionar sus rangos en el panel. ¡Disfruta del bot! 🎮',
    })
    .setColor(0x00ff00); // Verde para éxito

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('configure_excluded_roles_admin')
      .setLabel('Configurar Roles Excluidos')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🚫')
  );

  return { embeds: [embed], components: [buttons] };
}
