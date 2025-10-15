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
  predator: ['Apex Predator', 'ApexPredator', 'Predator', 'Pred'],
  master: ['Maestro', 'Master'],
  diamond: ['Diamante', 'Diamond'],
  platinum: ['Platino', 'Platinum'],
  gold: ['Oro', 'Gold'],
  silver: ['Plata', 'Silver'],
  bronze: ['Bronce', 'Bronze', 'bronce'],
  rookie: ['Rookie'],
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
function stringSimilarity(str1: string, str2: string): number {
  // 1. Normalizar texto (minúsculas, sin acentos)
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  // 2. Verificar coincidencia exacta
  if (s1 === s2) return 1.0;

  // 3. Verificar si son alias conocidos
  if (areAliases(str1, str2)) return 1.0;

  // 4. Verificar si uno contiene al otro
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // 5. Calcular distancia de Levenshtein
  const distance = levenshteinDistance(s1, s2);
  return (longer.length - distance) / longer.length;
}
```

**Umbral de similitud:** 70% (0.7)

### 4. Flujo de Búsqueda en Runtime

Cuando el bot necesita encontrar un rol durante el funcionamiento:

```typescript
function findRoleWithAliases(
  guild: Guild,
  shortId: string,
  primaryName: string
): string {
  // 1. Intentar con el nombre mapeado en configuración
  const primaryRole = guild.roles.cache.find((r) => r.name === primaryName);
  if (primaryRole) return primaryName;

  // 2. Buscar entre los alias conocidos
  const aliases = RANK_ALIASES[shortId] || [];
  for (const alias of aliases) {
    const role = guild.roles.cache.find((r) => r.name === alias);
    if (role) return role.name;
  }

  // 3. Si no encuentra nada, devolver nombre primario
  return primaryName;
}
```

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
   - "Apex Champion" → 75% similitud con "Apex Predator"
   - "Pro Gamer" → Baja similitud, no se mapea
   - "Elite Player" → Baja similitud, no se mapea
3. **Sugerencia**: Solo sugiere mapear "Apex Champion" → "Apex Predator"
4. **Confirmación**: Usuario acepta la sugerencia
5. **Creación**: Bot crea roles faltantes con nombres estándar

### Ejemplo 3: Servidor con Variaciones de Plataformas

**Roles existentes en tu servidor:**

- 🖥️ PC Gamers
- 🎮 PS5 Players
- 🎮 Switch Users

**Proceso del bot:**

1. **Detección**: El bot analiza los roles de plataforma
2. **Coincidencias**:
   - "PS5 Players" → Contiene "PS5", 90% similitud con "PlayStation"
   - "Switch Users" → Contiene "Switch", 90% similitud con "Nintendo Switch"
   - "PC Gamers" → Contiene "PC", 90% similitud con "PC"
3. **Sugerencia**: Mapea las tres plataformas
4. **Confirmación**: Usuario acepta
5. **Resultado**: Bot usa roles personalizados para plataformas

---

## 🔧 Configuración Técnica

### Archivos de Configuración

Los mapeos se guardan en `db/server-config-{guildId}.json`:

```json
{
  "guildId": "1234567890123456789",
  "ranks": {
    "predator": "🏆 Predator",
    "master": "Maestro",
    "diamond": "Diamante",
    "platinum": "Platino",
    "gold": "Oro",
    "silver": "Plata",
    "bronze": "Bronce",
    "rookie": "Rookie",
    "switch": "Switch Users",
    "ps4": "PS5 Players",
    "pc": "PC Gamers",
    "xbox": "Xbox"
  },
  "excludedRoles": ["Moderador", "VIP"],
  "setupCompleted": true
}
```

### Funciones Principales

#### `getApexRanksForGuild(guildId, guild?)`

Retorna la lista de rangos con nombres de roles personalizados para un servidor específico:

```typescript
const ranks = getApexRanksForGuild(guildId, guild);
// [
//   { shortId: 'predator', roleName: '🏆 Predator', label: 'Apex Predator', ... },
//   { shortId: 'master', roleName: 'Maestro', label: 'Master', ... },
//   ...
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

---

## 🎨 Personalización

### Agregar Nuevos Alias

Para agregar nuevos alias reconocidos, edita los archivos:

**Para rangos:** `src/helpers/get-apex-ranks-for-guild.ts`

```typescript
const RANK_ALIASES: Record<string, string[]> = {
  predator: ['Apex Predator', 'Predator', 'Pred', 'Top Player'], // ← Agregar aquí
  // ...
};
```

**Para plataformas:** `src/helpers/get-apex-platforms-for-guild.ts`

```typescript
const PLATFORM_ALIASES: Record<string, string[]> = {
  ps4: ['PlayStation', 'PS', 'PS4', 'PS5', 'PSN', 'Sony'], // ← Agregar aquí
  // ...
};
```

**Para sugerencias:** `src/helpers/suggest-role-mapping.ts`

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
const SIMILARITY_THRESHOLD = 0.7; // 70% de similitud
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

### Logs de Mapeo

El bot registra todas las operaciones de mapeo en los logs:

```
[2025-10-03T10:00:00.000Z] [App] Sugerencias de mapeo generadas para servidor 123456
[2025-10-03T10:00:01.000Z] [App] Mapeo confirmado: predator → 🏆 Predator
[2025-10-03T10:00:02.000Z] [App] Rol "Diamante" encontrado para shortId diamond
```

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

## 📊 Métricas de Rendimiento

| Operación                 | Tiempo Típico | Cache |
| ------------------------- | ------------- | ----- |
| Análisis de roles         | < 100ms       | No    |
| Generación de sugerencias | < 200ms       | No    |
| Búsqueda con alias        | < 10ms        | Sí    |
| Carga de configuración    | < 50ms        | Sí    |

---

## 🔗 Archivos Relacionados

- **`src/helpers/get-apex-ranks-for-guild.ts`** - Sistema de alias para rangos
- **`src/helpers/get-apex-platforms-for-guild.ts`** - Sistema de alias para plataformas
- **`src/helpers/suggest-role-mapping.ts`** - Algoritmo de sugerencias
- **`src/utils/role-resolver.ts`** - Utilidades de resolución de roles
- **`src/configs/handlers/confirm-mappings.ts`** - Handler de confirmación de mapeos

---

## 💡 Mejores Prácticas

1. **Usa nombres claros:** Aunque el bot reconoce variantes, nombres claros facilitan el mapeo
2. **Confirma siempre las sugerencias:** Revisa la vista previa antes de aceptar
3. **Mantén respaldos:** Guarda los archivos de configuración antes de cambios mayores
4. **Documenta personalizaciones:** Si agregas alias personalizados, documéntalos
5. **Prueba en servidor de desarrollo:** Antes de aplicar en producción

---

¿Tienes dudas sobre el sistema de mapeo? [Abre un issue](https://github.com/brauliorg12/discord-apex/issues) o únete a nuestro [servidor de Discord](https://discord.gg/ejemplo).
