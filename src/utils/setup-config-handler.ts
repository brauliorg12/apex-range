import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  Role,
} from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from '../helpers/get-apex-platforms-for-guild';
import { logApp } from '../utils/logger';

/**
 * Maneja la verificación y creación de roles faltantes para el setup del bot.
 *
 * Verifica si los roles necesarios para los rangos de Apex Legends existen en el servidor.
 * Si faltan, informa al usuario y ofrece opciones para crearlos automáticamente o manualmente,
 * dependiendo de los permisos del bot.
 *
 * @param interaction - La interacción del comando de Discord que activó esta función.
 * @returns true si todos los roles existen y se puede continuar; false si faltan roles y se detuvo la ejecución.
 */
export async function handleMissingRoles(
  interaction: ChatInputCommandInteraction
): Promise<boolean> {
  // Verificar que los roles de rango y plataformas existen
  const ranks = getApexRanksForGuild(interaction.guild!.id, interaction.guild!);
  const platforms = getApexPlatformsForGuild(
    interaction.guild!.id,
    interaction.guild!
  );

  const missingRankRoles = ranks.filter(
    (rank) =>
      !interaction.guild!.roles.cache.some(
        (role: Role) => role.name === rank.roleName
      )
  );

  const missingPlatformRoles = platforms.filter(
    (platform) =>
      !interaction.guild!.roles.cache.some(
        (role: Role) => role.name === platform.roleName
      )
  );

  const missingRoles = [...missingRankRoles, ...missingPlatformRoles];

  // Si no faltan roles, continuar normalmente
  if (missingRoles.length === 0) {
    return true;
  }

  await logApp(
    `Roles faltantes detectados: ${missingRoles
      .map((r) => r.roleName)
      .join(', ')}`
  );

  // Verificar si el bot tiene permisos para crear roles
  let canCreateRoles = false;
  try {
    const botMember = await interaction.guild!.members.fetch(
      interaction.client.user!.id
    );
    canCreateRoles = botMember.permissions.has(
      PermissionsBitField.Flags.ManageRoles
    );
  } catch (error) {
    await logApp(`Error obteniendo permisos del bot: ${error}`);
    // Asumir que no puede crear roles si no puede fetch el member
    canCreateRoles = false;
  }

  const components = [];

  if (canCreateRoles) {
    // Botones para crear roles o cancelar
    const createButton = new ButtonBuilder()
      .setCustomId('create_missing_roles')
      .setLabel('Crear Roles')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔧');

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_setup')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌');

    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        createButton,
        cancelButton
      )
    );
  } else {
    // Botón para mostrar instrucciones manuales
    const manualButton = new ButtonBuilder()
      .setCustomId('show_manual_instructions')
      .setLabel('Instrucciones Manuales')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📋');

    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(manualButton)
    );
  }

  // Responder con un mensaje y botones
  const roleList = missingRoles.map((r) => `• **${r.roleName}**`).join('\n');
  const instructions = canCreateRoles
    ? `Haz clic en "Crear Roles" para que el bot los cree automáticamente.`
    : `Crea estos roles manualmente en la configuración del servidor (Server Settings > Roles), luego ejecuta /setup-roles nuevamente.`;

  try {
    await interaction.editReply({
      content: `⚠️ **Roles Faltantes Detectados**\n\nPara configurar Apex Range Bot, necesitas los siguientes roles:\n${roleList}\n\n${instructions}`,
      components: components,
    });
  } catch (error) {
    await logApp(`Error respondiendo con mensaje de roles faltantes: ${error}`);
    // Si falla, intentar un followUp
    try {
      await interaction.followUp({
        content: `❌ Error al mostrar roles faltantes. Revisa los permisos del bot.`,
        ephemeral: true,
      });
    } catch (followUpError) {
      await logApp(`Error en followUp: ${followUpError}`);
    }
  }

  return false; // Detener la ejecución, esperar que el usuario cree los roles
}
