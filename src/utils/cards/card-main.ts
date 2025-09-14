import { EmbedBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Variable global para la versión
let currentVersion = 'dev';

// Función para actualizar la versión leyendo package.json
function updateVersion() {
  try {
    const pkgPath = join(__dirname, '../../../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    currentVersion = pkg.version || 'dev';
  } catch (err) {
    currentVersion = 'dev';
  }
}

// Actualiza la versión cada 5 minutos (300000 ms)
updateVersion();
setInterval(updateVersion, 300000);

export function buildMainEmbed(now: Date, cacheInfo: Record<string, boolean>) {
  const fecha = now.toLocaleDateString('es-ES');
  const hora = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

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
      text: `by CubaNova Company - 2025 - version: ${currentVersion}`,
    });
}
