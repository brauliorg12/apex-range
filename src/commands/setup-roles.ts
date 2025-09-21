import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getServerLogger } from '../utils/server-logger';
import { cleanupInvalidMessageReferences } from '../utils/message-cleanup';
import {
  verifyAdminPermissions,
  verifyRolesExist,
} from '../helpers/setup-roles';
import { createMainMenuEmbed } from '../interactions/setup-navigation';

/**
 * Definición del comando /setup-roles para Discord.
 */
export const data = new SlashCommandBuilder()
  .setName('setup-roles')
  .setDescription(
    'Configura los paneles de selección de roles y estadísticas.'
  );
/**
 * Ejecuta el comando setup-roles.
 * Este comando muestra un menú interactivo para configurar completamente el bot de Apex Legends en el servidor.
 *
 * Flujo de configuración:
 * 1. Verificar permisos de administrador
 * 2. Mostrar menú de selección de modos con botones interactivos
 * 3. Usuario selecciona modo (Automático, Manual, o Canales Existentes)
 * 4. Seguir flujo específico según el modo elegido
 * 5. Ejecutar configuración completa con feedback visual
 *
 * @param interaction La interacción del comando.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) return;

  // Crear logger específico para este servidor
  const logger = getServerLogger(interaction.guild.id, interaction.guild.name);

  // PASO 1: Verificar permisos de administrador
  if (!(await verifyAdminPermissions(interaction, logger))) return;

  // PASO 2: Deferir respuesta inmediatamente para evitar timeout
  await interaction.deferReply({ ephemeral: true });
  logger.info('Respuesta diferida correctamente');

  // Log detallado para debugging
  logger.info('=== INICIANDO SETUP-ROLES ===');
  logger.info(
    `Canal: ${
      interaction.channel && 'name' in interaction.channel
        ? interaction.channel.name
        : 'Desconocido'
    } (${interaction.channel?.id || 'Desconocido'})`
  );
  logger.info(`Usuario: ${interaction.user.tag} (${interaction.user.id})`);

  // PASO 3: Limpiar referencias inválidas a mensajes antes de configurar
  try {
    await cleanupInvalidMessageReferences(
      interaction.guild.id,
      interaction.client
    );
    logger.info('Referencias inválidas limpiadas correctamente');
  } catch (error) {
    logger.warn('Error limpiando referencias inválidas:', error);
  }

  // PASO 4: Verificar que los roles de rango existen
  if (!(await verifyRolesExist(interaction, logger))) {
    logger.info('Roles faltantes, esperando interacción del usuario');
    return;
  }
  logger.info('Verificación de roles completada correctamente');

  // PASO 5: Mostrar menú de selección de modos directamente
  const menuData = createMainMenuEmbed(interaction.guild.name);

  await interaction.editReply(menuData);

  logger.info('Menú de selección de modos mostrado');
}
