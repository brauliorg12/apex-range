import { Role } from 'discord.js';
import { APEX_RANKS } from '../models/constants';

/**
 * Obtiene la lista de nombres de roles excluidos desde la variable de entorno EXCLUDED_ROLES.
 * Útil para filtrar roles en distintos módulos del proyecto.
 * @returns Array de nombres de roles excluidos.
 */
function getExcludedRoles(): string[] {
  const env = process.env.EXCLUDED_ROLES;
  if (!env) return [];
  return env
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

/**
 * Filtra los roles permitidos para mostrar junto al usuario.
 * Excluye: @everyone, roles de rango, y los definidos en EXCLUDED_ROLES.
 * @param roles Array de roles de Discord
 * @returns Array de roles permitidos
 */
export function filterAllowedRoles(roles: Role[]): Role[] {
  const excluded = getExcludedRoles();
  return roles.filter(
    (role) =>
      role.name !== '@everyone' &&
      !APEX_RANKS.some((rank) => rank.roleName === role.name) &&
      !excluded.includes(role.name)
  );
}
