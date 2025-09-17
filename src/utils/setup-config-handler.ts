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
  // Verificar que los roles de rango existen
  const ranks = getApexRanksForGuild(interaction.guild!.id, interaction.guild!);
  const missingRoles = ranks.filter(
    (rank) =>
      !interaction.guild!.roles.cache.some(
        (role: Role) => role.name === rank.roleName
      )
  );

  // Si no faltan roles, continuar normalmente
  if (missingRoles.length === 0) {
    return true;
  }

  console.log(
    `[Setup-Config] Roles faltantes detectados: ${missingRoles
      .map((r) => r.roleName)
      .join(', ')}`
  );

  // Verificar si el bot tiene permisos para crear roles
  const botMember = await interaction.guild!.members.fetch(
    interaction.client.user!.id
  );
  const canCreateRoles = botMember.permissions.has(
    PermissionsBitField.Flags.ManageRoles
  );

  // Crear embed informativo sobre roles faltantes
  const embed = new EmbedBuilder()
    .setColor('#ff6b6b')
    .setTitle('⚠️ Roles Faltantes Detectados')
    .setDescription(
      `Para configurar Apex Range Bot, necesito los siguientes roles:\n\n${missingRoles
        .map((r) => `• **${r.roleName}**`)
        .join('\n')}\n\n¿Quieres que los cree automáticamente?`
    )
    .setFooter({
      text: canCreateRoles
        ? 'Haz click en "Crear Roles" para continuar'
        : 'Necesito permisos de "Gestionar Roles" para crearlos automáticamente',
    });

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

  // Responder con el embed y botones
  await interaction.reply({
    embeds: [embed],
    components,
    ephemeral: true,
  });

  return false; // Detener la ejecución, esperar interacción del usuario
}
