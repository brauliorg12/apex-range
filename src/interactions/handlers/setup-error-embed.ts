import { EmbedBuilder } from 'discord.js';

/**
 * Crea un embed de error estándar para respuestas de setup.
 * @param title Título del embed
 * @param description Descripción del error
 * @returns EmbedBuilder configurado
 */
export function createErrorEmbed(
  title: string,
  description: string
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xff0000);
}

/**
 * Crea un embed de error para configuración fallida.
 * @param mode Modo de configuración que falló
 * @returns EmbedBuilder configurado con mensaje detallado
 */
export function createSetupErrorEmbed(mode: string): EmbedBuilder {
  const modeText =
    mode === 'auto'
      ? 'automática'
      : mode === 'manual'
      ? 'manual'
      : 'con canales existentes';

  return new EmbedBuilder()
    .setTitle('❌ Error en la Configuración')
    .setDescription(
      `Ocurrió un error durante la configuración ${modeText}.\n\n` +
        '**Posibles causas:**\n' +
        '• El bot no tiene permisos para crear canales\n' +
        `${mode === 'manual' ? '• Nombres de canales inválidos\n' : ''}` +
        `${
          mode === 'existente' ? '• Los canales especificados no existen\n' : ''
        }` +
        '• Error interno del servidor\n\n' +
        'Por favor, verifica los permisos del bot e intenta nuevamente.'
    )
    .setColor(0xff0000);
}
