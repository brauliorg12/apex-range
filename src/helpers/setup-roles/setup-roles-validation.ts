import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { handleMissingRoles } from '../../utils/setup-config-handler';

/**
 * Verifica los permisos de administrador del usuario con validación detallada.
 *
 * Comprueba si el usuario que ejecutó el comando tiene permisos de administrador
 * en el servidor. Si no los tiene, responde con un mensaje efímero explicativo
 * y registra el intento en el logger.
 *
 * @param interaction - La interacción del comando de Discord.
 * @param logger - Instancia del logger para registrar eventos.
 * @returns Verdadero si el usuario tiene permisos de administrador, falso en caso contrario.
 */
export async function verifyAdminPermissions(
  interaction: ChatInputCommandInteraction,
  logger: any
): Promise<boolean> {
  // 1. Comprobar permisos de administrador con validación detallada
  if (
    !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)
  ) {
    logger.warn(
      `Usuario ${interaction.user.tag} intentó ejecutar setup-roles sin permisos de administrador`
    );
    await interaction.reply({
      content: 'Este comando solo puede ser usado por administradores.',
      ephemeral: true,
    });
    return false;
  }

  logger.info('Permisos de administrador verificados correctamente');
  return true;
}

/**
 * Verifica que existan los roles necesarios para el funcionamiento del bot.
 *
 * Delega la verificación y posible creación de roles faltantes a un handler dedicado.
 * Si los roles no pueden ser verificados o creados, la configuración se cancela.
 *
 * @param interaction - La interacción del comando de Discord.
 * @param logger - Instancia del logger para registrar eventos.
 * @returns Verdadero si todos los roles existen o fueron creados, falso si la configuración debe cancelarse.
 */
export async function verifyRolesExist(
  interaction: ChatInputCommandInteraction,
  logger: any
): Promise<boolean> {
  logger.info('Verificando roles existentes...');
  const canContinue = await handleMissingRoles(interaction);
  if (!canContinue) {
    logger.info('Configuración cancelada por roles faltantes');
    return false;
  }
  return true;
}
