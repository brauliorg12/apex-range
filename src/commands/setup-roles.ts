import {
  SlashCommandBuilder,
  PermissionsBitField,
  TextChannel,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { writeState } from '../utils/state-manager';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { createRankButtons, createManagementButtons } from '../utils/button-helper';
import { getPlayers } from '../utils/players-manager';

export const data = new SlashCommandBuilder()
  .setName('setup-roles')
  .setDescription(
    'Configura el panel de selección de roles y el mensaje de conteo.'
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) return;

  if (
    !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)
  ) {
    await interaction.reply({
      content: 'Este comando solo puede ser usado por administradores.',
      ephemeral: true,
    });
    return;
  }

  const missingRoles = APEX_RANKS.filter(
    (rank) =>
      !interaction.guild!.roles.cache.some(
        (role) => role.name === rank.roleName
      )
  );

  if (missingRoles.length > 0) {
    const missingRoleNames = missingRoles
      .map((r) => `"${r.roleName}"`)
      .join(', ');
    await interaction.reply({
      content: `Error: Faltan los siguientes roles en el servidor: ${missingRoleNames}. Por favor, créalos y vuelve a intentarlo.`,
      ephemeral: true,
    });
    return;
  }

  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  const components = [
    ...createRankButtons(interaction.client), // Botones de rango
    createManagementButtons(), // Botones de gestión (incluye "Ver mi perfil Apex")
  ];

  // Embed llamativo y claro para selección de rango
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
    );

  const roleSelectionMessage = await channel.send({
    embeds: [roleSelectionEmbed],
    components,
  });

  const roleCountMessage = await channel.send({
    content: 'Generando estadísticas...',
  });

  try {
    await roleCountMessage.pin();
  } catch (err) {
    console.error(
      'Error al fijar el mensaje. ¿Tengo los permisos necesarios?',
      err
    );
    await channel.send(
      "No pude fijar el mensaje de conteo. Por favor, asegúrate de que tengo permisos para 'Gestionar Mensajes'."
    );
  }

  await writeState({
    roleCountMessageId: roleCountMessage.id,
    roleSelectionMessageId: roleSelectionMessage.id,
    channelId: channel.id,
    guildId: interaction.guild.id,
  });
  await updateRoleCountMessage(interaction.guild);

  const guildId = interaction.guildId;
  const players = await getPlayers(guildId);

  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'Respuesta adicional',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'Respuesta principal',
        ephemeral: true,
      });
    }
  } catch (error: any) {
    if (error.code !== 10062) {
      throw error;
    }
    // Si es 10062, ignora o loguea
  }
}
