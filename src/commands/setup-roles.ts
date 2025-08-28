import {
  SlashCommandBuilder,
  PermissionsBitField,
  TextChannel,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { writeRolesState } from '../utils/state-manager';
import { updateRoleCountMessage } from '../utils/update-status-message';
import {
  createRankButtons,
  createManagementButtons,
} from '../utils/button-helper';

export const data = new SlashCommandBuilder()
  .setName('setup-roles')
  .setDescription(
    'Configura los paneles de selección de roles y estadísticas.'
  );

/**
 * Ejecuta el comando setup-roles.
 * Este comando es solo para administradores y realiza las siguientes acciones:
 * 1. Verifica que todos los roles de rango de Apex existan en el servidor.
 * 2. Envía un mensaje para que los usuarios seleccionen su rango.
 * 3. Envía un mensaje de estadísticas que se mantendrá actualizado.
 * 4. Guarda los IDs de los mensajes en el estado del bot.
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
      .map((r) => `"${r.roleName}"`) // Note: This line has escaped quotes, which is correct within a template literal.
      .join(', ');
    await interaction.reply({
      content: `Error: Faltan los siguientes roles en el servidor: ${missingRoleNames}. Por favor, créalos y vuelve a intentarlo.`, // Note: This line also has escaped quotes, which is correct within a template literal.
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
    content: 'Generando estadísticas...', // Note: This string literal is correctly escaped.
    components: [...createManagementButtons()],
  });

  // Fijar ambos mensajes
  try {
    await roleSelectionMessage.pin();
    await roleCountMessage.pin();
  } catch (err) {
    console.error(
      'Error al fijar los mensajes. ¿Tengo los permisos necesarios?',
      err
    ); // Note: This string literal is correctly escaped.
    await channel.send(
      "No pude fijar los mensajes. Por favor, asegúrate de que tengo permisos para 'Gestionar Mensajes'." // Note: This string literal is correctly escaped.
    );
  }

  // 5. Guardar estado
  await writeRolesState({
    roleCountMessageId: roleCountMessage.id,
    roleSelectionMessageId: roleSelectionMessage.id,
    channelId: channel.id,
    guildId: interaction.guild.id,
  });

  // 6. Actualizar mensajes
  await updateRoleCountMessage(interaction.guild);

  await interaction.editReply({ content: '¡Configuración completada!' }); // Note: This string literal is correctly escaped.
}
