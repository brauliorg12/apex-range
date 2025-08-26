import {
  SlashCommandBuilder,
  PermissionsBitField,
  TextChannel,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { writeState } from '../utils/state-manager';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { createRankButtons, createManagementButtons } from '../utils/button-helper';
import { createApexStatusEmbed } from '../utils/apex-status-embed';

export const data = new SlashCommandBuilder()
  .setName('setup-roles')
  .setDescription(
    'Configura los paneles de selección de roles, información y estadísticas.'
  );

/**
 * Ejecuta el comando setup-roles.
 * Este comando es solo para administradores y realiza las siguientes acciones:
 * 1. Verifica que todos los roles de rango de Apex existan en el servidor.
 * 2. Envía un mensaje para que los usuarios seleccionen su rango.
 * 3. Envía un mensaje de estadísticas que se mantendrá actualizado.
 * 4. Envía un mensaje con información de Apex que se mantendrá actualizado.
 * 5. Guarda los IDs de los mensajes en el estado del bot.
 * @param interaction La interacción del comando.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) return;

  // 1. Comprobar permisos de administrador
  if (
    !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)
  ) {
    await interaction.reply({
      content: 'Este comando solo puede ser usado por administradores.',
      ephemeral: true,
    });
    return;
  }

  // 2. Verificar que los roles de rango existen
  const missingRoles = APEX_RANKS.filter(
    (rank) =>
      !interaction.guild!.roles.cache.some(
        (role) => role.name === rank.roleName
      )
  );

  if (missingRoles.length > 0) {
    const missingRoleNames = missingRoles
      .map((r) => `"${r.roleName}"`) // Corrected escaping for roleName
      .join(', ');
    await interaction.reply({
      content: `Error: Faltan los siguientes roles en el servidor: ${missingRoleNames}. Por favor, créalos y vuelve a intentarlo.`, // Corrected escaping for missingRoleNames
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  await interaction.deferReply({ ephemeral: true });

  // 3. Mensaje de selección de rango
  const roleSelectionEmbed = new EmbedBuilder()
    .setColor('#f1c40f')
    .setTitle('🎯 SELECCIONA TU RANGO')
    .setDescription(
      [
        'Haz click en el botón correspondiente a tu rango actual de Apex Legends.',
        '',
        '🔹 **¡Es obligatorio seleccionar tu rango para aparecer en los listados y paneles!**',
        '',
        '⬇️ _Selecciona tu rango abajo:_',
      ].join('\n')
    )
    .setImage(
      'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg'
    );

  const roleSelectionMessage = await channel.send({
    embeds: [roleSelectionEmbed],
    components: createRankButtons(interaction.client),
  });

  // 4. Mensaje de estadísticas
  const roleCountMessage = await channel.send({
    content: 'Generando estadísticas...', // Corrected escaping for content
    components: [...createManagementButtons()],
  });

  // 5. Mensaje de información de Apex
  const apexInfoEmbed = await createApexStatusEmbed();

  // Agrega el botón "Ver mi perfil Apex"
  const apexProfileButtonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('show_apex_profile_modal')
      .setLabel('Ver mi perfil Apex')
      .setStyle(ButtonStyle.Primary)
  );

  const apexInfoMessage = await channel.send({
    embeds: [apexInfoEmbed],
    components: [apexProfileButtonRow],
  });

  try {
    await apexInfoMessage.pin();
    await roleCountMessage.pin();
  } catch (err) {
    console.error('Error al fijar los mensajes. ¿Tengo los permisos necesarios?', err);
    await channel.send(
      "No pude fijar los mensajes. Por favor, asegúrate de que tengo permisos para 'Gestionar Mensajes'."
    ); // Corrected escaping for content
  }

  // 6. Guardar estado
  await writeState({
    roleCountMessageId: roleCountMessage.id,
    roleSelectionMessageId: roleSelectionMessage.id,
    apexInfoMessageId: apexInfoMessage.id,
    channelId: channel.id,
    guildId: interaction.guild.id,
  });

  // 7. Actualizar mensajes
  await updateRoleCountMessage(interaction.guild);

  await interaction.editReply({ content: '¡Configuración completada!' });

}