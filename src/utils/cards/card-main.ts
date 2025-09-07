import { EmbedBuilder } from 'discord.js';

export function buildMainEmbed(now: Date, cacheInfo: Record<string, boolean>) {
  const fecha = now.toLocaleDateString('es-ES');
  const hora = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  // Obtén la versión desde package.json o variable de entorno
  const version =
    process.env.npm_package_version || process.env.BOT_VERSION || 'dev';

  return new EmbedBuilder()
    .setColor('#bdc3c7')
    .setTitle('ℹ️ Información de Apex Legends')
    .setDescription(
      [
        '🔄 Se actualiza cada 5 minutos.',
        '🕒 Última actualización:',
        `\`\`\`${fecha} ${hora}\`\`\``,
        '🌐 Datos desde la API de Mozambique',
        '[Más info](https://apexlegendsapi.com/)',
      ].join('\n')
    )
    .setFooter({
      text: `by CubaNova Company - 2025 - version: ${version}`,
    });
}
