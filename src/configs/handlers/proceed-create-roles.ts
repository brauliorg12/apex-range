import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { getApexRanksForGuild } from '../../helpers/get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from '../../helpers/get-apex-platforms-for-guild';
import { GAME_PLATFORMS_EMOGI } from '../../models/constants';
import { createMainMenuEmbed } from '../../interactions/setup-navigation';

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
    const platforms = getApexPlatformsForGuild(
      interaction.guild!.id,
      interaction.guild!
    );

    // Verificar roles faltantes de rangos
    const missingRankRoles = ranks.filter(
      (rank) =>
        !interaction.guild!.roles.cache.some(
          (role: any) => role.name === rank.roleName
        )
    );

    // Verificar roles faltantes de plataformas
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

    for (const roleData of missingRoles) {
      try {
        // Determinar si es un rango o plataforma para usar el color apropiado
        const isRank = 'apiName' in roleData; // Los rangos tienen apiName, las plataformas no
        const color = isRank ? (roleData as any).color : '#7289da'; // Color por defecto para plataformas

        const role = await interaction.guild!.roles.create({
          name: roleData.roleName,
          color: color as any,
          mentionable: true,
          reason: 'Creado automáticamente por Apex Range Bot setup',
        });
        createdRoles.push(role.name);
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

    if (createdRoles.length > 0) {
      // Mostrar menú principal de selección de modos después de crear roles
      const menuData = createMainMenuEmbed(interaction.guild!.name);

      await interaction.editReply({
        embeds: [embed, ...menuData.embeds],
        components: menuData.components,
      });
    } else {
      await interaction.editReply({
        embeds: [embed],
        components: [],
      });
    }
  } catch (error) {
    console.error('Error en handleProceedCreateRoles:', error);
    await interaction.editReply({
      content: '❌ Ocurrió un error al crear los roles.',
      embeds: [],
      components: [],
    });
  }
}
