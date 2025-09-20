import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getApexRanksForGuild } from '../../helpers/get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from '../../helpers/get-apex-platforms-for-guild';
import { suggestRoleMappings } from '../../helpers/suggest-role-mapping';
import { GAME_PLATFORMS_EMOGI } from '../../models/constants';

/**
 * Handler para crear roles faltantes automáticamente
 * @param interaction La interacción del botón que activó este handler
 * @returns Promise<void> No retorna valor, maneja la interacción directamente
 */
export async function handleCreateMissingRoles(interaction: ButtonInteraction) {
  if (
    !interaction.isButton() ||
    interaction.customId !== 'create_missing_roles'
  )
    return;

  await interaction.deferUpdate();

  try {
    const ranks = getApexRanksForGuild(
      interaction.guild!.id,
      interaction.guild!
    );
    const platforms = getApexPlatformsForGuild(
      interaction.guild!.id,
      interaction.guild!
    );
    const existingRoles = interaction.guild!.roles.cache.map(
      (role) => role.name
    );

    // Sugerir mapeos basados en roles existentes
    const suggestions = suggestRoleMappings(
      interaction.guild!.id,
      existingRoles
    );

    if (Object.keys(suggestions).length > 0) {
      // Mostrar sugerencias para confirmación
      const suggestionText = Object.entries(suggestions)
        .map(([shortId, roleName]) => `• **${shortId}** → **${roleName}**`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle('🔍 Mapeos Sugeridos de Roles')
        .setDescription(
          `Encontré roles existentes que podrían corresponder a rangos de Apex. ¿Quieres aplicar estos mapeos?\n\n${suggestionText}\n\nSi confirmas, se guardarán como nombres personalizados.`
        );

      const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_mappings')
        .setLabel('Confirmar Mapeos')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

      const skipButton = new ButtonBuilder()
        .setCustomId('skip_mappings')
        .setLabel('Saltar y Crear por Defecto')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏭️');

      const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
        confirmButton,
        skipButton
      );

      await interaction.editReply({
        embeds: [embed],
        components: [components],
      });
      return;
    }

    // Verificar roles faltantes de rangos y plataformas
    const missingRankRoles = ranks.filter(
      (rank) =>
        !interaction.guild!.roles.cache.some(
          (role: any) => role.name === rank.roleName
        )
    );

    const missingPlatformRoles = platforms.filter(
      (platform) =>
        !interaction.guild!.roles.cache.some(
          (role: any) => role.name === platform.roleName
        )
    );

    const missingRoles = [...missingRankRoles, ...missingPlatformRoles];

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

    // Obtener la posición del rol más alto del bot para posicionar los nuevos roles por debajo
    const botHighestRole = interaction.guild!.members.me!.roles.highest;
    let nextPosition = botHighestRole.position - 1;

    for (const roleData of missingRoles) {
      try {
        // Determinar si es un rango o plataforma para usar el color apropiado
        const isRank = 'apiName' in roleData; // Los rangos tienen apiName, las plataformas no
        const color = isRank ? (roleData as any).color : '#7289da'; // Color por defecto para plataformas

        const role = await interaction.guild!.roles.create({
          name: roleData.roleName,
          color: color as any,
          mentionable: true,
          position: nextPosition,
          reason: 'Creado automáticamente por Apex Range Bot setup',
        });
        createdRoles.push(role.name);
        nextPosition--; // Decrementar para el siguiente rol
      } catch (error) {
        console.error(`Error creando rol ${roleData.roleName}:`, error);
        failedRoles.push(roleData.roleName);
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

    // Información adicional sobre plataformas
    if (missingPlatformRoles.length > 0) {
      description +=
        '\n\n' +
        GAME_PLATFORMS_EMOGI +
        ' **Nota:** Se crearon roles para plataformas (PC, PlayStation, Xbox, Nintendo Switch) además de los rangos.';
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
      content: '',
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
