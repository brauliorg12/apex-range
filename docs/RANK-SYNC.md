# Sincronización automática de rangos

Este documento describe el flujo que mantiene alineados el catálogo de rangos, los roles de Discord y el panel público sin ejecutar `/setup-roles`.

## Objetivo

- Detectar rangos nuevos, faltantes o renombrados.
- Crear los roles que falten solo cuando no exista un candidato y el bot tenga permisos.
- Reportar roles candidatos para adopción o mapeo con `/setup-roles`.
- Reconstruir el panel de rangos en el orden de `tier` del catálogo activo (Predator arriba, Hierro/Rookie abajo).
- Evitar cards duplicados.
- Avisar al canal de control/owner o al admin de la app según el problema.
- No tocar `players_*.json` desde el rank sync.

## Fuentes de verdad

| Dato | Fuente |
| --- | --- |
| Catálogo completo | `src/models/constants.ts` (`APEX_RANKS`) |
| Catálogo activo y flag | `src/models/rank-catalog.ts` (`ENABLE_NEW_RANKS`, `getActiveRanks`) |
| Alias de nombres de rol | `src/models/constants-roles.ts` |
| Mapeos por guild | `db/server-config-{guildId}.json` |
| IDs de mensajes | `.bot-state/{guildId}.json` |
| Roles reales | Discord |

## Cuándo se ejecuta

1. Al iniciar el bot, para cada guild cuyo `.bot-state` pueda leerse y tenga
   `guildId`.
2. Cuando el bot vuelve a un guild que ya tenía configuración.
3. Cuando se crea, renombra o elimina un rol, con debounce de 5 segundos.

Si `.bot-state` está corrupto o ilegible, el guild no se inicializa, no se
envía la bienvenida y el rank sync no se encola en ese arranque. La alerta de
infraestructura se emite en cada punto de entrada que detecta el problema
(arranque, reincorporación, eventos de rol y el propio rank sync) con throttle
por guild/archivo. Restaurar el archivo y reiniciar, o ejecutar
`/setup-roles`, recupera el flujo. Un archivo ausente es un skip normal y no
genera alerta.

En el arranque y al reincorporarse a un guild configurado, el rank sync se
encola recién cuando termina `synchronizePlayersWithRoles` para ese guild. Si
esa sincronización falla, el rank sync no reconstruye el panel, conserva el
panel anterior y reporta el error; nunca interpreta el fallo como un guild sin
jugadores. El arranque no espera al rank sync.

No hay tareas periódicas ni reintentos automáticos. Si un evento no se detecta, la próxima inspección ocurre con el próximo evento de rol relacionado (`GuildRoleCreate`, `GuildRoleUpdate` o `GuildRoleDelete`) o con el próximo arranque/reincorporación al guild.

## Flujo

### 1. Inspección

Para cada guild configurado:

- Se leen los roles reales y el estado persistido.
- Se resuelve cada rango con `getApexRanksForGuild`.
- Se comparan contra `RANK_ALIASES`.
- Se detecta:
  - rol faltante;
  - rol existente sin card;
  - card de un rango que ya no existe;
  - firma de catálogo distinta;
  - IDs de panel faltantes.

Si no hay diferencias, el flujo termina sin enviar mensajes.

### Mapeos personalizados

Si el servidor tiene un rol con otro nombre, por ejemplo `Verde`, y en
`server-config` está mapeado como:

```json
{
  "ranks": {
    "emerald": "Verde"
  }
}
```

el rango se resuelve como `Verde`, se considera existente y no se crea ningún
rol por defecto. Lo mismo aplica si el nombre coincide por alias o difiere solo
en mayúsculas/minúsculas.

Si el rol existe con un nombre arbitrario pero no está mapeado ni coincide con
un alias, el bot no puede asociarlo: lo reporta como faltante o como candidato
según la similitud detectada.

### Adopción de roles existentes

La adopción es manual y no cambia el nombre del rol:

- El sync nunca adopta, renombra ni borra un rol candidato por sí solo.
- Para adoptarlo, mapeá ese rol con `/setup-roles` o corregí el mapeo en
  `db/server-config-{guildId}.json`.
- Una vez mapeado, el sync reutiliza el rol existente y reconstruye el panel si
  corresponde.

La migración del rol legacy `Rookie` a `Hierro` cuando se habilite el rollout se detalla en
[ROLE-MAPPING.md](ROLE-MAPPING.md).

### 2. Roles faltantes

Antes de crear, el sync busca un rol existente que pueda corresponder al rango
por nombre exacto, alias o similitud. Si encuentra un candidato, no crea nada:
reporta el rango, el rol candidato y la acción `/setup-roles` para adoptarlo o
mapearlo. El panel no se reconstruye hasta que el rango quede resuelto.

Al iniciar, al reincorporarse a un guild o al detectar un rol nuevo, si no hay
candidato y el bot tiene `Gestionar roles` y jerarquía suficiente:

- crea los roles faltantes con nombre, `colors.primaryColor` y `mentionable`;
- los ubica debajo del rol más alto del bot con un único `setPositions`, en
  orden de `tier` (Predator arriba, Hierro/Rookie abajo);
- reordena solo cuando creó al menos un rol; si todos los roles ya existían,
  no mueve posiciones;
- los crea de a uno, sin tocar los roles existentes.

Si no puede crear un rol o hay un candidato pendiente:

- no reconstruye el panel;
- reporta el nombre del rango y el error o el candidato detectado;
- se evalúa de nuevo en el próximo arranque o evento de rol relacionado.

Si el bot no tiene `Gestionar roles`, el aviso lista los roles faltantes para
que un admin los cree manualmente. Los roles manuales deben usar el nombre
exacto o un alias reconocido, quedar debajo del rol del bot y respetar el orden
de `tier`. El permiso sigue siendo necesario para el autoservicio (asignar o
cambiar el rol de un usuario).

### 3. Reconstrucción del panel

Antes de construir el panel, el sync lee `players_*.json` con una variante
estricta y usa ese snapshot para los cards. Si el archivo no existe, se trata
como un guild sin jugadores. Si el JSON es inválido o el archivo no se puede
leer, el rebuild aborta sin borrar, enviar ni persistir nada y reporta el
error; el panel anterior queda intacto.

El sync construye los cards usando la lista de rangos ya inspeccionada. Si un
rol esperado desapareció entre la inspección y la construcción, o la cantidad
de cards no coincide, el rebuild aborta antes de enviar, borrar o persistir:
el panel anterior queda intacto y el error se reporta con la acción
`/setup-roles`. El setup conserva su flujo y no aplica esta validación.

El panel se reconstruye completo, nunca con cards sueltos:

1. Se construyen header, cards y panel de gestión en memoria.
2. Antes de enviar, se persiste `rankPanelRebuildInProgress` y la lista de IDs
   retirados en el journal.
3. Se envían los mensajes nuevos.
4. Si todos se enviaron bien, se persisten los IDs nuevos y el journal.
5. Se borran los mensajes viejos de a uno.
6. Si falla un envío, se borran los mensajes nuevos parciales y se conserva el
   panel viejo.
7. Si un borrado falla, el ID queda pendiente en `rankPanelRetiredMessageIds`.
   El próximo sync ejecuta la recuperación: reconstruye si el panel nuevo no
   quedó confirmado o solo limpia los retirados si ya está confirmado. Un ID
   activo nunca se borra.

Los cards se envían en el orden de `tier` (Predator arriba, Hierro/Rookie abajo). La
selección de rango y el mensaje de estadísticas no se tocan.

Los cambios de rol refrescan solo los cards de los rangos anterior y nuevo. Los
cambios de presencia se agrupan por guild y solo actualizan los cards afectados;
el resumen de estadísticas y la presencia global del bot quedan a cargo del
scheduler.

Los mensajes viejos se identifican por:

- `rankCardMessageIds`;
- `rankPanelHeaderMessageId`;
- `rankPanelManagementMessageId`;
- si faltan los dos últimos, se buscan por autor del bot y contenido del embed.

### 4. Notificación

El rank sync usa el canal de control del guild y, si no existe, DM al owner. No
publica en canales públicos.

La alerta de infraestructura (`src/utils/admin-alert.ts`) se dirige solo al
administrador de la app: escribe un log crítico y, si
`ADMIN_ALERT_WEBHOOK_URL` está definido, envía un resumen al webhook. No usa
canales del guild ni DM al owner. Si el arranque, la reincorporación, un evento
de rol o el rank sync detectan `.bot-state` inválido o ilegible, el flujo
aborta sin tocar roles, mensajes ni estado y el panel anterior queda intacto. Un
archivo ausente es un skip normal y no genera alerta.

La implementación actual cubre la lectura de `.bot-state` (`invalid`/`io-error`).
Los demás fallos locales, incluidos los de escritura, quedan en los logs y no
generan una alerta automática al admin en esta versión.

Política de destinatarios:

| Tipo de problema | Destino | Mensaje |
| --- | --- | --- |
| `.bot-state` corrupto o ilegible en arranque, reincorporación, evento de rol o sync | Admin de la app | Técnico, con guild/archivo/acción; sin secretos |
| Fallo de escritura de `.bot-state` | Solo log; se propaga al llamador | Sin alerta automática al admin en esta versión |
| Guild eliminada o inexistente | Solo log | No hay destinatario válido |
| Falta `Gestionar roles` o jerarquía | Canal de control / owner | Accionable, sin detalles internos |
| Canal del panel eliminado | Canal de control / owner | Accionable: recrear el canal o `/setup-roles` |
| Rol de rango faltante con candidato | Canal de control / owner | Accionable: mapear o adoptar con `/setup-roles` |
| Error inesperado de Discord | Canal de control / owner | Resumen accionable; stack solo en logs |
| Rate limit interno | Solo log | Discord.js ya gestiona reintentos |

El reporte que recibe el canal de control o el owner incluye:

- roles creados, indicando que faltaban en el servidor;
- roles candidatos detectados y la acción `/setup-roles` para adoptarlos o mapearlos;
- roles faltantes y qué permiso o jerarquía revisar;
- si el panel fue reconstruido;
- avisos accionables y un resumen de errores.

Los detalles técnicos (mensajes crudos de excepción, rutas y stack traces)
quedan solo en los logs. El aviso de Discord muestra la acción posible para el
guild: revisar permisos, recrear el canal del panel, mapear un rol o contactar
al administrador de la app.

La corrupción de `.bot-state` nunca se envía al owner ni al canal de control.

Deduplicación y frecuencia:

- La huella del reporte se marca como entregada recién después de una entrega
  exitosa. Un reporte idéntico por guild no se repite dentro de 30 minutos; si
  cambia el conjunto de roles, candidatos, avisos o errores, se notifica de
  inmediato.
- Si fallan el canal de control y el DM al owner, la huella no queda marcada y
  el reporte se reintenta con backoff corto de 1 a 5 minutos. El detalle técnico
  queda solo en los logs.
- Los roles creados por el sync suprimen su evento `GuildRoleCreate` durante 60
  segundos para evitar sincronizaciones en cadena. Los renombrados manuales no
  se suprimen por ID de rol.
- La alerta al admin de la app se limita a una por guild/archivo cada 60 minutos.
  Si el webhook falla, se reintenta a los 5 minutos sin duplicar el throttle.
- El estado de deduplicación y el throttle se liberan al eliminar la guild.
  La supresión de un rol creado por el sync expira sola a los 60 segundos.

## Rango canónico y multi-rango

El rango visible se decide por el `tier` del catálogo activo; el orden de los roles
en Discord (`role.position`) solo afecta asignación y permisos.

- Un miembro con varios roles de rango aparece solo en el card de su `tier` más
  alto. El panel no lo duplica.
- `/show-my-rank`, el badge del card de avatares y `players_*.json` usan el
  mismo rango de mayor `tier`.
- El autoservicio quita los roles de rango anteriores al asignar uno nuevo. Un
  admin puede dejar roles extra; el sync no los borra y el panel sigue
  mostrando solo el mayor.

## Jugadores y sincronización

`players_*.json` es el registro global de jugadores.
`synchronizePlayersWithRoles` es la única pasada de reconciliación:

- agrega jugadores cacheados con rango y actualiza el `rank` al de mayor `tier`;
- preserva `assignedAt`;
- para un miembro cacheado sin rol deja `rank: ''` sin borrar el registro;
- para un miembro fuera de caché no toca su registro;
- nunca elimina jugadores: quitar un rango es una acción explícita
  (`confirm-remove-rank`);
- usa `readPlayersStrict`/`mutatePlayers`; si el archivo es inválido o ilegible
  aborta sin sobrescribir;
- usa `'PC'` como plataforma inicial documentada para altas nuevas.

La caché de Discord es una vista parcial y no es autoridad para borrar. Un
jugador desconectado o fuera de caché conserva su registro y su rango.

## Persistencia de `.bot-state`

- Las escrituras son atómicas: archivo temporal en el mismo directorio y
  `rename`; si el `rename` falla, se registra y se reintenta con escritura
  directa.
- El lock por guild serializa las escrituras y evita que dos actualizaciones se
  pisen.
- `updateRolesState` lee, aplica solo los campos indicados y preserva
  `apexStatus`, `botControl`, firmas y journal.
- Si la lectura es `invalid` o `io-error`, no se sobrescribe el archivo: se
  alerta al admin de la app y se propaga el error.
- Los writers de jugadores usan `mutatePlayers` con la misma atomicidad y lock;
  solo escriben si hubo cambios.

## Estadísticas y presencia

- El total de jugadores registrados sale de `players_*.json`, filtrando rangos
  activos.
- Los jugadores online se cuentan desde la caché de Discord y la presencia.
- No se usa `guild.members.fetch()` completo; eso evita los rate limits `opcode 8`
  y las esperas del gateway.
- Si `players_*.json` no se puede leer, el total cae al conteo de miembros
  cacheados con rango y se registra un warning.

## Firmas y fingerprints

Son tres conceptos distintos:

| Concepto | Función | Inputs | Propósito | Invalidación y limpieza |
| --- | --- | --- | --- | --- |
| Firma del catálogo | `getRankCatalogSignature` | `shortId`, `tier`, `id`, `label`, `roleName`, `icon` y `color` del catálogo activo | Detectar cambios de catálogo y reconstruir el panel | Cambia cuando cambia la firma; se persiste en `.bot-state` |
| Huella de notificaciones | `buildReportFingerprint` | roles creados, faltantes, candidatos, avisos y errores normalizados | Evitar reportes idénticos repetidos | No se marca hasta una entrega exitosa; se libera en `GuildDelete` |
| Fingerprint de cards | `buildCardFingerprint` | `messageId`, `embed.toJSON()`, componentes y nombres de adjuntos | Omitir `message.edit` si el contenido visible no cambió | Se invalida al cambiar el `messageId`, reconstruir el panel o eliminar la guild; la caché se acota a 32 entradas por guild |

El fingerprint de cards incluye presencia, plataforma, roles/banderas, nombre
visible, total y página porque compara el embed completo. No es una caché de
imágenes: solo decide si hace falta editar el mensaje. Setup, rebuild,
reincorporación/recuperación y el primer render fuerzan la edición; un fallo de
edición elimina la entrada para permitir reintento.

## Interacciones y trabajo pesado

Los botones “Ver más” y la paginación de rangos se reconocen antes de generar la
card. La respuesta sigue siendo **efímera y solo para el usuario**; no se crea un
mensaje público ni se modifica el panel persistente.

- La generación de cards, canvas y lecturas pesadas pasa por una cola serial.
- Si hay un refresco de fondo en curso, la card efímera espera su turno, pero la
  interacción ya fue reconocida y no expira.
- Una interacción expirada (`10062`) se registra y se ignora; no tumba el
  proceso.
- La cola de guilds procesa un servidor a la vez para proteger la CPU.

## Logs y `/instance`

- Al iniciar se registra la versión, la cantidad de guilds y la cantidad de
  rangos activos.
- `state-files` registra inicio, éxito, fallback y error de `.bot-state` con
  guild y nombres de campos; nunca valores del estado.
- El panel registra sus fases (envío, persistencia, borrado) y los cards dejan un
  solo contador agregado por refresco (`editados`/`omitidos`).
- Los errores/timeouts de canvas siguen en los logs de canvas, con un resumen
  por card.
- `/health` responde `OK`.
- `/instance` devuelve `uptime`, `version`, `timestamp` y `lastAdminAlert` con
  solo `emittedAt`, `errorType` y `webhookDelivered`. No expone guild ID/nombre,
  archivos, tokens, stack traces ni datos de jugadores.

## Roles creados o modificados manualmente

### El admin crea un rol

- El evento `GuildRoleCreate` agenda un sync.
- Si el nombre coincide con un rango o alias, el panel se actualiza.
- Si no coincide, no se asocia automáticamente; el aviso reporta los rangos que sigan faltantes.
- Si quedan otros rangos faltantes y el bot tiene permisos, también los crea.
- Los roles creados por el propio sync se marcan temporalmente para ignorar sus eventos y evitar sincronizaciones en cadena.

### El admin renombra un rol

- El evento `GuildRoleUpdate` agenda un sync.
- Si el nuevo nombre coincide con un alias, se actualiza el panel.
- Si el mapeo queda roto, se avisa.

### El admin elimina un rol

- El evento `GuildRoleDelete` avisa al canal de control o al owner.
- No se recrea en el momento para no pelear con una decisión manual.
- En el próximo arranque, si sigue faltando, el sync puede recrearlo.

## Sin reintentos automáticos

Cada evento o arranque ejecuta una sola inspección y, si corresponde, una sola reconstrucción.

Si una llamada a Discord falla, se reporta el error y no se repite en loop. La próxima oportunidad es el próximo evento de rol relacionado o el próximo arranque. Discord.js sigue manejando internamente los `429` de rate limit, pero el bot no agrega reintentos propios.

## Notas del catálogo

- `rookie` es la clave interna estable del rango Hierro/Rookie.
- Gran maestro y Predator comparten el emoji actual de Predator.
- Hierro usa el mismo emoji que Rookie hasta que se defina uno nuevo.

## Modo legacy del catálogo

`ENABLE_NEW_RANKS` es una constante de código fija en `false` en esta versión.
No se configura por entorno. Para habilitar Esmeralda/Gran maestro hace falta
una versión autorizada con la constante en `true`.

- `false`: oculta Esmeralda y Gran maestro, muestra `rookie` como `Rookie` y no
  crea esos roles.
- `true`: habilita Hierro, Esmeralda y Gran maestro.
- La única fuente es `getActiveRanks()`; cards, panel, botones, setup, roles,
  progresión de `/apex-status`, firmas y resolución de rango la consumen.
- El flag no borra roles ni jugadores. Un rol oculto existente se conserva; un
  jugador con solo ese rol mantiene su registro.
- Los mapeos existentes de `server-config` tienen prioridad y no se reescriben;
  `rookie` puede seguir mapeado a `Rookie`, `Hierro` o `Principiante`.
- Cambiar la constante cambia la firma del catálogo y fuerza la reconstrucción
  del panel.
- `ENABLE_NEW_RANKS` es temporal. Al cerrar el rollout, eliminar el flag,
  `LEGACY_ROOKIE_LABEL`, `buildActiveRanks` y `getAllRanks` del código, JSDoc y
  documentación; `getActiveRanks` debe quedar como acceso al catálogo completo.

## Datos que no se tocan

- `players_*.json`: el rank sync solo lo lee. La reconciliación masiva la hace
  `synchronizePlayersWithRoles`; las acciones explícitas de rango o plataforma
  también modifican el registro.
- Roles existentes: no se renombran ni se borran.
- `server-config`: el rank sync no lo escribe.
- Mensajes de usuarios: nunca se borran.

## Límites conocidos y comportamiento esperado

### Re-ejecución de `/setup-roles`

El setup existente guarda `rankCardMessageIds: {}` antes de reconstruir el
panel. La limpieza previa solo borra los mensajes de selección de rango y
estadísticas, no los cards, el header ni el panel de gestión. Como los IDs
viejos se pierden, esos mensajes pueden quedar duplicados en el canal.

- El flujo recomendado es dejar que `rank-sync` mantenga el panel.
- Si se ejecuta `/setup-roles` de nuevo, conviene borrar manualmente los cards,
  el header y el panel de gestión viejos.
- No se modificó el setup para evitar cambiar su comportamiento actual.

### Eliminación manual de mensajes del panel

No hay listener de `MessageDelete` ni validación de existencia en el rank sync.

- El sync compara IDs persistidos, no si el mensaje existe en Discord. Si se
  borra un card, header o mensaje de gestión, puede no detectarlo y no
  reconstruir el panel aunque se ejecute.
- `/cleanup-state` verifica los IDs persistidos y elimina las referencias
  inválidas. Después de ejecutarlo, el próximo arranque o evento de rol
  relacionado detecta cards o IDs faltantes y reconstruye el panel.
- `/setup-roles` también reconstruye el panel, con la advertencia de duplicados
  de la sección anterior.
- Se decidió no agregar un listener de mensajes para evitar eventos y consultas
  innecesarias.

### Eliminación de un rol de rango

El evento `GuildRoleDelete` notifica al canal de control o al owner.

- No se recrea el rol en el momento para no pelear con una decisión manual.
- No se reconstruye el panel en ese evento.
- Si el rol sigue faltando, el próximo arranque puede recrearlo y reconstruir el panel.
- Hasta la próxima reconstrucción, el panel puede conservar el card del rango eliminado.

### Ambigüedad Rookie / Hierro / Principiante

El `shortId` `rookie` conserva el nombre visible `Rookie` en esta versión y
`Hierro` cuando se habilite el rollout. Los alias `Rookie`, `Principiante` e
`Iron` se siguen aceptando para no romper datos existentes.

- Si solo existe uno de los roles, el rango se resuelve normalmente y el sync
  no crea otro.
- Si existen `Rookie` y el nombre activo al mismo tiempo, el panel usa el rol
  primario y los miembros del rol legacy quedan fuera. El sync detecta la
  ambigüedad, la reporta en los avisos y no crea, renombra ni borra ninguno de
  esos roles automáticamente.
- Migración recomendada: con `ENABLE_NEW_RANKS=true`, renombrá el rol `Rookie` a
  `Hierro` para conservar el ID y los miembros; no crees un rol nuevo. Si ambos
  ya existen, unificá los miembros en un único rol y resolvé el duplicado de
  forma manual.

### Creación de roles duplicada

La creación de roles está implementada en dos lugares:

- `src/services/rank-sync/rank-roles.ts` para el flujo automático;
- `src/configs/handlers/create-missing-roles.ts` y
  `src/configs/handlers/proceed-create-roles.ts` para el setup.

La creación automática y el setup conservan rutas separadas: el rank sync crea
los roles faltantes sin modificar el flujo guiado de setup. Cualquier
unificación requiere una tarea de refactor aparte.

### Validación

- La compilación, los tests automatizados y la prueba en staging se realizan
  antes de un despliegue general.
- Este documento describe el comportamiento esperado; no reemplaza esa
  validación.

## Archivos

```text
src/services/rank-sync/
  rank-sync.ts
  rank-sync-queue.ts
  rank-catalog.ts (barrel)
  rank-catalog-*.ts
  rank-roles.ts
  rank-roles-types.ts
  rank-role-detection.ts
  rank-role-order.ts
  rank-panel.ts (barrel)
  rank-panel-*.ts
  rank-notify.ts (barrel)
  rank-notify-*.ts
  rank-events.ts
  rank-event-state.ts
```

Relacionados: `src/models/rank-catalog.ts` (modo legacy y catálogo activo),
`src/utils/admin-alert*.ts` (alertas de infraestructura),
`src/utils/message-cleanup.ts` (`/cleanup-state`), `src/utils/update-status-message.ts`
(refresco del panel), `src/utils/heavy-task-queue.ts` (trabajo serial de cards),
`src/helpers/refresh-rank-cards.ts` y `src/helpers/rank-card-fingerprint.ts`
(cards y fingerprint).

Los módulos del feature mantienen el límite de 250 líneas por archivo. La
separación por responsabilidad incluye listado, paginación, cards online,
avatares recientes y roles; los módulos resultantes también quedan por debajo
del límite. Ver [CODE-STYLE.md](CODE-STYLE.md#tamaño-de-archivo).
