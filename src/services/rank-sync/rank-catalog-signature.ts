import { createHash } from 'crypto';
import { getActiveRanks } from '../../models/rank-catalog';

/**
 * Normaliza nombres de roles para compararlos sin depender de mayúsculas
 * ni espacios externos.
 *
 * @param name - Nombre del rol.
 * @returns El nombre normalizado.
 */
export function normalizeRoleName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Calcula una firma estable del catálogo activo de rangos.
 *
 * Incluye todos los datos que pueden cambiar el panel o los botones. Cambiar
 * `ENABLE_NEW_RANKS` cambia la firma y fuerza la reconstrucción del panel.
 *
 * @returns La firma SHA-1 del catálogo activo.
 */
export function getRankCatalogSignature(): string {
  const payload = getActiveRanks().map((rank) =>
    [
      rank.shortId,
      rank.tier,
      rank.id,
      rank.label,
      rank.roleName,
      rank.icon,
      rank.color,
    ].join('|')
  ).join('\n');

  return createHash('sha1').update(payload).digest('hex');
}
