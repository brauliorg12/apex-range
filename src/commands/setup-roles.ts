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
import { createRankButtons } from '../utils/button-helper';
import { buildRanksHeaderAttachment } from '../utils/ranks-header-card'; // <-- NUEVO

export const data = new SlashCommandBuilder()
  .setName('setup-roles')
  .setDescription(
    'Configura el panel de selección de roles y el mensaje de conteo.'
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) return;

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

  const buttonRows = createRankButtons(interaction.client, interaction.guild);

  // Header con canvas: mantenemos título/descr. del embed, solo reemplazamos la imagen
  const headerAttachment = await buildRanksHeaderAttachment(interaction.guild!); // <-- NUEVO

  const roleSelectionEmbed = new EmbedBuilder()
    .setColor('#95a5a6') // Color gris
    .setTitle('Selección de Rango')
    .setDescription(
      'Selecciona tu rango actual en Apex Legends para que otros jugadores puedan encontrarte.'
    )
    .setImage(headerAttachment ? `attachment://${headerAttachment.name}` : ''); // <-- NUEVO

  const roleSelectionMessage = await channel.send({
    embeds: [roleSelectionEmbed],
    components: buttonRows,
    files: headerAttachment ? [headerAttachment.attachment] : [], // <-- NUEVO
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
