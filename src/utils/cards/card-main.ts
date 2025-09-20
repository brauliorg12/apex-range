import { EmbedBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { REFRESH_EMOGI, TIMER_EMOGI } from '../../models/constants';

// Variable global para la versión
let currentVersion = 'dev';

/**
 * Actualiza la versión global leyendo el archivo package.json.
 * Si falla la lectura, establece la versión como 'dev'.
 */
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

/**
 * Construye un embed de Discord con información general de Apex Legends.
 *
 * @param now - Objeto Date con la fecha y hora actual.
 * @param cacheInfo - Objeto con indicadores booleanos sobre si los datos están en cache (no usado en esta función, pero incluido por consistencia).
 * @returns Un objeto EmbedBuilder configurado con título, descripción y footer con versión.
 */
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
    .setTitle('> Información de Apex Legends')
    .setDescription(
      [
        '> ' + REFRESH_EMOGI + ' Se actualiza cada 5 minutos.',
        '> ' + TIMER_EMOGI + ' Última actualización:',
        `\`\`\`${fecha} ${hora}\`\`\``,
        '🌐 Datos desde la API de Mozambique',
        '[Más info](https://apexlegendsapi.com/)',
      ].join('\n')
    )
    .setFooter({
      text: `by Burlon23 - CubaNova - version: ${currentVersion}`,
    });
}
