import { ButtonInteraction, TextChannel } from 'discord.js';

/**
 * Construye las opciones para performSetup basadas en el modo.
 * @param mode Modo de configuración
 * @param controlChannel Canal de control para modo existente
 * @param panelChannel Canal de panel para modo existente
 * @param options Opciones adicionales
 * @param interaction La interacción del botón
 * @param logger Logger del servidor
 * @returns Objeto con las opciones configuradas
 */
export function buildSetupOptions(
  mode: string,
  controlChannel: TextChannel | undefined,
  panelChannel: TextChannel | undefined,
  options: { canal_admin?: string; canal_publico?: string } | undefined,
  interaction: ButtonInteraction,
  logger: any
): any {
  const setupOptions: any = { modo: mode };

  if (mode === 'manual') {
    // Los nombres de canales ya vienen validados en options
    if (options?.canal_admin && options?.canal_publico) {
      setupOptions.canal_admin = options.canal_admin;
      setupOptions.canal_publico = options.canal_publico;
      logger.info(
        `Nombres configurados - Admin: ${setupOptions.canal_admin}, Panel: ${setupOptions.canal_publico}`
      );
    }
  } else if (mode === 'existente') {
    // Los canales ya vienen validados
    setupOptions.controlChannelId = controlChannel!.id;
    setupOptions.panelChannelId = panelChannel!.id;
    logger.info(
      `IDs configurados - Control: ${setupOptions.controlChannelId}, Panel: ${setupOptions.panelChannelId}`
    );
  }

  return setupOptions;
}
