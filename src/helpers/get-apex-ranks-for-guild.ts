import { Guild } from 'discord.js';
import { ApexRank } from '../interfaces/apex-rank';
import { loadServerConfig } from '../utils/server-config';
import { getActiveRanks } from '../models/rank-catalog';
import { RANK_ALIASES } from '../models/constants-roles';
import { sortRanksByTier } from './rank-priority';

/**
 * Normaliza nombres de roles para compararlos sin depender de mayúsculas
 * ni espacios externos.
 *
 * @param name - Nombre del rol.
 * @returns El nombre normalizado.
 */
function normalizeRoleName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Construye un índice nombre normalizado → nombre real del rol.
 * Se arma una sola vez por guild para evitar recorrer roles en cada alias.
 *
 * @param guild - Guild del que se leen los roles.
 * @returns El índice de nombres normalizados a nombres reales.
 */
function buildRoleNameIndex(guild: Guild): Map<string, string> {
  const index = new Map<string, string>();

  for (const role of guild.roles.cache.values()) {
    const key = normalizeRoleName(role.name);
    if (!index.has(key)) {
      index.set(key, role.name);
    }
  }

  return index;
}

/**
 * Busca un rol en el índice considerando primero el nombre configurado
 * y luego los alias conocidos del rango.
 *
 * @param roleNameIndex - Índice de nombres normalizados a nombres reales.
 * @param shortId - Clave estable del rango.
 * @param primaryName - Nombre configurado o por defecto del rol.
 * @returns El nombre real del rol encontrado o `primaryName`.
 */
function findRoleWithAliases(
  roleNameIndex: Map<string, string>,
  shortId: string,
  primaryName: string
): string {
  const primaryRole = roleNameIndex.get(normalizeRoleName(primaryName));
  if (primaryRole) return primaryRole;

  const aliases = RANK_ALIASES[shortId] || [];
  for (const alias of aliases) {
    const roleName = roleNameIndex.get(normalizeRoleName(alias));
    if (roleName) return roleName;
  }

  return primaryName;
}

/**
 * Obtiene la lista de rangos de Apex Legends con nombres de roles
 * personalizados para un servidor.
 *
 * Valida el nombre configurado contra los roles reales. Si no existe, prueba
 * los alias del rango y, si tampoco aparecen, conserva el nombre configurado o
 * el nombre por defecto. Usa únicamente el catálogo activo: en modo legacy
 * oculta Esmeralda/Gran maestro y muestra `rookie` como `Rookie`. Los
 * mapeos existentes de `server-config` tienen prioridad y el flag no los
 * reescribe.
 *
 * @param guildId - ID del servidor de Discord.
 * @param guild - Instancia del Guild (opcional, para validar contra Discord).
 * @returns Lista de rangos ordenada por `tier`, con `roleName` resuelto.
 */
export function getApexRanksForGuild(
  guildId: string,
  guild?: Guild
): ApexRank[] {
  const config = loadServerConfig(guildId);
  const roleNameIndex = guild ? buildRoleNameIndex(guild) : null;

  return sortRanksByTier(
    getActiveRanks().map((rank) => {
      const mappedName = config.ranks[rank.shortId] || rank.roleName;

      if (roleNameIndex) {
        return {
          ...rank,
          roleName: findRoleWithAliases(
            roleNameIndex,
            rank.shortId,
            mappedName
          ),
        };
      }

      return {
        ...rank,
        roleName: mappedName,
      };
    })
  );
}
