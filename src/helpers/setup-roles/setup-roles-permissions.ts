import { TextChannel, ChatInputCommandInteraction } from 'discord.js';
import { checkBotPermissions } from '../../utils/permission-checker';

/**
 * Verifica los permisos del bot en el servidor y canal.
 *
 * Delega la verificación detallada de permisos a un checker especializado
 * que valida todos los permisos necesarios para el funcionamiento del bot.
 * Si los permisos son insuficientes, registra una advertencia y cancela la configuración.
 *
 * @param interaction - La interacción del comando para acceder al contexto del servidor.
 * @param channel - El canal específico donde verificar permisos.
 * @param logger - Instancia del logger para registrar el resultado de la verificación.
 * @returns Verdadero si el bot tiene todos los permisos necesarios, falso en caso contrario.
 */
export async function verifyBotPermissions(
  interaction: ChatInputCommandInteraction,
  channel: TextChannel,
  logger: any
): Promise<boolean> {
  logger.info('Verificando permisos del bot...');
  const permissionsOk = await checkBotPermissions(interaction, channel);
  if (!permissionsOk) {
    logger.warn('Configuración cancelada por permisos insuficientes del bot');
    return false;
  }

  logger.info('Permisos del bot verificados correctamente');
  return true;
}
