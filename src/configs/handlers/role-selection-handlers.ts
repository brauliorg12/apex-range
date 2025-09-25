import { ButtonInteraction } from 'discord.js';
import { getServerLogger } from '../../utils/server-logger';
import {
  getExcludedRolesForGuild,
  setExcludedRolesForGuild,
} from '../../utils/role-filter';
import { createRoleSelectionMenu } from '../../interactions/role-selection-menu';

/**
 * Maneja las interacciones de botones para la selección de roles excluidos en el menú de configuración.
 * Permite alternar la selección de roles específicos para excluirlos del display en cards de rangos,
 * saltar la configuración (no excluir ninguno), o cerrar el menú.
 * Soporta tanto modos de setup inicial como administración posterior (ephemeral).
 * @param interaction La interacción del botón de Discord
 */
export async function handleRoleSelection(interaction: ButtonInteraction) {
  if (!interaction.guild || !interaction.guildId) return;

  const logger = getServerLogger(interaction.guild.id, interaction.guild.name);
  const customId = interaction.customId;

  // Determinar si es modo admin basado en el sufijo del customId
  const isAdmin = customId.endsWith('_admin');

  // Ajusta el customId removiendo el sufijo para lógica común
  const baseCustomId = isAdmin ? customId.slice(0, -6) : customId; // Remueve '_admin' si existe

  if (baseCustomId.startsWith('role_select_')) {
    // Toggle selección de un rol específico
    const roleId = baseCustomId.split('_').pop(); // Extrae el último elemento (el ID real)
    if (roleId) {
      const role = interaction.guild.roles.cache.get(roleId);
      if (!role) {
        logger.warn(`Role ${roleId} not found for toggle`);
        await interaction.followUp({
          content: 'Rol no encontrado.',
          ephemeral: true,
        });
        return;
      }

      // Obtener excluidos actuales, toggle, guardar
      let excludedRoles = getExcludedRolesForGuild(interaction.guild.id);
      if (excludedRoles.includes(role.name)) {
        excludedRoles = excludedRoles.filter((r) => r !== role.name);
      } else {
        excludedRoles.push(role.name);
      }
      setExcludedRolesForGuild(interaction.guild.id, excludedRoles);

      // Actualizar el menú con los excluidos actualizados
      await createRoleSelectionMenu(interaction, excludedRoles, isAdmin);

      logger.info(
        `Rol toggled: ${role.name}, Excluidos actuales: ${excludedRoles.join(
          ', '
        )}`
      );
    }
  } else if (baseCustomId === 'role_skip') {
    // No excluir ninguno (vacío en excludedRoles)
    setExcludedRolesForGuild(interaction.guild.id, []);
    await createRoleSelectionMenu(interaction, [], isAdmin);

    logger.info('Configuración aplicada: No excluir ninguno');
  } else if (baseCustomId === 'back_to_modes') {
    // Para ambos modos: Elimina el mensaje para cerrar el menú
    await interaction.deferUpdate();
    await interaction.deleteReply();
  }
}
