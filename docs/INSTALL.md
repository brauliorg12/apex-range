# Instalación y Configuración

Esta guía proporciona instrucciones detalladas para instalar y configurar Apex Legends Rank Bot en tu servidor.

## 🚀 Instalación Rápida

### 1. Clona el repositorio

```bash
git clone https://github.com/brauliorg12/apex-range.git
cd apex-range
```

### 2. Instala dependencias

```bash
npm install
```

### 3. Configura el archivo `.env`

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
# Variables Obligatorias
DISCORD_TOKEN=TU_TOKEN_DEL_BOT
CLIENT_ID=TU_CLIENT_ID

# Variables Internas (Opcionales)
API_URL=http://localhost:3001/health
HEALTH_PORT=3001

# API externa
MOZA_API_KEY=TU_API_KEY_DE_MOZAMBIQUE
MOZA_URL=https://api.mozambiquehe.re

# Alertas de infraestructura (opcional)
ADMIN_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Imagen inicial del panel (opcional; vacío = sin imagen)
# En Docker: /app/assets/imgs/init.png
INIT_IMAGE_PATH=
```

### 4. Compila el proyecto

```bash
npm run build
```

### 5. Despliega los comandos

```bash
npm run deploy-commands
```

### 6. Ejecuta el bot

```bash
npm run dev
```

> **Nota**: Para instrucciones detalladas y configuración avanzada, continúa leyendo esta guía.

## ⚙️ Instalación y Configuración

### 1. Clona el repositorio

```bash
git clone https://github.com/brauliorg12/apex-range.git
cd apex-range
```

### 2. Instala dependencias

```bash
npm install
```

### 3. Configura el archivo `.env`

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
# Variables Obligatorias
DISCORD_TOKEN=TU_TOKEN_DEL_BOT
CLIENT_ID=TU_CLIENT_ID

# Variables Internas (Opcionales)
API_URL=http://localhost:3001/health
HEALTH_PORT=3001

# API externa
MOZA_API_KEY=TU_API_KEY_DE_MOZAMBIQUE
MOZA_URL=https://api.mozambiquehe.re

# Alertas de infraestructura (opcional)
ADMIN_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Imagen inicial del panel (opcional; vacío = sin imagen)
# En Docker: /app/assets/imgs/init.png
INIT_IMAGE_PATH=
```

### Variables de Entorno Detalladas

| Variable         | Descripción                  | Requerida | Ejemplo                        |
| ---------------- | ---------------------------- | --------- | ------------------------------ |
| `DISCORD_TOKEN`  | Token del bot de Discord     | ✅        | `XXXXXXXXX`                    |
| `CLIENT_ID`      | ID de la aplicación Discord  | ✅        | `XXXXXXXXX`                    |
| `API_URL`        | URL del health check interno | ❌        | `http://localhost:3001/health` |
| `HEALTH_PORT`    | Puerto del servidor de salud | ❌        | `3001`                         |
| `MOZA_API_KEY`   | API Key de Mozambique        | ❌        | `XXXXXXXXX`                    |
| `MOZA_URL`       | URL de la API de Mozambique  | ❌        | `https://api.mozambiquehe.re`  |
| `ADMIN_ALERT_WEBHOOK_URL` | Webhook para alertas de infraestructura | ❌ | `https://discord.com/api/webhooks/...` |
| `BOT_OWNER_ID`   | ID del owner del bot         | ❌        | `123456789012345678`           |
| `INIT_IMAGE_PATH` | Ruta de `init.png` dentro del contenedor o del proyecto. Vacío = sin imagen | ❌ | `/app/assets/imgs/init.png` |

> **Nota**: Las variables específicas de servidor (como IDs de canales) ya no son necesarias ya que el bot las guarda automáticamente por servidor.

### Imagen inicial del panel

`INIT_IMAGE_PATH` es opcional. Si no se define, el panel de rangos se muestra
sin imagen. El archivo debe ser PNG, pesar menos de 8 MB y estar disponible en
la ruta configurada.

En Docker o Portainer se monta la carpeta de assets como solo lectura:

```yaml
environment:
  INIT_IMAGE_PATH: /app/assets/imgs/init.png

volumes:
  - ${APEX_ASSETS_DIR}:/app/assets/imgs:ro
```

El bot lee la imagen desde el mount y la envía como adjunto de Discord. No
necesita una URL pública y la imagen no se copia a la imagen Docker. Si el
archivo se reemplaza en el host, el próximo refresco lo detecta sin reconstruir
el contenedor.

Para desarrollo local alcanza con:

```env
INIT_IMAGE_PATH=assets/imgs/init.png
```

En esta versión `ENABLE_NEW_RANKS` está fijo en `false` por código: Esmeralda y
Gran maestro no se publican, `rookie` se muestra como Rookie y no se crean esos
roles. No se configura por variable de entorno. No borra roles ni jugadores y
respeta los mapeos de `server-config`. `ENABLE_NEW_RANKS` es temporal y se
habilita o elimina mediante una versión autorizada.

`ADMIN_ALERT_WEBHOOK_URL` es opcional. Si está definido, el bot envía allí un
resumen de alertas de infraestructura, como `.bot-state` corrupto o ilegible
detectado en el arranque, la reincorporación, un evento de rol o el rank sync.
No se envían tokens, stack traces ni datos de jugadores. Sin esta variable, la
alerta queda solo en el log crítico. Un fallo de escritura de `.bot-state` se
registra y se propaga, pero no genera esta alerta en esta versión. Ver
[RANK-SYNC.md](RANK-SYNC.md#4-notificación).

### 4. Compila el proyecto

```bash
npm run build
```

### 5. Despliega los comandos

```bash
npm run deploy-commands
```

### 6. Ejecuta el bot

```bash
npm run dev
```

## 🛠️ Configuración Discord

### Roles requeridos

#### Opción 1: El bot crea los roles automáticamente (Recomendado)

Durante el setup con `/setup-roles`, el bot puede crear automáticamente todos los roles necesarios si tiene permisos de "Gestionar Roles". No necesitas crear nada manualmente.

#### Opción 2: Usa tus roles existentes (Sistema Inteligente)

Si ya tienes roles de rangos con nombres personalizados:

- El bot los **detectará automáticamente** durante el setup
- Soporta **variantes comunes** de nombres (ej: "Predator" en lugar de "Apex Predator")
- Te mostrará una **vista previa** de los roles que encontró
- Podrás **confirmar o rechazar** usar tus roles personalizados

**Nombres estándar soportados:**

- Hierro / Iron / Rookie / Principiante
- Bronce / Bronze
- Plata / Silver
- Oro / Gold
- Platino / Platinum
- Esmeralda / Esmerald / Emerald (solo con `ENABLE_NEW_RANKS=true`)
- Diamante / Diamond
- Maestro / Master
- Gran maestro / Grandmaster (solo con `ENABLE_NEW_RANKS=true`)
- Apex Predator / Predator / Pred

**Plataformas soportadas:**

- PC / Origin / Steam
- PlayStation / PS / PS4 / PS5 / PSN
- Xbox / X1 / XboxOne
- Nintendo Switch / Switch / Nintendo

> **💡 Nota**: El bot reconoce automáticamente estas variantes sin necesidad de configuración adicional. Si tus roles tienen nombres diferentes, el sistema de coincidencia fuzzy intentará mapearlos automáticamente usando algoritmo de Levenshtein.

Si preferís crear los roles manualmente porque el bot no tiene **Gestionar
roles**, usá el nombre exacto o un alias reconocido, ubicalos debajo del rol más
alto del bot y en orden de `tier` (Predator arriba, Hierro/Rookie abajo). El permiso
sigue siendo necesario para que el autoservicio asigne o cambie rangos. El sync
solo reordena los roles cuando crea al menos uno.

Para el flujo automático de creación de roles y reconstrucción del panel, consulta **[RANK-SYNC.md](RANK-SYNC.md)**.

### Emojis personalizados

Sube los emojis de rango y asígnales los nombres correctos, por ejemplo:

- `Ranked_Tier1_Bronze.webp` como `:Ranked_Tier1_Bronze:`
- ... (uno por cada rango)

### Permisos del bot

El bot incluye **detección automática mejorada de permisos faltantes** con mensajes detallados:

- **Verificación granular**: Comprueba permisos por servidor y canal por separado.
- **Mensajes de error específicos**: Indica exactamente qué permiso falta y cómo solucionarlo.
- **Guía integrada**: Proporciona instrucciones directas para activar permisos faltantes.

**Permisos requeridos:**

- Gestionar roles
- Gestionar canales
- Enviar mensajes
- Leer historial de mensajes
- Usar emojis externos
- Gestionar mensajes
- Ver canales
- Insertar enlaces
- Adjuntar archivos
- Usar comandos de aplicación

Para información detallada sobre permisos, consulta **[PERMISSIONS.md](PERMISSIONS.md)**.

## 🆕 **Inicialización del Bot y Manejo de Estados**

El bot implementa un sistema de inicialización modular y robusto que maneja diferentes escenarios de arranque y recuperación automática.

### Flujo de Inicialización

1. **Verificación de Instancia Única**: Sistema de lock que previene múltiples instancias simultáneas
2. **Carga de Módulos**: Inicialización ordenada de todos los componentes
3. **Conexión a Discord**: Establecimiento de conexión con validación de token
4. **Configuración de Eventos**: Registro de todos los event listeners
5. **Inicialización de Guilds**: Procesamiento de servidores existentes y nuevos

### Módulos de Inicialización

#### `init-bot.ts` - Orquestador Principal

```typescript
// Punto central de inicialización
export async function initBot(client: Client): Promise<void> {
  client.once(Events.ClientReady, async (readyClient) => {
    try {
      // 1. Inicializar guilds existentes
      await initializeExistingGuilds(readyClient);

      // 2. Configurar eventos globales
      setupGuildEvents(readyClient);

      // 3. Configurar handlers de nuevos guilds
      setupNewGuildHandler(readyClient);

      // 4. Configurar limpieza de guilds
      setupGuildDeleteHandler(readyClient);

      logApp('Bot inicializado completamente y listo para operar.');
    } catch (error) {
      logApp(`ERROR durante la inicialización del bot: ${error}`);
    }
  });
}
```

#### `guild-initializer.ts` - Inicialización de Guilds Existentes

- **Detección Automática**: Identifica servidores ya configurados
- **Restauración de Estado**: Recupera configuración previa desde archivos JSON
- **Sincronización de Datos**: Verifica consistencia entre roles y datos almacenados
- **Registro de Tareas**: Configura scheduler para actualizaciones periódicas

#### `guild-events.ts` - Eventos de Miembros y Presencia

- **Eventos Monitoreados**: `GuildMemberAdd`, `GuildMemberRemove`, `GuildMemberUpdate`, `PresenceUpdate` y eventos de rol
- **Actualizaciones Prioritarias**: Sistema de cola para evitar sobrecarga
- **Filtros Inteligentes**: Solo procesa cambios relevantes; los cards se refrescan por rango afectado y las estadísticas/presencia global quedan al scheduler

#### `new-guild-handler.ts` - Manejo de Nuevos Servidores

- **Detección de Nuevos Guilds**: Evento `GuildCreate`
- **Mensaje de Bienvenida**: Instrucciones automáticas para configuración
- **Verificación de Configuración Previa**: Restauración si ya existía

#### `guild-delete-handler.ts` - Limpieza al Salir

- **Conservación de Datos**: Archivos JSON se mantienen para datos históricos
- **Limpieza Opcional**: Código comentado para eliminación automática
- **Logging Detallado**: Registro de salidas de servidores

### Estados del Bot

#### Estado "Ready"

- ✅ Conexión a Discord establecida
- ✅ Todos los comandos registrados
- ✅ Eventos configurados
- ✅ Guilds inicializados
- ✅ Scheduler activo

#### Estado "Initializing"

- 🔄 Verificando instancia única
- 🔄 Cargando configuración
- 🔄 Conectando a APIs externas
- 🔄 Sincronizando datos

#### Estado "Error Recovery"

- ⚠️ Intentando reconectar
- ⚠️ Usando datos cacheados
- ⚠️ Notificando administradores
- ⚠️ Registrando errores

### Recuperación Automática

#### Durante Reinicios del VPS

1. **Detección de Lock**: Verifica si hay otra instancia corriendo
2. **Limpieza de Estado Anterior**: Elimina archivos temporales obsoletos
3. **Restauración de Configuración**: Carga archivos JSON de servidores
4. **Verificación de Conectividad**: Confirma conexión a Discord y APIs
5. **Sincronización de Datos**: Actualiza estados con información actual

#### Durante Caídas de Red

- **Reintentos de API**: La consulta de estado de Apex usa hasta 3 intentos.
  Otras operaciones no agregan reintentos propios.
- **Cache Inteligente**: Uso de datos anteriores si la API falla.
- **Notificaciones**: Alertas al canal de control o al owner para avisos
  accionables; las alertas de infraestructura van al admin de la app.
- **Recuperación Transparente**: Continúa funcionando con datos cacheados
  cuando el flujo lo permite.

#### Durante Mantenimiento de APIs

- **Fallback Seguro**: Uso de datos por defecto cuando APIs fallan
- **Aviso de Cache**: Indicadores visuales en embeds
- **Actualización Automática**: Reintento periódico de conexión

### Sistema de Lock de Instancias

```typescript
// Archivo .bot-lock
{
  "pid": 12345,
  "timestamp": 1697123456789,
  "version": "1.19.0"
}
```

- **Prevención de Conflictos**: Solo una instancia puede correr simultáneamente
- **Limpieza Automática**: Se elimina al cerrar correctamente
- **Detección de Procesos Muertos**: Limpia locks de procesos terminados
- **Timeout de Seguridad**: Locks expiran después de 5 minutos

### Monitoreo de Inicialización

- **Logs Detallados**: Seguimiento de cada paso del proceso.
- **Métricas de Rendimiento**: El arranque registra tiempos de algunas
  operaciones en los logs.
- **Health Checks**: `/health`, `/instance` y `/api-status`.
- **Fallos de inicialización**: Se registran en logs; no hay una alerta
  automática garantizada para todos los casos.

## � **Reinicios del Bot y Recuperación de Estado**

El bot está diseñado para manejar reinicios del VPS/bot de manera robusta, manteniendo la funcionalidad y datos intactos.

### Escenarios de Reinicio Soportados

#### 1. Reinicio Programado del VPS

- **Preservación de Estado**: Todos los archivos de configuración y datos se mantienen
- **Recuperación Automática**: Al reiniciar, el bot restaura automáticamente:
  - Configuración de paneles por servidor
  - Mensajes fijados y embeds
  - Lista de jugadores registrados
  - Tareas programadas del scheduler
- **Tiempo de Recuperación**: No hay una métrica medida; depende de la cantidad
  de guilds, la latencia de Discord y el estado de las APIs.

#### 2. Caída Inesperada del Sistema

- **Detección de Lock Obsoleto**: El arranque identifica procesos muertos y
  limpia el lock.
- **Limpieza Automática**: Elimina locks de instancias anteriores cuando el
  proceso ya no existe.
- **Restauración de Funcionalidad**: Se reintenta la inicialización de guilds;
  no hay garantía de recuperación total si Discord o los archivos están
  corruptos.

#### 3. Reinicio por Actualización

- **Corte de Servicio**: El reinicio implica una interrupción breve; no se
  garantiza zero downtime.
- **Migración de Datos**: Los archivos JSON existentes se siguen leyendo; no se
  reescriben automáticamente.
- **Compatibilidad**: Las versiones nuevas mantienen compatibilidad con los
  formatos de datos documentados.

### Proceso de Recuperación Detallado

#### Fase 1: Verificación de Instancia

```typescript
// En index.ts
async function checkDuplicateInstance(): Promise<boolean> {
  try {
    const data = await fs.readFile(LOCK_FILE, 'utf8');
    const { pid, timestamp } = JSON.parse(data);

    // Verificar si el proceso está vivo
    try {
      process.kill(pid, 0); // Signal 0 solo verifica existencia
      const age = Date.now() - timestamp;
      if (age < 300000) {
        // 5 minutos
        console.error(
          `[ERROR] Ya hay una instancia del bot corriendo (PID: ${pid}). Saliendo...`
        );
        return true;
      }
    } catch {
      // Proceso no existe, limpiar lock
      await fs.unlink(LOCK_FILE).catch(() => {});
    }
  } catch {
    // No hay lock o error, continuar
  }
  return false;
}
```

#### Fase 2: Restauración de Configuración

- **Lectura de Archivos JSON**: Carga configuración por servidor desde `db/` y `.bot-state/`
- **Validación de Datos**: Distingue archivo ausente, JSON inválido y error de
  lectura, y valida la forma de los campos conocidos de `.bot-state`. No hace una
  validación semántica completa de todos los datos.
- **Sincronización con Discord**: Valida canales y roles al inicializar. Los
  mensajes del panel no se validan automáticamente; para referencias inválidas
  usá `/cleanup-state`.

#### Fase 3: Reconexión a APIs

- **Reintentos de API**: La consulta de estado de Apex usa hasta 3 intentos con
  espera fija de 1.2 segundos.
- **Cache como Fallback**: Uso de datos anteriores si la API falla.
- **Monitoreo Continuo**: Verificación periódica del estado de la API.

#### Fase 4: Restauración de Funcionalidad

- **Scheduler Global**: Reinicia todas las tareas programadas
- **Event Listeners**: Re-registra todos los handlers de eventos
- **Presence Global**: Actualiza estadísticas combinadas de todos los servidores

### Conservación de archivos

#### Archivos Críticos

- **`.bot-state/{guildId}.json`**: Estado del bot por servidor
- **`db/players_{guildId}.json`**: Datos de jugadores por servidor
- **`db/server-config-{guildId}.json`**: Configuración de roles personalizados
- **`.bot-lock`**: Control de instancias (temporal)

#### Estrategia

- **Conservación por Defecto**: Todos los archivos se mantienen al salir de servidores.
- **Sin copias automáticas**: El bot no genera backups; los archivos originales
  deben respaldarse por fuera del proceso.
- **Recuperación Manual**: Comando `/cleanup-data` para limpieza opcional.

Las escrituras de `.bot-state` son atómicas (temporal + `rename`) y se serializan
por guild; las actualizaciones parciales preservan `apexStatus`, `botControl`,
firmas y journal. El panel usa un journal de reconstrucción para no borrar
mensajes activos y limpiar los retirados en el próximo sync. Ver
[RANK-SYNC.md](RANK-SYNC.md#persistencia-de-bot-state) y
[RANK-SYNC.md](RANK-SYNC.md#3-reconstrucción-del-panel).

### Monitoreo Durante Reinicios

#### Health Checks

- **`GET /health`**: Verificación básica de conectividad. No cambia de estado
  por problemas de `.bot-state`.
- **`GET /instance`**: `uptime`, `version`, `timestamp` y `lastAdminAlert` con
  solo `emittedAt`, `errorType` y `webhookDelivered`. No expone guild ID/nombre,
  archivos, tokens, stack traces ni datos de jugadores.
- **`GET /api-status`**: Estado de APIs externas.

#### Logs de Recuperación

```
[2025-09-18T10:30:00.000Z] [App] [500ms] Iniciando recuperación de estado...
[2025-09-18T10:30:00.500Z] [App] [200ms] Configuración cargada para 5 servidores
[2025-09-18T10:30:01.000Z] [App] [1500ms] Scheduler reiniciado con 15 tareas
[2025-09-18T10:30:01.500Z] [App] [300ms] Bot listo para operar
```

#### Alertas de Problemas

- **Notificaciones**: Los avisos accionables van al canal de control o al owner.
  Las alertas de infraestructura, como `.bot-state` corrupto detectado en el
  arranque, la reincorporación, un evento de rol o el rank sync, van al admin de
  la app y nunca al owner del guild. Un fallo de escritura de `.bot-state` se
  registra y se propaga, pero no genera alerta automática en esta versión.
- **Fallback Automático**: El bot continúa funcionando con la configuración
  disponible si hay errores, salvo que el estado del guild sea inválido.
- **Logging Detallado**: Los pasos de inicialización y los errores se registran
  para diagnóstico.

### Mejores Prácticas para Producción

#### Configuración del VPS

```bash
# Systemd service example
[Unit]
Description=Apex Range Discord Bot
After=network.target

[Service]
Type=simple
User=botuser
WorkingDirectory=/opt/apex-range
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### Monitoreo Recomendado

- **Uptime Monitoring**: Servicios como UptimeRobot para health checks
- **Log Aggregation**: Herramientas como PM2 o systemd para gestión de logs
- **Resource Monitoring**: Monitoreo de CPU, memoria y conexiones de red
- **Discord Status**: Verificación periódica de conectividad a Discord API

#### Estrategias de Deployment

- **Blue-Green Deployment**: Mantén dos instancias para zero-downtime
- **Rolling Updates**: Actualiza servidores uno por uno
- **Canary Releases**: Prueba nuevas versiones en servidores pequeños primero
- **Rollback Automático**: Sistema para revertir cambios problemáticos

### Solución de Problemas Comunes

#### "Ya hay una instancia corriendo"

- **Causa**: Lock file de instancia anterior no se limpió
- **Solución**: Verificar procesos con `ps aux | grep node` y eliminar lock manualmente si es necesario

#### "Configuración no se restaura"

- **Causa**: Archivos JSON corruptos o permisos incorrectos
- **Solución**: Verificar permisos de archivos y ejecutar `/setup-roles` nuevamente

#### "APIs no responden al inicio"

- **Causa**: Problemas de red o APIs caídas
- **Solución**: El bot usa cache automáticamente; verifica conectividad manualmente

#### "Mensajes no se actualizan"

- **Causa**: IDs de mensajes inválidos después de reinicio o mensajes borrados.
- **Solución**: Ejecutar `/cleanup-state` para limpiar referencias inválidas y
  esperar el próximo sync, o `/setup-roles` para recrear el panel.

### Métricas de Rendimiento

| Métrica               | Valor Típico | Umbral de Alerta |
| --------------------- | ------------ | ---------------- |
| Tiempo de Inicio      | < 30s        | > 60s            |
| Memoria al Inicio     | < 100MB      | > 200MB          |
| CPU al Inicio         | < 20%        | > 50%            |
| Tasa de Éxito de APIs | > 95%        | < 90%            |

> Estos valores son orientativos y no fueron medidos en esta iteración. Ajustalos
> según el tamaño del servidor y el entorno de despliegue.
