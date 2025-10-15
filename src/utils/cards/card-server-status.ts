import { EmbedBuilder } from 'discord.js';
import { formatCacheAge } from './formatters';

/**
 * Construye un embed de Discord con el estado de los servidores de Apex Legends.
 *
 * @param serverStatus - Objeto con datos del estado de los servidores, incluyendo login, crossplay y otras plataformas.
 * @param cacheInfo - Objeto con indicadores booleanos sobre si los datos están en cache (e.g., serverStatus).
 * @param cacheTimestamps - Objeto opcional con timestamps de cuando se cargaron los datos en cache, para calcular la antigüedad.
 * @returns Un objeto EmbedBuilder configurado con el estado de los servidores por región y plataforma, y footer con info de cache.
 */
export function buildServerStatusEmbed(
  serverStatus: any,
  cacheInfo: Record<string, boolean>,
  cacheTimestamps?: Record<string, number | undefined>
) {
  const getStatusEmoji = (status: string) => {
    if (status === 'UP') return '🟢';
    if (status === 'SLOW') return '🟡';
    if (status === 'DOWN') return '🔴';
    return '⚪'; // Unknown
  };

  const footerText =
    cacheInfo.serverStatus && cacheTimestamps?.serverStatus
      ? `⚠️ Datos en cache cargados ${formatCacheAge(
          cacheTimestamps.serverStatus
        )}`
      : undefined;

  const embed = new EmbedBuilder()
    .setColor('#27ae60')
    .setTitle('🛰️ Estado de los Servidores de Apex Legends');

  if (serverStatus) {
    const fields = [];
    const originLogin = serverStatus.Origin_login;
    if (originLogin) {
      fields.push({
        name: 'Servidores de Login',
        value: [
          `${getStatusEmoji(originLogin.SouthAmerica?.Status)} Sudamérica`,
          `${getStatusEmoji(originLogin['US-East']?.Status)} US East`,
          `${getStatusEmoji(originLogin['US-Central']?.Status)} US Central`,
          `${getStatusEmoji(originLogin['US-West']?.Status)} US West`,
          `${getStatusEmoji(originLogin['EU-West']?.Status)} Europa (Oeste)`,
          `${getStatusEmoji(originLogin['EU-East']?.Status)} Europa (Este)`,
        ].join('\n'),
        inline: true,
      });
    }

    const crossplay = serverStatus.ApexOauth_Crossplay;
    if (crossplay) {
      fields.push({
        name: 'Crossplay',
        value: [
          `${getStatusEmoji(crossplay.SouthAmerica?.Status)} Sudamérica`,
          `${getStatusEmoji(crossplay['US-East']?.Status)} US East`,
          `${getStatusEmoji(crossplay['EU-West']?.Status)} Europa (Oeste)`,
        ].join('\n'),
        inline: true,
      });
    }

    const otherPlatforms = serverStatus.otherPlatforms;
    if (otherPlatforms) {
      fields.push({
        name: 'Otras Plataformas',
        value: [
          `${getStatusEmoji(
            otherPlatforms['Playstation-Network']?.Status
          )} PlayStation`,
          `${getStatusEmoji(otherPlatforms['Xbox-Live']?.Status)} Xbox Live`,
        ].join('\n'),
        inline: true,
      });
    }

    embed.addFields(fields);
    embed.setDescription(
      'Estado de los servicios. [Datos de apexlegendsstatus.com](https://apexlegendsstatus.com/)'
    );
  } else {
    embed.setDescription('No se pudo obtener el estado de los servidores.');
  }

  if (footerText) {
    embed.setFooter({ text: footerText });
  }

  return embed;
}
