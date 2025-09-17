import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';

/**
 * Handler para crear roles faltantes automáticamente
 */
export async function handleCreateMissingRoles(interaction: ButtonInteraction) {
  if (
    !interaction.isButton() ||
    interaction.customId !== 'create_missing_roles'
  )
    return;

  await interaction.deferUpdate();

  try {
    const missingRoles = APEX_RANKS.filter(
      (rank) =>
        !interaction.guild!.roles.cache.some(
          (role: any) => role.name === rank.roleName
        )
    );

    if (missingRoles.length === 0) {
      await interaction.editReply({
        content: '✅ Todos los roles ya existen.',
        embeds: [],
        components: [],
      });
      return;
    }

    const createdRoles = [];
    const failedRoles = [];

    for (const rank of missingRoles) {
      try {
        const role = await interaction.guild!.roles.create({
          name: rank.roleName,
          color: rank.color as any,
          mentionable: true,
          reason: 'Creado automáticamente por Apex Range Bot setup',
        });
        createdRoles.push(role.name);
      } catch (error) {
        console.error(`Error creando rol ${rank.roleName}:`, error);
        failedRoles.push(rank.roleName);
      }
    }

    let description = '';
    if (createdRoles.length > 0) {
      description += `✅ **Roles creados:** ${createdRoles.join(', ')}\n\n`;
    }
    if (failedRoles.length > 0) {
      description += `❌ **Roles fallidos:** ${failedRoles.join(', ')}\n\n`;
    }

    if (createdRoles.length > 0) {
      description +=
        '🎉 **¡Perfecto! Ahora puedes continuar con la configuración.**\n\n';
      description +=
        '*Ejecuta nuevamente `/setup-roles` para completar la configuración.*';
    }

    const embed = new EmbedBuilder()
      .setColor(createdRoles.length > 0 ? '#00ff00' : '#ff6b6b')
      .setTitle('🔧 Creación de Roles')
      .setDescription(description);

    const components = [];
    if (createdRoles.length > 0) {
      const continueButton = new ButtonBuilder()
        .setCustomId('continue_setup')
        .setLabel('Continuar Setup')
        .setStyle(ButtonStyle.Success)
        .setEmoji('▶️');

      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton)
      );
    }

    await interaction.editReply({
      embeds: [embed],
      components,
    });
  } catch (error) {
    console.error('Error en handleCreateMissingRoles:', error);
    await interaction.editReply({
      content: '❌ Ocurrió un error al crear los roles.',
      embeds: [],
      components: [],
    });
  }
}

/**
 * Handler para mostrar instrucciones manuales
 */
export async function handleShowManualInstructions(
  interaction: ButtonInteraction
) {
  if (
    !interaction.isButton() ||
    interaction.customId !== 'show_manual_instructions'
  )
    return;

  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('📋 Instrucciones Manuales')
    .setDescription(
      'Para crear los roles manualmente:\n\n' +
        '1. Ve a **Configuración del Servidor** → **Roles**\n' +
        '2. Haz click en **"Crear Rol"**\n' +
        '3. Crea los siguientes roles con estos nombres exactos:\n\n' +
        APEX_RANKS.map((r) => `• **${r.roleName}**`).join('\n') +
        '\n\n' +
        '4. Una vez creados todos los roles, ejecuta nuevamente `/setup-roles`'
    );

  const continueButton = new ButtonBuilder()
    .setCustomId('continue_setup')
    .setLabel('Entendido')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('✅');

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton),
  ];

  await interaction.update({
    embeds: [embed],
    components,
  });
}

/**
 * Handler para continuar con el setup después de crear roles
 */
export async function handleContinueSetup(interaction: ButtonInteraction) {
  if (!interaction.isButton() || interaction.customId !== 'continue_setup')
    return;

  // Re-ejecutar el comando setup-roles
  await interaction.update({
    content: '🔄 Continuando con la configuración...',
    embeds: [],
    components: [],
  });

  // En lugar de simular la interacción, responder con instrucciones
  await interaction.followUp({
    content:
      '✅ **¡Los roles han sido creados exitosamente!**\n\n' +
      'Ahora puedes ejecutar nuevamente el comando `/setup-roles` para completar la configuración.',
    ephemeral: true,
  });
}

/**
 * Handler para cancelar el setup
 */
export async function handleCancelSetup(interaction: ButtonInteraction) {
  if (!interaction.isButton() || interaction.customId !== 'cancel_setup')
    return;

  await interaction.update({
    content: '❌ Configuración cancelada.',
    embeds: [],
    components: [],
  });
}
