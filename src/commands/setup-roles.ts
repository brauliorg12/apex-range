import {
  SlashCommandBuilder,
  PermissionsBitField,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { writeState } from '../utils/state-manager';
import { updateRoleCountMessage } from '../utils/update-status-message';

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

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    APEX_RANKS.slice(0, 4).map((rank) =>
      new ButtonBuilder()
        .setCustomId(rank.id)
        .setLabel(`${rank.icon} ${rank.label}`)
        .setStyle(ButtonStyle.Secondary)
    )
  );
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    APEX_RANKS.slice(4).map((rank) =>
      new ButtonBuilder()
        .setCustomId(rank.id)
        .setLabel(`${rank.icon} ${rank.label}`)
        .setStyle(ButtonStyle.Secondary)
    )
  );
  await channel.send({
    content: `**Panel de Selección de Rango de Apex Legends**\nPor favor, selecciona tu rango para obtener el rol correspondiente.`,
    components: [row1, row2],
  });

  const roleCountMessage = await channel.send({
    content: 'Calculando listado de roles...',
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
    channelId: channel.id,
    guildId: interaction.guild.id,
  });
  await updateRoleCountMessage(interaction.guild);

  await interaction.reply({
    content:
      '¡El panel de roles y el mensaje de listado han sido configurados!',
    ephemeral: true,
  });
}
