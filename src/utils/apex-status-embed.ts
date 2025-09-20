import { retry } from './retry-helper';
import {
  getMapRotation,
  getPredatorRank,
  getServerStatus,
} from '../services/apex-api';
import { writeApiCache, readApiCache } from './apex-api-cache';
import { buildMainEmbed } from './cards/card-main';
import { buildPubsEmbed } from './cards/card-pubs';
import { buildRankedEmbed } from './cards/card-ranked';
import { buildLtmEmbed } from './cards/card-ltm';
import { buildPredatorEmbed } from './cards/card-predator';
import { buildServerStatusEmbed } from './cards/card-server-status';
import { logApp } from './logger';

/**
 * Obtiene y construye los embeds de estado de Apex Legends para mostrar en Discord.
 *
 * - Consulta los endpoints críticos (rotación de mapas y estado de servidores) primero,
 *   luego los secundarios (rango depredador).
 * - Usa un sistema de cache: si la API falla, intenta recuperar datos en cache.
 * - Valida la integridad de los datos antes de actualizar la cache.
 * - Registra en consola el estado de cada endpoint y si los datos provienen de cache.
 * - Construye y retorna un array de embeds listos para enviar/editar en Discord,
 *   utilizando helpers especializados para cada sección (main, pubs, ranked, etc).
 *
 * @param guildId   ID de la guild (servidor) de Discord, usado para la cache.
 * @param channelId ID del canal de Discord, usado para la cache.
 * @returns         Array de embeds de Discord con el estado actual de Apex Legends.
 */
export async function createApexStatusEmbeds(
  guildId?: string,
  channelId?: string
) {
  let cacheInfo: { [k: string]: boolean } = {};
  let cacheTimestamps: { [k: string]: number | undefined } = {};
  const now = new Date();

  // Endpoints críticos primero
  const criticalKeys = ['mapRotation', 'serverStatus'];
  const secondaryKeys = ['predatorRank'];

  async function fetchWithCache<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T | null> {
    try {
      const data = await retry(fn, 3, 1200);

      // Validación de datos según endpoint
      let isValid = true;
      if (key === 'mapRotation') {
        isValid = !!(data && (data as any).battle_royale);
      } else if (key === 'predatorRank') {
        isValid = !!(data && (data as any).RP);
      } else if (key === 'serverStatus') {
        isValid = !!data && !(data as any).error;
      }

      if (isValid) {
        await writeApiCache(key, data, guildId, channelId);
        cacheInfo[key] = false;
        cacheTimestamps[key] = Date.now();
        await logApp(`${key}: Datos actualizados correctamente.`);
        return data;
      } else {
        throw new Error(`[ApexStatus] ${key}: Respuesta inválida de la API`);
      }
    } catch (err) {
      const cached = await readApiCache(key, guildId, channelId);
      if (cached) {
        cacheInfo[key] = true;
        cacheTimestamps[key] = cached.ts;
        await logApp(`${key}: Usando datos en cache por error de API.`);
        return cached.data;
      }
      cacheInfo[key] = false;
      cacheTimestamps[key] = undefined;
      await logApp(
        `${key}: No se pudo obtener datos ni de la API ni de cache.`
      );
      return null;
    }
  }

  // Consulta críticos primero
  const criticalResults = await Promise.all(
    criticalKeys.map((key) => {
      switch (key) {
        case 'mapRotation':
          return fetchWithCache('mapRotation', () => getMapRotation());
        case 'serverStatus':
          return fetchWithCache('serverStatus', () => getServerStatus());
        default:
          return Promise.resolve(null);
      }
    })
  );

  // Espera 1 segundo para no saturar el rate limit
  await new Promise((res) => setTimeout(res, 1000));

  // Consulta secundarios después
  const secondaryResults = await Promise.all(
    secondaryKeys.map((key) => {
      switch (key) {
        case 'predatorRank':
          return fetchWithCache('predatorRank', () => getPredatorRank());
        default:
          return Promise.resolve(null);
      }
    })
  );

  // Asigna resultados
  const resultMap: { [k: string]: any } = {};
  criticalKeys.forEach((key, idx) => {
    resultMap[key] = criticalResults[idx];
  });
  secondaryKeys.forEach((key, idx) => {
    resultMap[key] = secondaryResults[idx];
  });

  // Para los que no se consultaron, usa cache si existe
  for (const key of [...criticalKeys, ...secondaryKeys]) {
    if (!(key in resultMap)) {
      const cached = await readApiCache(key, guildId, channelId);
      resultMap[key] = cached?.data ?? null;
    }
  }

  const mapRotation = resultMap.mapRotation;
  const predatorRank = resultMap.predatorRank;
  const serverStatus = resultMap.serverStatus;

  // Logging resumen de ciclo
  await logApp(`Actualización completada.`);

  // Construcción de embeds usando helpers separados
  const br = mapRotation?.battle_royale;
  const ranked = mapRotation?.ranked;
  const ltm = mapRotation?.ltm;

  const mainEmbed = buildMainEmbed(now, cacheInfo);
  const pubsEmbed = buildPubsEmbed(br, cacheInfo, cacheTimestamps);
  const rankedEmbed = buildRankedEmbed(ranked, cacheInfo, cacheTimestamps);
  const ltmEmbed = buildLtmEmbed(ltm, cacheInfo, cacheTimestamps);
  const predatorEmbed = buildPredatorEmbed(
    predatorRank,
    cacheInfo,
    cacheTimestamps
  );
  const serverStatusEmbed = buildServerStatusEmbed(
    serverStatus,
    cacheInfo,
    cacheTimestamps
  );

  return [
    rankedEmbed,
    pubsEmbed,
    ltmEmbed,
    predatorEmbed,
    serverStatusEmbed,
    mainEmbed,
  ];
}
