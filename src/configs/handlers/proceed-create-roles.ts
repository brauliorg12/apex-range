import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getApexRanksForGuild } from '../../helpers/get-apex-ranks-for-guild';

/**
 * Handler para proceder con la creación de roles faltantes después de confirmar mapeos
 * @param interaction La interacción del botón que activó este handler
 * @returns Promise<void> No retorna valor, maneja la interacción directamente
 */
export async function handleProceedCreateRoles(interaction: ButtonInteraction) {
  if (
    !interaction.isButton() ||
    interaction.customId !== 'proceed_create_roles'
  )
    return;

  await interaction.deferUpdate();

  try {
    const ranks = getApexRanksForGuild(
      interaction.guild!.id,
      interaction.guild!
    );

    // Verificar roles faltantes usando los nombres mapeados/validados
    const missingRoles = ranks.filter(
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
    console.error('Error en handleProceedCreateRoles:', error);
    await interaction.editReply({
      content: '❌ Ocurrió un error al crear los roles.',
      embeds: [],
      components: [],
    });
  }
}
