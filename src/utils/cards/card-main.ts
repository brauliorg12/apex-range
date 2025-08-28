import { EmbedBuilder } from 'discord.js';

export function buildMainEmbed(now: Date, cacheInfo: Record<string, boolean>) {
  return new EmbedBuilder()
    .setColor('#bdc3c7')
    .setTitle('ℹ️ Información de Apex Legends')
    .setDescription(
      [
        '🔄 Se actualiza cada 5 minutos.',
        `🕒 Última actualización: ${now.toLocaleDateString(
          'es-ES'
        )} ${now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })}`,
        '',
        '🌐 Datos desde la API de Mozambique',
        '[Más info](https://apexlegendsapi.com/)',
      ].join('\n')
    )
    .setFooter({
      text: 'by Burlon23',
    });
}
