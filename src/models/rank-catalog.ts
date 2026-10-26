import { APEX_RANKS } from './constants';
import type { ApexRank } from '../interfaces/apex-rank';

/**
 * Catálogo activo y flag temporal de rollout.
 *
 * `ENABLE_NEW_RANKS` es temporal y queda fijo en `false` en esta versión:
 * Esmeralda y Gran maestro no se publican. Al cerrar el rollout debe
 * eliminarse de este módulo, del código, del JSDoc y de la documentación,
 * junto con `LEGACY_ROOKIE_LABEL`, `buildActiveRanks` y `getAllRanks`.
 * `getActiveRanks` queda como acceso al catálogo completo.
 */

/** shortIds de los rangos que se habilitan con el rollout nuevo. */
const NEW_RANK_SHORT_IDS = new Set(['emerald', 'grandmaster']);

/** Nombre visible de `rookie` cuando el modo legacy está activo. */
const LEGACY_ROOKIE_LABEL = 'Rookie';

/**
 * Flag temporal del rollout. Se mantiene apagado por código hasta que se
 * autorice la publicación de Esmeralda y Gran maestro. No se lee de `.env`.
 */
const ENABLE_NEW_RANKS = false;

/** Catálogo activo calculado una sola vez por proceso. */
let activeRanks: readonly ApexRank[] | null = null;

/**
 * Construye el catálogo activo según el flag de rollout.
 *
 * En modo legacy oculta Esmeralda y Gran maestro y muestra `rookie` como
 * `Rookie`. No modifica roles, jugadores ni datos persistidos.
 *
 * @returns El catálogo activo, ordenado por `tier`.
 */
function buildActiveRanks(): readonly ApexRank[] {
  return APEX_RANKS.filter(
    (rank) => ENABLE_NEW_RANKS || !NEW_RANK_SHORT_IDS.has(rank.shortId)
  ).map((rank) => {
    if (ENABLE_NEW_RANKS || rank.shortId !== 'rookie') return rank;

    return {
      ...rank,
      label: LEGACY_ROOKIE_LABEL,
      roleName: LEGACY_ROOKIE_LABEL,
    };
  });
}

/**
 * Devuelve el catálogo activo de rangos.
 *
 * Es la única fuente para cards, botones, setup, roles, panel, progresión y
 * resolución canónica. En modo legacy oculta los rangos nuevos sin borrar
 * roles ni registros existentes. El flag es una constante de código: no se
 * configura por entorno ni se cambia en caliente.
 *
 * @returns El catálogo activo, ordenado por `tier`.
 */
export function getActiveRanks(): readonly ApexRank[] {
  if (!activeRanks) {
    activeRanks = buildActiveRanks();
  }

  return activeRanks;
}

/**
 * Devuelve el catálogo completo, incluidos los rangos ocultos por el flag.
 *
 * Se usa para excluir nombres de roles de rango de listas auxiliares, no para
 * mostrar cards ni botones.
 *
 * @returns El catálogo completo.
 */
export function getAllRanks(): readonly ApexRank[] {
  return APEX_RANKS;
}
