# Convenciones de código

Este documento complementa las reglas del proyecto para que las próximas
sesiones mantengan el mismo estilo sin tener que inferirlo del código.

## Reglas generales

- 2 espacios, comillas simples y punto y coma.
- Nombres de variables, funciones y tipos en inglés.
- Documentación y mensajes en español.
- JSDoc completo en funciones, métodos, interfaces y campos nuevos.
- Sin `any` nuevo: usar `unknown` y type guards.
- Funciones pequeñas, con una responsabilidad y nombres explícitos.
- Reutilizar helpers existentes; no duplicar lógica.
- Sin código muerto, exports sin consumidores ni campos que nadie lea.

## Tamaño de archivo

El objetivo es mantener cada archivo en 250 líneas o menos, incluido el JSDoc.

- Si un archivo supera las 250 líneas, dividirlo por responsabilidad antes de
  agregar lógica nueva.
- Si no se puede dividir, justificarlo en el PR con el motivo y el riesgo.
- Al dividir, conservar el JSDoc de los símbolos movidos y aplicar `#region` en
  los módulos que superen el umbral de la sección Regiones.
- Dividir por responsabilidad y cohesión; no fragmentar una unidad cohesiva en
  archivos de una sola función.
- El límite no se aplica retroactivamente a archivos ajenos al feature de
  rangos sin una tarea aparte.
- Los módulos de listado, paginación, cards online, avatares recientes y roles
  están divididos por responsabilidad. Los archivos resultantes
  (`player-list-ranked.ts`, `player-list-normal.ts`,
  `player-pagination-line.ts`, `player-pagination-controls.ts`,
  `online-embed-buttons.ts`, `online-embed-members.ts`,
  `recent-avatars-draw.ts`, `recent-avatars-avatar.ts`,
  `rank-roles-types.ts`, `rank-role-detection.ts` y `rank-role-order.ts`)
  quedan por debajo de 250 líneas.

## Regiones

Las regiones son marcas de navegación para archivos grandes. No reemplazan la
separación en módulos ni justifican mezclar responsabilidades.

### Sintaxis

```ts
// #region Nombre

// ...

// #endregion
```

- Cada `#region` debe tener su `#endregion`.
- No se permiten regiones anidadas.
- No se agregan números, emojis ni prefijos al nombre.
- El nombre va en español y en formato Título (primera letra mayúscula).
- El nombre debe describir la responsabilidad de la sección, no una función
  puntual.

### Cuándo usarlas

Usar regiones cuando el archivo cumpla al menos una condición:

- tenga 200 líneas o más;
- tenga 4 o más secciones lógicas con responsabilidades distintas.

No usar regiones en archivos pequeños o de una sola responsabilidad (menos de
150 líneas), salvo que ya formen parte de un módulo que las usa por consistencia.

Al aplicar o mover una región no se debe cambiar la lógica ni reordenar código
fuera de lo necesario. Si un archivo necesita demasiadas regiones, evaluar su
división en módulos.

### Nombres y orden permitidos

Usar un subconjunto de esta lista, respetando el orden relativo. No se permite
volver a una región anterior dentro del mismo archivo.

| Orden | Región | Uso |
| --- | --- | --- |
| 1 | `Tipos` | Interfaces, type aliases y uniones. |
| 2 | `Constantes` | Constantes del módulo. |
| 3 | `Estado` | Estado en memoria, locks, caches y throttle. |
| 4 | `Cola` | Cola de trabajos y control de concurrencia. |
| 5 | `Archivos de estado` | Rutas y helpers de archivos de estado. |
| 6 | `Estado de roles` | Lectura y escritura del estado de roles. |
| 7 | `Estado de Apex` | Lectura y escritura del estado de Apex. |
| 8 | `Canal de control` | Lectura y escritura del canal de control. |
| 9 | `Jugadores` | Lectura, escritura y locks de jugadores. |
| 10 | `Helpers` | Helpers privados sin estado propio. |
| 11 | `Ordenamiento` | Ordenamiento de miembros o datos. |
| 12 | `Catálogo` | Firma y normalización del catálogo. |
| 13 | `Inspección` | Comparación de catálogo, roles y panel. |
| 14 | `Candidatos` | Detección de roles candidatos. |
| 15 | `Detección` | Clasificación de rangos faltantes. |
| 16 | `Provisión` | Creación de roles faltantes. |
| 17 | `Reporte` | Construcción y deduplicación del reporte. |
| 18 | `Builders` | Construcción de embeds, cards y paneles. |
| 19 | `Miembros` | Colección de miembros para los builders. |
| 20 | `Envío` | Envío de mensajes del panel. |
| 21 | `Limpieza` | Borrado de mensajes viejos. |
| 22 | `Persistencia` | Persistencia del estado del panel. |
| 23 | `Reconstrucción` | Orquestación del rebuild del panel. |
| 24 | `Canal del panel` | Resolución del canal del panel. |
| 25 | `Webhook` | Envío a webhooks de infraestructura. |
| 26 | `Notificación` | Avisos al canal de control u owner. |
| 27 | `Orquestación` | Flujo principal del sync. |
| 28 | `API pública` | Funciones exportadas de entrada. |

Si hace falta un nombre nuevo, primero actualizar esta tabla. No inventar
regiones ad hoc.

### Módulos exentos

Dentro de `src/services/rank-sync/`, los módulos de una sola responsabilidad
que quedan por debajo del umbral no usan regiones; los que superan las 200
líneas o tienen cuatro o más secciones sí las usan.

Ejemplos actuales: no usan regiones `rank-events.ts`, `rank-event-state.ts`,
`rank-catalog*.ts`, `rank-notify-types.ts`, `rank-notify-embed.ts`,
`rank-notify-delivery.ts`, `rank-sync-report.ts`, `rank-roles.ts`,
`rank-roles-types.ts`, `rank-role-detection.ts`, `rank-role-order.ts` ni los
barrels. Usan regiones `rank-sync.ts`, `rank-sync-queue.ts`,
`rank-notify-fingerprint.ts` y `rank-panel-cleanup.ts`.

Fuera de `rank-sync`, aplica la misma regla: `message-cleanup.ts` y
`recent-avatars-items.ts` usan regiones por superar el umbral. La lista es
orientativa y se revisa al dividir o mover módulos.

## Referencias

- [RANK-SYNC.md](RANK-SYNC.md): flujo de sincronización de rangos.
- [WORKFLOW.md](../WORKFLOW.md): ramas, commits y releases.
