# Sistema de Mapeo de Roles Personalizado

Esta guía explica en detalle el sistema inteligente de mapeo de roles que permite al bot adaptarse a cualquier configuración de servidor Discord existente.

---

## 🎯 Visión General

El **Sistema de Mapeo de Roles** permite que el bot funcione con roles de Apex Legends que ya existen en tu servidor, sin importar cómo los hayas nombrado. El bot puede:

- ✅ Detectar automáticamente roles similares a los estándares de Apex
- ✅ Reconocer variantes comunes de nombres (español/inglés)
- ✅ Sugerir mapeos inteligentes usando algoritmo fuzzy
- ✅ Permitir confirmación manual antes de aplicar cambios
- ✅ Reutilizar roles existentes para evitar duplicados

---

## 🧠 Funcionamiento Interno

### 1. Detección Automática de Roles

Durante el comando `/setup-roles`, el bot ejecuta un **análisis completo de roles** del servidor:

```typescript
// Paso 1: Obtener todos los roles del servidor
const existingRoles = guild.roles.cache.map((role) => role.name);

// Paso 2: Buscar coincidencias con alias conocidos
const suggestions = suggestRoleMappings(guildId, existingRoles);

// Paso 3: Presentar sugerencias al usuario para confirmación
```

### 2. Sistema de Alias

El bot mantiene diccionarios de **alias conocidos** para cada rango y plataforma:

#### Alias de Rangos

```typescript
const RANK_ALIASES = {
  predator: ['Apex Predator', 'ApexPredator', 'Predator', 'Pred', 'apex predator'],
  grandmaster: ['Gran maestro', 'Gran Maestro', 'Granmaster', 'Grandmaster', 'Grand Master'],
  master: ['Maestro', 'Master'],
  diamond: ['Diamante', 'Diamond'],
  emerald: ['Esmeralda', 'Esmerald', 'Emerald'],
  platinum: ['Platino', 'Platinum'],
  gold: ['Oro', 'Gold'],
  silver: ['Plata', 'Silver'],
  bronze: ['Bronce', 'Bronze', 'bronce'],
  rookie: ['Rookie', 'Hierro', 'Iron', 'Principiante'],
};
```

#### Alias de Plataformas

```typescript
const PLATFORM_ALIASES = {
  switch: ['Nintendo Switch', 'NintendoSwitch', 'Switch', 'Nintendo'],
  ps4: ['PlayStation', 'PS', 'PS4', 'PS5', 'PSN'],
  pc: ['PC', 'Origin', 'Steam', 'EA'],
  xbox: ['Xbox', 'X1', 'XboxOne', 'Xbox One'],
};
```

### 3. Algoritmo de Coincidencia Fuzzy

Cuando no hay coincidencia exacta, el bot utiliza **distancia de Levenshtein** para calcular similitud:

```typescript
// Resumen de matchTermToRole en suggest-role-mapping.ts
const normalizedTerm = normalizeText(term);
const normalizedRole = normalizeText(roleName);

if (normalizedTerm === normalizedRole) {
  return { score: 1, matchType: 'exact' };
}

if (areAliases(term, roleName)) {
  return { score: 1, matchType: 'alias' };
}

const score = calculateNormalizedSimilarity(normalizedTerm, normalizedRole);
if (score < SIMILARITY_THRESHOLD) return null;

return { score, matchType: 'similar' };
```

`normalizeText` pasa a minúsculas, quita acentos y caracteres no alfanuméricos.
`calculateNormalizedSimilarity` devuelve `0.9` cuando un texto contiene al otro
y, en el resto de los casos, aplica distancia de Levenshtein.

**Umbral de similitud:** 70% (0.7)

### 4. Flujo de Búsqueda en Runtime

Cuando el bot necesita encontrar un rol durante el funcionamiento, el helper de
rangos usa un índice normalizado que se arma una vez por guild:

```typescript
function findRoleWithAliases(
  roleNameIndex: Map<string, string>,
  shortId: string,
  primaryName: string
): string {
  // 1. Intentar con el nombre mapeado en configuración
  const primaryRole = roleNameIndex.get(normalizeRoleName(primaryName));
  if (primaryRole) return primaryRole;

  // 2. Buscar entre los alias conocidos
  for (const alias of RANK_ALIASES[shortId] || []) {
    const roleName = roleNameIndex.get(normalizeRoleName(alias));
    if (roleName) return roleName;
  }

  // 3. Si no encuentra nada, devolver nombre primario
  return primaryName;
}
```

El helper de plataformas (`getApexPlatformsForGuild`) resuelve contra
`guild.roles.cache` porque no comparte el índice de rangos.

---

## 📋 Ejemplos de Uso

### Ejemplo 1: Servidor con Roles en Español

**Roles existentes en tu servidor:**

- 🥉 Bronce
- 🥈 Plata
- 🥇 Oro
- 💎 Diamante
- 🏆 Predator

**Proceso del bot:**

1. **Detección**: El bot analiza los roles del servidor
2. **Coincidencias**:
   - "Bronce" → 100% coincidencia con alias
   - "Plata" → 100% coincidencia con alias
   - "Oro" → 100% coincidencia con alias
   - "Diamante" → 100% coincidencia con alias
   - "Predator" → 100% coincidencia con alias
3. **Sugerencia**: Muestra vista previa de mapeos
4. **Confirmación**: Usuario acepta usar roles existentes
5. **Resultado**: Bot usa tus roles, no crea duplicados

### Ejemplo 2: Servidor con Nombres Personalizados

**Roles existentes en tu servidor:**

- 🔥 Elite Player
- ⚡ Pro Gamer
- 🌟 Apex Champion

**Proceso del bot:**

1. **Detección**: El bot analiza los roles del servidor
2. **Coincidencias**:
   - "Apex Champion" → no alcanza el umbral de similitud con "Apex Predator"
   - "Pro Gamer" → no se mapea
   - "Elite Player" → no se mapea
3. **Sugerencia**: No hay mapeos automáticos; el bot ofrece crear los roles
   estándar.
4. **Alternativa**: Agregar "Apex Champion" como alias o mapearlo manualmente en
   `server-config`.
5. **Resultado**: No se fuerza un mapeo incorrecto.

### Ejemplo 3: Servidor con Variaciones de Plataformas

**Roles existentes en tu servidor:**

- 🖥️ PC Gamers
- 🎮 PlayStation Players
- 🎮 Switch Users

**Proceso del bot:**

1. **Detección**: El bot analiza los roles de plataforma
2. **Coincidencias**:
   - "PlayStation Players" → contiene "PlayStation", 90% similitud
   - "Switch Users" → contiene "Switch", 90% similitud
   - "PC Gamers" → contiene "PC", 90% similitud
3. **Sugerencia**: Mapea las tres plataformas
4. **Confirmación**: Usuario acepta
5. **Resultado**: Bot usa roles personalizados para plataformas

---

## 🔧 Configuración Técnica

### Archivos de Configuración

Los mapeos se guardan en `db/server-config-{guildId}.json`:

```json
{
  "ranks": {
    "rookie": "Hierro",
    "bronze": "Bronce",
    "silver": "Plata",
    "gold": "Oro",
    "platinum": "Platino",
    "emerald": "Esmeralda",
    "diamond": "Diamante",
    "master": "Maestro",
    "grandmaster": "Gran maestro",
    "predator": "🏆 Predator",
    "pc": "PC Gamers",
    "ps4": "PS5 Players",
    "xbox": "Xbox",
    "switch": "Switch Users"
  },
  "excludedRoles": ["Moderador", "VIP"]
}
```

> `rookie` es la clave interna estable del rango Hierro/Rookie; se conserva para no romper jugadores, mapeos ni mensajes ya guardados. El ejemplo usa `Hierro` con `ENABLE_NEW_RANKS` habilitado; en esta versión el nombre activo es `Rookie`. Las claves `emerald` y `grandmaster` solo se usan con ese flag. `ENABLE_NEW_RANKS` es temporal y se elimina al cerrar el rollout. El bloque `ranks` también guarda los nombres de roles de plataforma (`pc`, `ps4`, `xbox`, `switch`), como lee `getApexPlatformsForGuild`.

### Migración Rookie → Hierro

El `shortId` interno `rookie` no cambia. Con `ENABLE_NEW_RANKS=false` el nombre
visible es `Rookie`; con `ENABLE_NEW_RANKS=true` es `Hierro`. Los alias
`Rookie`, `Principiante` e `Iron` se siguen aceptando para no romper servidores
existentes. El flag no renombra ni borra roles.

- **Solo existe `Rookie`**: no hace falta crear otro rol. El bot lo resuelve por
  alias. Para `ENABLE_NEW_RANKS=true`, renombrá el rol a `Hierro`; así se
  conservan ID y miembros.
- **Existen `Rookie` y el nombre activo a la vez**: el sync reporta la
  ambigüedad y no crea, renombra ni borra esos roles automáticamente. Unificá
  los miembros en un único rol y resolvé el duplicado de forma manual.
- **No existe ninguno**: cuando la creación está habilitada (arranque,
  reincorporación o rol nuevo), el sync crea el nombre activo (`Rookie` con
  `ENABLE_NEW_RANKS=false`, `Hierro` con `true`) si no hay un rol candidato.

> No crees un rol nuevo si todavía existe un `Rookie` con miembros: duplicaría
> el rango y dejaría a esos miembros fuera del panel.

### Rango canónico y multi-rango

El panel, `/show-my-rank`, el badge de avatares y `players_*.json` usan el
rango de mayor `tier` de `APEX_RANKS`. No usan el primer rol del cache ni
`role.position`.

- El autoservicio reemplaza los roles de rango anteriores al asignar uno nuevo.
- Un admin puede dejar roles extra; el sync no los borra y el panel muestra
  solo el mayor.
- El orden de los roles en Discord solo afecta asignación y permisos; el orden
  visual de los cards se decide por `tier`.

### Creación manual de roles

- Usá el nombre exacto del rango o un alias conocido; la resolución de rangos
  compara sin distinguir mayúsculas/minúsculas y también acepta alias.
- Ubicá los roles debajo del rol más alto del bot y en orden de `tier`
  (Predator arriba, Hierro/Rookie abajo).
- El sync solo reordena los roles cuando crea al menos uno; si todos existían,
  conserva las posiciones actuales.
- Si el bot no tiene `Gestionar roles`, podés crear los roles manualmente. El
  aviso lista los faltantes, pero el permiso sigue siendo necesario para que el
  autoservicio asigne o cambie roles.
- Los roles creados por el sync usan `colors.primaryColor` y `mentionable`.

### Funciones Principales

#### `getApexRanksForGuild(guildId, guild?)`

Retorna la lista de rangos con nombres de roles personalizados para un servidor
específico, ordenada por `tier` ascendente:

```typescript
const ranks = getApexRanksForGuild(guildId, guild);
// [
//   { shortId: 'rookie', tier: 1, roleName: 'Hierro', label: 'Hierro', ... },
//   { shortId: 'bronze', roleName: 'Bronce', label: 'Bronce', ... },
//   { shortId: 'silver', roleName: 'Plata', label: 'Plata', ... },
//   { shortId: 'gold', roleName: 'Oro', label: 'Oro', ... },
//   ...
//   { shortId: 'predator', roleName: '🏆 Predator', label: 'Apex Predator', ... },
// ]
```

#### `getApexPlatformsForGuild(guildId, guild?)`

Retorna la lista de plataformas con nombres de roles personalizados:

```typescript
const platforms = getApexPlatformsForGuild(guildId, guild);
// [
//   { shortId: 'pc', roleName: 'PC Gamers', label: 'PC', ... },
//   { shortId: 'ps4', roleName: 'PS5 Players', label: 'PlayStation', ... },
//   ...
// ]
```

#### `suggestRoleMappings(guildId, existingRoles)`

Genera sugerencias de mapeo basadas en roles existentes:

```typescript
const suggestions = suggestRoleMappings(guildId, existingRoles);
// {
//   'predator': '🏆 Predator',
//   'diamond': 'Diamante',
//   'ps4': 'PS5 Players',
//   ...
// }
```

#### `findRankRoleCandidate(rank, existingRoleNames, catalogRanks)`

Busca un rol existente que podría corresponder a un rango faltante, sin
modificar roles, configuración ni estado:

```typescript
const candidate = findRankRoleCandidate(rank, existingRoleNames, ranks);
// { roleName: 'Esmerald', matchType: 'alias', score: 1 } | null
```

Comparte el motor de normalización, aliases y umbral de `suggestRoleMappings`
(70 %). Reglas de desempate:

1. Mayor puntaje de similitud.
2. Exacto > alias > similar.
3. Nombre normalizado alfabéticamente.

Un empate devuelve un candidato, nunca `null`, para que el sync lo reporte en
lugar de crear un rol duplicado. Se ignoran el rol común `Apex` y los roles que
coinciden de forma exacta o por alias con otro rango (por ejemplo, `Maestro` no
se propone como candidato de `Gran maestro`).

---

## 🎨 Personalización

### Agregar Nuevos Alias

Todos los alias se definen en `src/models/constants-roles.ts`:

**Para rangos:** `RANK_ALIASES`

```typescript
const RANK_ALIASES: Record<string, string[]> = {
  predator: ['Apex Predator', 'Predator', 'Pred', 'Top Player'], // ← Agregar aquí
  // ...
};
```

**Para plataformas:** `PLATFORM_ALIASES`

```typescript
const PLATFORM_ALIASES: Record<string, string[]> = {
  ps4: ['PlayStation', 'PS', 'PS4', 'PS5', 'PSN', 'Sony'], // ← Agregar aquí
  // ...
};
```

**Para sugerencias:** `ROLE_ALIASES`

```typescript
const ROLE_ALIASES: Record<string, string[]> = {
  predator: ['apex predator', 'pred', 'top player'], // ← Agregar aquí (normalizado)
  // ...
};
```

> **⚠️ Importante**: Después de modificar, ejecuta `npm run build` para recompilar.

### Ajustar Umbral de Similitud

Para cambiar qué tan "parecidos" deben ser los nombres para considerarse coincidentes:

**Archivo:** `src/helpers/suggest-role-mapping.ts`

```typescript
export const SIMILARITY_THRESHOLD = 0.7; // 70% de similitud
// Valores más bajos = más permisivo (ej: 0.6 = 60%)
// Valores más altos = más estricto (ej: 0.8 = 80%)
```

---

## 🔍 Debugging y Solución de Problemas

### Ver Mapeos Actuales de un Servidor

```typescript
// En el código, puedes usar:
import { loadServerConfig } from './utils/server-config';

const config = loadServerConfig(guildId);
console.log('Mapeos actuales:', config.ranks);
```

### Forzar Re-mapeo

Si necesitas reconfigurar los mapeos:

1. Elimina el archivo `db/server-config-{guildId}.json`
2. Ejecuta `/setup-roles` nuevamente
3. El bot volverá a analizar y sugerir mapeos

### Registro de mapeos

El setup muestra las sugerencias en Discord y guarda los mapeos en
`db/server-config-{guildId}.json`. Los errores de los handlers se registran en
la consola y en los logs del bot; no hay un log específico por cada mapeo
individual.

### Problemas Comunes

#### "El bot no encuentra mi rol personalizado"

**Causa:** El nombre es muy diferente de los alias conocidos
**Solución:**

1. Agrega el nombre como alias en los archivos correspondientes
2. O usa un nombre más similar a los estándares durante el setup

#### "El bot sugiere mapeos incorrectos"

**Causa:** Umbral de similitud muy bajo
**Solución:**

1. Aumenta el `SIMILARITY_THRESHOLD` en `suggest-role-mapping.ts`
2. Rechaza las sugerencias durante el setup y deja que cree roles nuevos

#### "Cambié el nombre de un rol y el bot dejó de funcionar"

**Causa:** El mapeo en la configuración apunta al nombre antiguo
**Solución:**

1. Edita manualmente `db/server-config-{guildId}.json` con el nuevo nombre
2. O elimina el archivo y ejecuta `/setup-roles` para re-mapear

---

## 🔗 Archivos Relacionados

- **`src/helpers/get-apex-ranks-for-guild.ts`** - Sistema de alias para rangos
- **`src/helpers/get-apex-platforms-for-guild.ts`** - Sistema de alias para plataformas
- **`src/helpers/suggest-role-mapping.ts`** - Algoritmo de sugerencias
- **`src/utils/role-resolver.ts`** - Validación de roles mapeados
- **`src/configs/handlers/confirm-mappings.ts`** - Handler de confirmación de mapeos
- **`src/services/rank-sync/`** - Sincronización automática de roles y panel
- **`docs/RANK-SYNC.md`** - Flujo automático de sincronización

---

## 💡 Mejores Prácticas

1. **Usa nombres claros:** Aunque el bot reconoce variantes, nombres claros facilitan el mapeo
2. **Confirma siempre las sugerencias:** Revisa la vista previa antes de aceptar
3. **Mantén respaldos:** Guarda los archivos de configuración antes de cambios mayores
4. **Documenta personalizaciones:** Si agregas alias personalizados, documéntalos
5. **Prueba en servidor de desarrollo:** Antes de aplicar en producción

---

¿Tienes dudas sobre el sistema de mapeo? [Abre un issue](https://github.com/brauliorg12/discord-apex/issues) o únete a nuestro [servidor de Discord](https://discord.gg/ejemplo).
