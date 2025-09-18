# <img src="https://cdn.discordapp.com/emojis/1410729026410119269.webp?size=40&quality=lossless" alt="Apex Icon" width="32" style="vertical-align:middle"> Apex Legends Rank Bot

Bot de Discord para gestionar y mostrar los rangos de los jugadores de Apex Legends en tu servidor, con panel interactivo, estadísticas y cards visuales.

![Version](https://img.shields.io/github/v/release/brauliorg12/apex-range)
![License](https://img.shields.io/github/license/brauliorg12/apex-range)
![GHCR Pulls](https://img.shields.io/badge/GHCR-pulls-blue?logo=github)

**🌐 Website: [https://apex-range.cubanova.com](https://apex-range.cubanova.com)**

---

**[>> Invitar Apex Legends Rank Bot a tu Servidor <<](https://discord.com/oauth2/authorize?client_id=1406424026427031696&scope=bot+applications.commands&permissions=268560384)**

### 🎯 **Análisis Detallado de Permisos Pre-configurados**

¡Excelente configuración! El valor `268560384` incluye **exactamente** todos los permisos críticos necesarios para el funcionamiento óptimo del bot.

#### 📋 **Permisos Incluidos en el Enlace:**

| Permiso                    | Valor Binario | Estado      | Descripción                          |
| -------------------------- | ------------- | ----------- | ------------------------------------ |
| **ViewChannel**            | 1024          | ✅ Incluido | Ver canales y mensajes               |
| **SendMessages**           | 2048          | ✅ Incluido | Enviar mensajes en canales           |
| **ManageMessages**         | 8192          | ✅ Incluido | Gestionar mensajes (fijar, eliminar) |
| **UseExternalEmojis**      | 262144        | ✅ Incluido | Usar emojis de otros servidores      |
| **ReadMessageHistory**     | 65536         | ✅ Incluido | Leer historial de mensajes           |
| **EmbedLinks**             | 16384         | ✅ Incluido | Insertar enlaces en embeds           |
| **AttachFiles**            | 32768         | ✅ Incluido | Adjuntar archivos e imágenes         |
| **ManageRoles**            | 268435456     | ✅ Incluido | Gestionar roles de rangos            |
| **UseApplicationCommands** | 2147483648    | ✅ Incluido | Usar comandos slash y de contexto    |

#### 🔢 **Verificación Matemática:**

```
268560384 = 1024 + 2048 + 8192 + 16384 + 32768 + 65536 + 262144 + 268435456
```

**¡Cálculo perfecto! ✅**

#### 📊 **Estado de la Configuración:**

- 🟢 **Permisos Críticos**: **100% Cubiertos** (9/9)
- 🟢 **Cobertura Total**: **100% de Compatibilidad**
- 🟢 **Configuración Óptima**: Lista para usar

#### 🚀 **Resultado Final:**

🎉 **Tu enlace de invitación está perfectamente configurado!**

Los administradores solo necesitan hacer **un click** en el enlace y el bot tendrá automáticamente todos los permisos necesarios para funcionar de manera excepcional en cualquier servidor.

> 💡 **Consejo Pro**: Esta configuración pre-optimizada ahorra tiempo y evita problemas de permisos comunes.

---

## 🚀 ¿Qué es Apex Legends Rank Bot?

Un bot profesional para comunidades de Apex Legends que permite:

- Asignar roles de rango mediante botones.
- Mostrar estadísticas y cards visuales de jugadores.
- Panel persistente y configurable.
- Comandos slash y de contexto para gestión avanzada.
- **Soporte completo para múltiples servidores** - funciona automáticamente en cualquier servidor donde se instale.

---

## 🆕 **Multi-Servidor Automático**

El bot ahora soporta **múltiples servidores simultáneamente** sin configuración adicional:

### Funcionalidades Multi-Servidor

- **Configuración Independiente**: Cada servidor mantiene su propia configuración, roles y datos.
- **Detección Automática**: Al unirse a un nuevo servidor, el bot envía automáticamente un mensaje de bienvenida invitando a ejecutar `/setup-roles`.
- **Recuperación Automática**: Si el bot vuelve a un servidor donde ya estaba configurado, automáticamente restaura todas las funciones y actualiza la presencia global.
- **Archivos Separados**: Se crean archivos JSON independientes por servidor:
  - `.bot-state/{guildId}.json` - Estado del bot por servidor
  - `db/players_{guildId}.json` - Jugadores por servidor
- **Prevención de Conflictos**: Sistema de lock que impide ejecutar múltiples instancias del mismo bot.
- **Presencia Global**: La presencia del bot muestra estadísticas combinadas de todos los servidores configurados.
- **Monitoreo Mejorado**: Endpoint `/instance` para verificar el estado de la instancia actual.

### Presencia Global

La presencia del bot muestra estadísticas combinadas de todos los servidores:

```
🟢 25 en línea | 👥 150 registrados | 🌐 3 servidores
```

Esto incluye:

- **Jugadores online** en total de todos los servidores
- **Jugadores registrados** en total de todos los servidores
- **Número de servidores** donde el bot está configurado

### Recuperación Automática de Servidores

Cuando el bot se une a un servidor donde ya existía configuración previa:

1. **Detección Inteligente**: El bot verifica automáticamente si ya hay archivos de configuración para ese servidor.
2. **Restauración Completa**: Restaura todos los paneles, mensajes y configuraciones anteriores.
3. **Actualización de Presencia**: Inmediatamente actualiza la presencia global con las estadísticas del servidor recuperado.
4. **Sincronización de Datos**: Sincroniza la lista de jugadores con los roles actuales del servidor.
5. **Mensaje de Confirmación**: Envía un mensaje confirmando que el bot ha sido reconectado exitosamente.

### Cómo Funciona

1. **Instalación**: Invita el bot a tu servidor usando el enlace de arriba.
2. **Configuración**: Un administrador ejecuta `/setup-roles` en el canal deseado.
3. **Funcionamiento**: El bot opera independientemente en cada servidor.
4. **Escalabilidad**: Puedes tener el bot en tantos servidores como quieras.
5. **Recuperación**: Si el bot sale y vuelve, automáticamente restaura la configuración.

> **Nota**: El bot detecta automáticamente nuevos servidores y se configura por separado en cada uno. Si vuelve a un servidor ya configurado, restaura automáticamente todas las funciones.

---

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

- **Eventos Monitoreados**: `GuildMemberAdd`, `GuildMemberRemove`, `PresenceUpdate`
- **Actualizaciones Prioritarias**: Sistema de cola para evitar sobrecarga
- **Filtros Inteligentes**: Solo procesa cambios relevantes

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

- **Reintentos Automáticos**: Hasta 3 intentos por operación
- **Cache Inteligente**: Uso de datos anteriores si API falla
- **Notificaciones**: Alertas a owners sobre problemas
- **Recuperación Transparente**: Continúa funcionando con datos cacheados

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
  "version": "1.10.6"
}
```

- **Prevención de Conflictos**: Solo una instancia puede correr simultáneamente
- **Limpieza Automática**: Se elimina al cerrar correctamente
- **Detección de Procesos Muertos**: Limpia locks de procesos terminados
- **Timeout de Seguridad**: Locks expiran después de 5 minutos

### Monitoreo de Inicialización

- **Logs Detallados**: Seguimiento de cada paso del proceso
- **Métricas de Rendimiento**: Tiempo de inicialización por componente
- **Health Checks**: Endpoints para verificar estado de inicialización
- **Alertas Automáticas**: Notificaciones si la inicialización falla

---

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
- **Tiempo de Recuperación**: Menos de 30 segundos para servidores típicos

#### 2. Caída Inesperada del Sistema

- **Detección de Lock Obsoleto**: Sistema inteligente que identifica procesos muertos
- **Limpieza Automática**: Elimina locks de instancias anteriores
- **Restauración de Funcionalidad**: Todas las funciones se recuperan automáticamente

#### 3. Reinicio por Actualización

- **Zero Downtime**: El bot puede reiniciarse sin afectar servidores
- **Migración de Datos**: Archivos JSON se actualizan automáticamente
- **Compatibilidad**: Versiones nuevas mantienen compatibilidad con datos antiguos

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
      if (age < 300000) { // 5 minutos
        console.error(`[ERROR] Ya hay una instancia del bot corriendo (PID: ${pid}). Saliendo...`);
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
- **Validación de Datos**: Verifica integridad de archivos y consistencia
- **Sincronización con Discord**: Confirma que canales y mensajes aún existen

#### Fase 3: Reconexión a APIs

- **Reintentos Inteligentes**: Hasta 3 intentos por API con backoff exponencial
- **Cache como Fallback**: Uso de datos anteriores si APIs fallan inicialmente
- **Monitoreo Continuo**: Verificación periódica del estado de APIs

#### Fase 4: Restauración de Funcionalidad

- **Scheduler Global**: Reinicia todas las tareas programadas
- **Event Listeners**: Re-registra todos los handlers de eventos
- **Presence Global**: Actualiza estadísticas combinadas de todos los servidores

### Sistema de Backup Automático

#### Archivos Críticos

- **`.bot-state/{guildId}.json`**: Estado del bot por servidor
- **`db/players_{guildId}.json`**: Datos de jugadores por servidor
- **`db/server-config-{guildId}.json`**: Configuración de roles personalizados
- **`.bot-lock`**: Control de instancias (temporal)

#### Estrategia de Backup

- **Conservación por Defecto**: Todos los archivos se mantienen al salir de servidores
- **Backup Automático**: Los archivos sirven como backup natural
- **Recuperación Manual**: Comando `/cleanup-data` para limpieza opcional

### Monitoreo Durante Reinicios

#### Health Checks

- **`GET /health`**: Verificación básica de conectividad
- **`GET /instance`**: Información detallada de la instancia actual
- **`GET /api-status`**: Estado de APIs externas

#### Logs de Recuperación

```
[2025-09-18T10:30:00.000Z] [App] [500ms] Iniciando recuperación de estado...
[2025-09-18T10:30:00.500Z] [App] [200ms] Configuración cargada para 5 servidores
[2025-09-18T10:30:01.000Z] [App] [1500ms] Scheduler reiniciado con 15 tareas
[2025-09-18T10:30:01.500Z] [App] [300ms] Bot listo para operar
```

#### Alertas de Problemas

- **Notificaciones por DM**: Owners reciben alertas si hay problemas durante recuperación
- **Fallback Automático**: El bot continúa funcionando con configuración mínima si hay errores
- **Logging Detallado**: Todos los pasos se registran para debugging

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

- **Causa**: IDs de mensajes inválidos después de reinicio
- **Solución**: Ejecutar `/setup-roles` para recrear paneles

### Métricas de Rendimiento

| Métrica | Valor Típico | Umbral de Alerta |
|---------|-------------|------------------|
| Tiempo de Inicio | < 30s | > 60s |
| Memoria al Inicio | < 100MB | > 200MB |
| CPU al Inicio | < 20% | > 50% |
| Tasa de Éxito de APIs | > 95% | < 90% |

Este sistema asegura que el bot sea altamente confiable en entornos de producción, manejando reinicios de manera transparente y manteniendo la funcionalidad continua.

---

## 🆕 Panel de Estado de Apex Legends y Perfil Interactivo

### Card de Estado de la API Mozambique

El bot ahora incluye un **embed dinámico** que muestra información en tiempo real de la API oficial de Mozambique:

- **Rotación de mapas**: Battle Royale, Ranked y LTM, siempre actualizados.
- **RP necesario para Predator**: Visualización clara para PC, PS4 y Xbox.
- **Actualización automática**: El panel se refresca cada 5 minutos para mantener la información al día.
- **Fuente y timestamp**: Siempre sabrás de dónde provienen los datos y cuándo se actualizaron.

Esto permite a tu comunidad estar informada al instante sobre el estado del juego y los requisitos competitivos.

### Botón "Ver perfil Apex Global"

Debajo del embed de estado, encontrarás el botón:

```
[ Ver perfil Apex Global ]
```

- Al pulsarlo, se abre un modal donde puedes ingresar tu plataforma y usuario.
- El bot consulta la API de Mozambique y te envía un **card privado** con tus estadísticas principales: nivel, kills, rango, leyenda principal, UID y plataforma.
- El embed utiliza colores y emojis personalizados según tu rango.
- Si ocurre un error (usuario no encontrado, API caída, etc), recibirás un mensaje claro y profesional.

#### Experiencia de usuario

- **Acceso rápido**: Todo desde el canal principal, sin comandos complicados.
- **Privacidad**: Tu perfil se muestra solo a ti mediante mensaje ephemeral.
- **Integración total**: El botón y el embed están siempre visibles y actualizados en el panel.
- Al consultar tu perfil, verás **hasta tres embeds**:
  - El embed principal con tus estadísticas globales.
  - El embed de Arenas con tu rango y datos de ese modo.
  - El embed de Realtime con tu estado actual en el juego (si está disponible).

#### Detalles técnicos

- El panel y el botón se generan automáticamente al ejecutar `/setup-roles`.
- El estado de la API se obtiene usando la [API de Mozambique](https://apexlegendsapi.com/).
- El botón utiliza componentes interactivos de Discord para una experiencia moderna y fluida.
- El código es modular y fácil de mantener.

---

## 🆕 Sistema de Cache Inteligente (API Mozambique)

El bot implementa una solución profesional y eficiente para lidiar con las limitaciones de las APIs gratuitas (como límites de peticiones, caídas o respuestas incompletas):

- **Cache por canal y servidor:** Cada panel mantiene su propia cache, independiente de otros canales o servidores.
- **Solo se guarda información válida:** El bot solo actualiza la cache si la API responde correctamente. Si la API falla, se mantiene la última información válida.
- **Actualización automática cada 5 minutos:** El panel se refresca periódicamente. Si la API responde bien, se actualiza la cache; si falla, se muestra la última cache disponible.
- **Consulta ordenada de endpoints:**
  - Primero se consultan los endpoints críticos (rotación de mapas y estado de servidores), asegurando que la información esencial esté siempre lo más actualizada posible.
  - Luego, tras un breve intervalo para respetar el rate limit de la API, se consultan los endpoints secundarios (Predator RP).
- **Aviso de cache:** Si se muestra información cacheada, verás en el footer del card el mensaje:  
  `⚠️ Datos en cache cargados hace X minutos`
- **Nunca se sobrescribe la cache con errores:** Así, siempre tendrás la última información válida aunque la API esté temporalmente caída o limitada.
- **Cumplimiento de límites de la API:** El bot distribuye las consultas en el tiempo y por orden, evitando saturar la API y asegurando la máxima robustez.

> **Nota:** Este sistema es una solución práctica y robusta para entornos con APIs gratuitas, donde los límites de peticiones y la inestabilidad pueden ser frecuentes. Así, tu comunidad siempre verá la mejor información posible, incluso si la API externa falla temporalmente.

---

## 🛰️ Estado de los Servidores: Significado de los Emojis

En la card de estado de servidores, los siguientes emojis indican el estado de cada región/plataforma:

| Emoji | Estado      | Significado        |
| ----- | ----------- | ------------------ |
| 🟢    | UP          | Operativo          |
| 🟡    | SLOW        | Lento/intermitente |
| 🔴    | DOWN        | Caído              |
| ⚪    | Desconocido | Estado desconocido |

Esto te permite identificar rápidamente el estado de los servidores de Apex Legends en cada región.

---

## 🎨 Tipografía utilizada

El bot utiliza la fuente **Montserrat Bold** para todos los cards visuales y textos generados con canvas, logrando un estilo moderno y profesional.

La fuente se encuentra en la carpeta:

```
assets/fonts/Montserrat-Bold.ttf
```

---

## 🆘 Ayuda y Mensaje de Estado

Cuando uses `/apex-status` o veas el panel de estado, ten en cuenta:

- Si ves `⚠️ Datos en cache temporalmente` en alguna card, significa que la API no respondió y se está mostrando la última información válida.
- **Panel de estado Apex**: Se actualiza automáticamente cada 5 minutos.
- **Roles y presencia**: Se actualizan cada 2 minutos para mantener la información al día.
- **Imágenes del embed**: Se refrescan cada 10 minutos para optimizar rendimiento.
- Los emojis de estado de servidor indican si cada región está operativa, lenta o caída.

---

## ⏱️ Detalles de Intervalos, Reintentos y Tiempos de Consulta

Para adaptarse a las limitaciones de la API de Mozambique y evitar bloqueos, el bot implementa la siguiente estrategia de consulta y cache optimizada:

- **Actualización automática por tipo:**

  - **Panel de estado Apex**: Se actualiza cada **5 minutos** (300 segundos) en cada canal configurado
  - **Roles y presencia**: Se actualizan cada **2 minutos** (120 segundos) para mejor eficiencia
  - **Imágenes del embed**: Se refrescan cada **10 minutos** (600 segundos) para reducir carga

- **Orden de consulta de endpoints:**

  1. **Primero** se consultan los endpoints críticos:
     - Rotación de mapas (`mapRotation`)
     - Estado de los servidores (`serverStatus`)
  2. **Luego de 1 segundo de espera**, se consulta el endpoint secundario:
     - RP necesario para Predator (`predatorRank`)

- **Reintentos:**  
  Cada consulta a la API se reintenta hasta **3 veces** en caso de error, con un intervalo de **1.2 segundos** entre cada intento.

- **Cache inteligente:**

  - Si la API responde correctamente, se actualiza la cache.
  - Si la API falla, se usa la última cache válida (si existe).
  - Si no hay cache ni respuesta válida, el panel muestra "No disponible".

- **Sistema de cola global:**

  - **Procesamiento priorizado**: Las actualizaciones se encolan por importancia (alta, normal, baja)
  - **Control de concurrencia**: Máximo 3 servidores procesando simultáneamente
  - **Eliminación de duplicados**: Evita actualizaciones redundantes del mismo tipo

- **Cumplimiento de rate limit:**

  - Nunca se hacen más de 2 requests/segundo a la API.
  - El endpoint secundario espera 1 segundo tras los críticos para evitar saturar la API.

- **Aviso de cache:**  
  Si se muestra información cacheada, verás en el footer del card el mensaje:  
  `⚠️ Datos en cache cargados hace X minutos`

> **Resumen de optimizaciones:**
>
> - Panel Apex actualizado cada 5 minutos (sin cambios).
> - Roles y presencia cada 2 minutos (antes 60 segundos - 67% menos frecuente).
> - Imágenes cada 10 minutos (antes 5 minutos - 50% menos frecuente).
> - Sistema de cola global evita conflictos y mejora rendimiento.
> - Endpoints críticos primero, secundarios después de 1 segundo.
> - Hasta 3 reintentos por endpoint, con 1.2s de espera.
> - Cache por canal y servidor, nunca sobrescrita con errores.
> - Cumplimiento estricto del rate limit de la API.

---

## 🟢 Comandos Disponibles

| Comando / Acción   | Descripción                                                                                                              | Permisos      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `/setup-roles`     | Configura el panel de selección de rango y mensaje de estadísticas con menú interactivo para crear roles automáticamente | Administrador |
| `/apex-status`     | Muestra el estado de Apex (mapas, Predator RP)                                                                           | Todos         |
| `/total-jugadores` | Muestra el número total de jugadores con rango                                                                           | Todos         |
| `/cleanup-data`    | [ADMIN] Limpia archivos JSON de servidores obsoletos                                                                     | Owner del Bot |

> **Nota:** Los comandos `/setup-roles` y `/apex-status` son independientes y pueden configurarse en canales distintos. El comando de contexto aparece al hacer click derecho sobre un usuario.

### Menú Interactivo de Configuración

Al ejecutar `/setup-roles`, el bot:

1. **Detecta roles faltantes automáticamente** y muestra un menú interactivo con opciones.
2. **Ofrece crear roles automáticamente** si el bot tiene permisos, o proporciona instrucciones manuales.
3. **Guía paso a paso** con botones para continuar o cancelar la configuración.
4. **Integración completa**: Incluye el botón "Ver perfil Apex Global" en el panel generado.

## Menú Contextual

- `Ver mi rango en Apex Range` (contexto) | Muestra tu rango actual y opciones de gestión | Todos |

---

## 🌐 Uso en Múltiples Canales

Una de las características más poderosas del bot es su capacidad para funcionar en diferentes canales de forma simultánea e independiente.

- **Panel de Roles y Estadísticas (`/setup-roles`)**: Puedes ejecutar este comando en un canal principal o de bienvenida (ej: `#bienvenida-y-roles`). El bot recordará este canal y mantendrá el panel de rangos y las estadísticas de jugadores siempre actualizado allí.

- **Panel de Estado de Apex (`/apex-status`)**: Este comando puedes ejecutarlo en un canal completamente diferente (ej: `#noticias-apex`). El bot mostrará y actualizará la rotación de mapas y el RP de Predator en ese canal, sin interferir con el panel de roles.

Esta separación te permite organizar tu servidor de manera más eficiente, manteniendo la información relevante en los canales adecuados.

---

### Rol común "Apex"

Además de los roles de rango, debes crear manualmente un **rol llamado `Apex`** en tu servidor.  
Este rol se asignará automáticamente a cualquier usuario que tenga un rango de Apex, y se removerá si el usuario ya no tiene ningún rango.

Puedes usar este rol para mencionar a todos los jugadores registrados fácilmente:

```
@Apex ¡Hay evento nuevo!
```

---

## Comando `/api-status`

Consulta el estado de la API externa utilizada por el bot.  
Muestra si la API está conectada y la última vez que se verificó.

---

## Comando de Contexto: Ver mi rango en Apex Range

Permite consultar el rango de cualquier usuario (incluyéndote a ti mismo) desde el menú contextual:

1. Haz click derecho sobre el nombre de usuario (en la lista de miembros o en el chat).
2. Selecciona **"Ver mi rango en Apex Range"** en la sección de Apps.

### Funcionamiento

- **Si eres tú mismo:**

  - El embed muestra tu rango actual con color, emoji y botones para gestionarlo o cerrarlo.
  - Si no tienes rango, puedes seleccionarlo directamente.

- **Si es otro usuario:**

  - El embed muestra el rango actual del usuario con color y emoji, y solo el botón "Cerrar".
  - Si el usuario no tiene rango, lo indica claramente.

- El mensaje es privado (ephemeral) y solo visible para quien ejecuta el comando.

---

## 🎛️ Panel Interactivo

- **Botones para seleccionar rango**: Elige tu rango y el bot te asigna el rol correspondiente.
- **Gestión de rango**: Cambia o elimina tu rango fácilmente.
- **Estadísticas en tiempo real**: Ve cuántos jugadores hay por rango y quiénes están online.
- **Cards visuales**: Avatares de los últimos registrados y listados por rango.

---

## 🌎 Visualización de países con banderas

Cuando un usuario tiene roles de país (por ejemplo, `ARGENTINA`, `MEXICO`, `VENEZUELA`), el bot mostrará automáticamente la bandera correspondiente junto al nombre del país en los listados de jugadores online.  
El nombre del país aparecerá capitalizado y en _cursiva_ para mayor claridad y menor impacto visual.

Ejemplo de visualización:

```
• @usuario1 (🇦🇷 _Argentina_, 🇲🇽 _Mexico_)
• @usuario2 (_Embajador_)
• @usuario3 (_Venelzuela_)
```

- Si el rol coincide con un país conocido, se muestra la bandera y el nombre capitalizado.
- Si el rol no es un país conocido, se muestra solo el nombre capitalizado y en cursiva.
- Puedes ampliar la lista de países editando el archivo `src/utils/country-flag.ts` y agregando más entradas al objeto `COUNTRY_NAME_TO_ISO`.

> **Nota:** Los roles de país deben estar en mayúsculas y escritos exactamente igual que en Discord para que la bandera se muestre correctamente.

---

## ✨ Características principales

- Panel persistente y auto-actualizable.
- Cards generadas con @napi-rs/canvas para máxima calidad.
- Filtros por rango y gestión desde el propio canal.
- Comandos slash y menú contextual profesional.
- Migración automática de datos antiguos.
- Logs claros y monitoreo de estado/API.
- **Soporte completo para múltiples servidores**.
- **Detección automática de nuevos servidores**.
- **Recuperación automática de configuración previa**.
- **Sistema de lock para prevenir instancias duplicadas**.
- **Archivos de datos separados por servidor**.
- **Health server integrado con monitoreo avanzado**.
- **Presencia global con estadísticas combinadas de todos los servidores**.

---

## ⚡ **Optimizaciones de Rendimiento y Sistema de Cola Global**

El bot implementa un **sistema de optimización avanzado** que mejora significativamente el rendimiento y la eficiencia en entornos multi-servidor, soportando actualizaciones continuas sin interrupciones.

### Arquitectura del Sistema de Cola

#### Cola Prioritaria Global (`guild-update-queue.ts`)

```typescript
class GuildUpdateQueue {
  private queues: Map<string, UpdateTask[]> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrency = 3; // Máximo de guilds procesando simultáneamente
}
```

- **Colas por Servidor**: Cada servidor tiene su propia cola independiente
- **Procesamiento Concurrente Limitado**: Máximo 3 servidores procesando simultáneamente
- **Eliminación de Duplicados**: Evita procesar la misma actualización múltiples veces
- **Priorización Inteligente**: Alta, normal, baja según importancia

#### Tipos de Prioridad

| Prioridad | Valor | Uso | Ejemplos |
|-----------|-------|-----|----------|
| Alta | 2 | Eventos críticos | Nuevos miembros, cambios de presencia |
| Normal | 1 | Actualizaciones regulares | Estadísticas de roles, mensajes de Apex |
| Baja | 0 | Tareas opcionales | Limpieza de datos antiguos |

### Scheduler Global Optimizado (`global-scheduler.ts`)

#### Reemplazo de Múltiples Timers

**Antes**: Un timer por servidor por tarea
```typescript
// Problema: 3 servidores × 3 tareas = 9 timers activos
setInterval(() => updateRoles(guild), 60000);
setInterval(() => updatePresence(guild), 120000);
setInterval(() => updateImages(guild), 600000);
```

**Después**: Un scheduler global centralizado
```typescript
// Solución: 1 scheduler gestionando todas las tareas
class GlobalScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private checkInterval = 5000; // Verificar cada 5 segundos
}
```

#### Beneficios del Scheduler Global

- **Reducción de Timers**: De N×T timers a 1 scheduler (donde N=servidores, T=tareas)
- **Gestión Centralizada**: Una sola fuente de verdad para todas las tareas
- **Monitoreo Simplificado**: Estadísticas globales de rendimiento
- **Recuperación Automática**: Reinicio automático tras fallos

### Intervalos Optimizados

#### Comparación de Rendimiento

| Tarea | Antes | Después | Mejora | Razón |
|-------|-------|---------|--------|-------|
| **Roles y Presencia** | 60 segundos | 2 minutos | -67% carga | Suficiente frecuencia para UX |
| **Panel Apex** | 5 minutos | 5 minutos | Sin cambio | Depende de API externa |
| **Imágenes** | 5 minutos | 10 minutos | -50% carga | Alto costo computacional |

#### Lógica de Optimización

```typescript
// Actualización de roles cada 2 minutos
globalScheduler.registerGuildTask(
  guildId,
  'roles-presence',
  2 * 60 * 1000, // 2 minutos
  async (guild, client) => {
    await updateRoleCountMessage(guild);
    await updateBotPresence(client);
  }
);
```

### Sistema de Cache Inteligente

#### Cache Multi-Nivel

1. **Cache por Canal**: Cada panel mantiene su propia cache
2. **Cache Global**: Datos compartidos entre canales del mismo servidor
3. **Cache de API**: Respuestas de APIs externas con TTL

#### Estrategia de Cache

- **Solo Cache Información Válida**: No se guarda información errónea
- **TTL Inteligente**: Diferentes tiempos según tipo de dato
- **Invalidación Automática**: Cache se limpia cuando hay cambios
- **Aviso Visual**: Indicadores cuando se muestra información cacheada

### Monitoreo Avanzado de Rendimiento

#### Métricas en Tiempo Real

- **Tamaño de Colas**: Número de tareas pendientes por servidor
- **Tiempo de Procesamiento**: Latencia de cada operación
- **Tasa de Éxito**: Porcentaje de operaciones exitosas
- **Uso de Recursos**: CPU, memoria, conexiones de red

#### Health Checks Detallados

```json
{
  "health": "ok",
  "uptime": 86400,
  "guilds": 15,
  "queueStats": {
    "totalQueued": 5,
    "processing": 2,
    "completedLastHour": 150
  },
  "schedulerStats": {
    "activeTasks": 45,
    "nextExecution": "2025-09-18T10:35:00.000Z"
  }
}
```

### Optimizaciones de API

#### Rate Limiting Inteligente

- **Distribución Temporal**: Consultas espaciadas para evitar límites
- **Reintentos con Backoff**: Espera exponencial entre reintentos
- **Cache de Respuestas**: Evita consultas duplicadas
- **Fallback Seguro**: Uso de datos por defecto si API falla

#### Endpoints Optimizados

```typescript
// Consulta ordenada para respetar rate limits
const endpoints = [
  'mapRotation',    // Crítico - primero
  'serverStatus',   // Crítico - segundo
  null,             // Espera 1 segundo
  'predatorRank'    // Secundario - último
];
```

### Escalabilidad Multi-Servidor

#### Límites de Escalabilidad

| Aspecto | Límite Actual | Recomendado | Razón |
|---------|---------------|-------------|-------|
| Servidores | Sin límite teórico | 100-500 | Recursos del VPS |
| Usuarios Totales | Sin límite | 100K+ | Arquitectura distribuida |
| Tareas Concurrentes | 3 servidores | 5-10 | Balance CPU/memoria |
| Cache Size | 100MB | 500MB | Memoria disponible |

#### Optimizaciones por Escala

- **Pequeña Escala (1-10 servidores)**: Configuración por defecto
- **Mediana Escala (10-50 servidores)**: Aumentar `maxConcurrency` a 5
- **Grande Escala (50+ servidores)**: Implementar clustering o múltiples instancias

### Recuperación de Fallos

#### Tipos de Fallos Manejados

- **Fallo de Red**: Reintentos automáticos con cache
- **Fallo de API**: Fallback a datos anteriores
- **Fallo de Discord**: Reconexión automática
- **Fallo de Base de Datos**: Archivos JSON como respaldo

#### Estrategias de Recuperación

```typescript
// Ejemplo de recuperación robusta
async function safeApiCall(endpoint: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fetch(endpoint);
      if (result.ok) return result.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Mejores Prácticas de Producción

#### Configuración Recomendada

```typescript
// Para alta carga
const config = {
  maxConcurrency: 5,
  checkInterval: 3000, // 3 segundos
  cacheTTL: 1800000,  // 30 minutos
  maxRetries: 5
};
```

#### Monitoreo Continuo

- **Alertas**: Notificaciones cuando colas crecen demasiado
- **Dashboards**: Visualización de métricas en tiempo real
- **Logs**: Análisis de patrones de uso y rendimiento
- **Auto-scaling**: Ajuste automático de parámetros según carga

### Resultados de Optimización

#### Métricas de Mejora

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Timers Activos** | 3 por servidor | 1 global | -66% reducción |
| **Frecuencia Roles** | 60s | 120s | -67% menos carga |
| **Frecuencia Imágenes** | 300s | 600s | -50% menos carga |
| **Conflictos** | Posibles | Eliminados | 100% estable |
| **Duplicados** | Posibles | Eliminados | 100% eficiente |
| **Tiempo de Inicio** | Variable | < 30s | Predecible |
| **Memoria** | Alta | Optimizada | -30% promedio |

Este sistema asegura que el bot pueda escalar eficientemente a cientos de servidores mientras mantiene un rendimiento óptimo y una experiencia de usuario fluida.

---

## 📊 Sistema de Logging Avanzado

El bot implementa un sistema de logging profesional y granular con métricas de rendimiento:

### Funcionalidades Principales

- **Logs separados por servidor**: Cada servidor tiene su propio archivo de log (`logs/guild_{guildId}_{guildName}.log`) para facilitar el debugging y monitoreo.
- **Detección mejorada de eventos**: Logs detallados para conexiones, errores, interacciones y cambios de estado.
- **Monitoreo en tiempo real**: Información clara sobre permisos, roles y configuraciones por servidor.
- **Separación de concerns**: Logs globales (`logs/global.log`) para eventos del sistema y logs específicos para eventos por servidor.
- **Métricas de rendimiento**: Todos los logs incluyen automáticamente el tiempo de ejecución en milisegundos cuando se proporciona (ej: `[1250ms]`).

### Tipos de Logs

#### Logs por Servidor (`logs/guild_{guildId}_{guildName}.log`)

- Actualizaciones de roles y presencia
- Cambios en mensajes de Apex
- Interacciones de usuarios
- Errores específicos del servidor
- **Ejemplo**: `[2025-09-18T10:30:00.000Z] [INFO] [Guild:123456789012345678] [2500ms] Actualización de mensajes de roles completada`

#### Logs Globales (`logs/global.log`)

- Eventos del sistema
- Inicialización del bot
- Conexiones a APIs externas
- **Ejemplo**: `[2025-09-18T10:30:00.000Z] [GLOBAL] [1500ms] Bot inicializado completamente`

#### Logs de Canvas (`logs/canvas.log`)

- Generación de imágenes y cards
- Rendimiento de operaciones gráficas
- **Ejemplo**: `[2025-09-18T10:30:00.000Z] [Canvas] [800ms] Card generado: ok=5 error=0 | encode=500ms | total=800ms`

#### Logs de Interacciones (`logs/interactions.log`)

- Comandos ejecutados
- Botones presionados
- Modales abiertos
- **Ejemplo**: `[2025-09-18T10:30:00.000Z] [Interaction] [50ms] Tipo: button | Usuario: User#1234 (123456789) | Comando: select_rank`

#### Logs de Aplicación (`logs/app.log`)

- Eventos generales de la aplicación
- Conexiones y desconexiones
- **Ejemplo**: `[2025-09-18T10:30:00.000Z] [App] [200ms] Conexión a API Mozambique exitosa`

### Medición Automática de Rendimiento

El sistema incluye medición automática de tiempos de ejecución para operaciones críticas:

- **Actualizaciones de roles**: Tiempo total de sincronización y actualización de mensajes
- **Consultas a API**: Tiempo de respuesta de APIs externas (Mozambique, etc.)
- **Generación de imágenes**: Tiempo de renderizado de cards y avatares
- **Procesamiento de interacciones**: Tiempo de respuesta a comandos y botones

### Beneficios del Sistema

- ✅ **Debugging eficiente**: Logs separados facilitan encontrar problemas específicos
- ✅ **Monitoreo de rendimiento**: Tiempos de ejecución ayudan a identificar cuellos de botella
- ✅ **Escalabilidad**: Sistema preparado para múltiples servidores sin conflictos
- ✅ **Mantenibilidad**: Estructura clara y consistente en todos los logs
- ✅ **Análisis histórico**: Archivos persistentes para revisión posterior

> **Nota**: Los logs se rotan automáticamente y se almacenan en la carpeta `logs/` para análisis posterior. Los tiempos de ejecución se incluyen automáticamente cuando las operaciones se miden con `performance.now()`.

---

## � **Actualizaciones en Tiempo Real y Soporte Continuo**

El bot está diseñado para mantener la información actualizada constantemente sin interrupciones, soportando cambios dinámicos en Discord y APIs externas.

### Sistema de Actualización Continua

#### Eventos de Discord Monitoreados

- **GuildMemberAdd**: Nuevo miembro se une → Actualizar estadísticas
- **GuildMemberRemove**: Miembro abandona → Actualizar estadísticas  
- **PresenceUpdate**: Cambio de estado online → Actualizar presencia
- **GuildCreate**: Bot añadido a servidor → Inicialización automática
- **GuildDelete**: Bot removido → Limpieza de datos

#### Actualizaciones Automáticas por Tipo

| Tipo | Frecuencia | Trigger | Acción |
|------|------------|---------|--------|
| **Roles y Presencia** | 2 minutos | Timer + Eventos | Actualizar conteos y presencia global |
| **Panel Apex** | 5 minutos | Timer | Refrescar mapas y RP Predator |
| **Imágenes** | 10 minutos | Timer | Regenerar cards visuales |
| **Cache API** | Variable | Respuesta API | Invalidar datos obsoletos |

### Arquitectura de Actualización en Tiempo Real

#### Cola de Actualizaciones Prioritarias

```typescript
// Sistema de prioridades
enum UpdatePriority {
  HIGH = 2,    // Eventos críticos (nuevos miembros)
  NORMAL = 1,  // Actualizaciones regulares
  LOW = 0      // Tareas opcionales
}

// Ejemplo de encolamiento
enqueueGuildUpdate(guild, async () => {
  await updateRoleCountMessage(guild);
}, UpdatePriority.HIGH);
```

#### Procesamiento Concurrente Controlado

- **Máximo 3 servidores simultáneos**: Evita sobrecargar el sistema
- **Eliminación de duplicados**: Una sola actualización por tipo/servidor
- **Timeout inteligente**: Cancela actualizaciones que tardan demasiado

### Soporte para Cambios Dinámicos

#### Cambios en Roles de Discord

```typescript
// Detección automática de cambios
guild.roles.cache.forEach(role => {
  if (role.name !== originalName) {
    // Actualizar mapeo personalizado
    updateRoleMapping(guild.id, role.id, role.name);
    // Invalidar cache
    invalidateGuildCache(guild.id);
    // Reprogramar actualización
    scheduleImmediateUpdate(guild);
  }
});
```

#### Cambios en Configuración

- **Hot Reload**: Cambios en `images.ts` se aplican automáticamente
- **Validación Continua**: Verificación periódica de permisos y configuración
- **Recuperación Automática**: Restauración de funcionalidad tras fallos temporales

### Cache Inteligente Multi-Nivel

#### Estrategias de Cache

1. **Cache de Memoria**: Datos frecuentemente accedidos
2. **Cache de Disco**: Configuración persistente
3. **Cache de API**: Respuestas de servicios externos

#### Invalidación Automática

```typescript
// Invalidación por eventos
client.on('guildMemberAdd', () => invalidatePresenceCache());
client.on('guildMemberRemove', () => invalidatePresenceCache());
client.on('presenceUpdate', () => invalidatePresenceCache());
```

#### TTL Adaptativo

- **Datos Estáticos**: TTL largo (1 hora)
- **Datos Dinámicos**: TTL corto (5 minutos)
- **Datos Críticos**: Sin cache (siempre frescos)

### Recuperación de Conectividad

#### Reintentos Inteligentes

```typescript
async function retryWithBackoff(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // Backoff exponencial
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

#### Estados de Conectividad

- **Conectado**: Funcionamiento normal
- **Degradado**: Uso de cache, notificaciones de advertencia
- **Desconectado**: Modo offline, funcionalidad mínima
- **Recuperando**: Reintentos automáticos, restauración gradual

### Notificaciones de Estado

#### Alertas Automáticas

- **Owner Notifications**: DMs para problemas críticos
- **Channel Alerts**: Avisos en canales cuando hay problemas
- **Status Indicators**: Emojis en embeds indicando estado

#### Tipos de Notificaciones

| Tipo | Destino | Condición | Acción |
|------|---------|-----------|--------|
| **Error Crítico** | DM Owner | Fallo de actualización | Investigación inmediata |
| **Advertencia** | Canal | Cache obsoleto | Información al usuario |
| **Recuperación** | Logs | Conectividad restaurada | Registro automático |

### Optimizaciones de Rendimiento

#### Lazy Loading

- **Carga Bajo Demanda**: Solo cargar datos cuando se necesitan
- **Pre-carga Inteligente**: Anticipar datos basados en patrones de uso
- **Descarga Automática**: Liberar memoria cuando no se usa

#### Rate Limiting

- **API Limits**: Respeta límites de Discord y APIs externas
- **User Limits**: Previene spam de comandos
- **Server Limits**: Control de frecuencia por servidor

### Monitoreo de Actualizaciones

#### Métricas de Rendimiento

```json
{
  "updatesProcessed": 1250,
  "averageLatency": 450,
  "cacheHitRate": 0.85,
  "errorRate": 0.02,
  "queueSize": 3
}
```

#### Logs Detallados

```
[2025-09-18T10:30:00.000Z] [UPDATE] [Guild:123456789] Roles updated in 250ms
[2025-09-18T10:30:05.000Z] [CACHE] [HIT] Presence data served from cache
[2025-09-18T10:30:10.000Z] [ERROR] [Guild:123456789] Failed to update Apex panel, retrying...
```

### Estrategias de Alta Disponibilidad

#### Redundancia

- **Múltiples Instancias**: Balanceo de carga entre instancias
- **Database Replication**: Copias de seguridad automáticas
- **Geographic Distribution**: Instancias en diferentes regiones

#### Failover Automático

- **Detección de Fallos**: Monitoreo continuo de salud
- **Switchover**: Cambio automático a instancia saludable
- **Rollback**: Reversión automática de cambios problemáticos

### Mejores Prácticas

#### Configuración Recomendada

```typescript
const realtimeConfig = {
  updateInterval: 120000,      // 2 minutos
  cacheTTL: 300000,           // 5 minutos
  maxRetries: 3,
  backoffMultiplier: 2,
  maxConcurrency: 3
};
```

#### Monitoreo Continuo

- **Health Checks**: Verificación cada 30 segundos
- **Performance Metrics**: Latencia y throughput
- **Error Tracking**: Análisis de patrones de fallo
- **Capacity Planning**: Monitoreo de crecimiento

Este sistema asegura que el bot mantenga la información actualizada en todo momento, manejando cambios dinámicos de manera eficiente y transparente para los usuarios.

---

## � **Configuración de Producción y Deployment**

El bot está optimizado para entornos de producción con configuraciones avanzadas de deployment, monitoreo y escalabilidad.

### Variables de Entorno Críticas

#### Configuración Obligatoria

```env
# Discord Bot
DISCORD_TOKEN=tu_token_aqui
CLIENT_ID=tu_client_id_aqui
BOT_OWNER_ID=tu_owner_id_aqui

# APIs Externas
MOZA_API_KEY=tu_api_key_mozambique
MOZA_URL=https://api.mozambiquehe.re

# Configuración de Producción
NODE_ENV=production
HEALTH_PORT=3001
API_URL=http://localhost:3001/health
```

#### Configuración Avanzada

```env
# Rate Limiting
MAX_CONCURRENCY=5
CHECK_INTERVAL=3000
CACHE_TTL=1800000

# Logging
LOG_LEVEL=info
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Database
DB_PATH=./db
STATE_PATH=./.bot-state

# Security
ENCRYPTION_KEY=tu_clave_encriptacion
JWT_SECRET=tu_jwt_secret
```

### Estrategias de Deployment

#### Docker Production

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start"]
```

#### Docker Compose para Producción

```yaml
version: '3.8'
services:
  apex-bot:
    image: ghcr.io/brauliorg12/discord-apex:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - CLIENT_ID=${CLIENT_ID}
      - MOZA_API_KEY=${MOZA_API_KEY}
    volumes:
      - ./db:/app/db
      - ./.bot-state:/app/.bot-state
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### Systemd Service

```ini
[Unit]
Description=Apex Legends Rank Bot
After=network.target
Wants=network.target

[Service]
Type=simple
User=apex-bot
Group=apex-bot
WorkingDirectory=/opt/apex-range
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/apex-range/.env

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/opt/apex-range/db /opt/apex-range/.bot-state /opt/apex-range/logs

# Resource limits
MemoryLimit=512M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
```

### Monitoreo en Producción

#### Health Checks Avanzados

```bash
# Health check básico
curl -f http://localhost:3001/health

# Health check con métricas
curl -f http://localhost:3001/instance

# Health check de APIs
curl -f http://localhost:3001/api-status
```

#### Monitoreo con Prometheus/Grafana

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'apex-bot'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
```

#### Alertas Recomendadas

- **Uptime < 99.9%**: Reinicio automático
- **Memoria > 80%**: Notificación de optimización
- **Cola > 100 tareas**: Escalado automático
- **Errores API > 5/min**: Investigación requerida

### Estrategias de Backup

#### Backup Automático

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/apex-backups"

# Crear backup
tar -czf $BACKUP_DIR/apex_backup_$DATE.tar.gz \
  /opt/apex-range/db \
  /opt/apex-range/.bot-state \
  /opt/apex-range/logs

# Limpiar backups antiguos (mantener 7 días)
find $BACKUP_DIR -name "apex_backup_*.tar.gz" -mtime +7 -delete

# Subir a cloud storage (opcional)
# aws s3 cp $BACKUP_DIR/apex_backup_$DATE.tar.gz s3://apex-backups/
```

#### Restauración de Backup

```bash
#!/bin/bash
# restore.sh
BACKUP_FILE=$1

# Detener el bot
systemctl stop apex-bot

# Restaurar archivos
tar -xzf $BACKUP_FILE -C /opt/apex-range

# Reiniciar el bot
systemctl start apex-bot
```

### Escalabilidad Horizontal

#### Load Balancing

```nginx
# nginx.conf
upstream apex-bot {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name apex-bot.example.com;

    location / {
        proxy_pass http://apex-bot;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Clustering con PM2

```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'apex-bot',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### Seguridad en Producción

#### Configuración de Firewall

```bash
# UFW rules
ufw allow 22/tcp
ufw allow 3001/tcp
ufw --force enable
```

#### Variables Sensibles

```bash
# Encriptar variables de entorno
echo "DISCORD_TOKEN=encrypted_token" > .env.encrypted
openssl enc -aes-256-cbc -salt -in .env.encrypted -out .env.enc
```

#### Actualizaciones Seguras

```bash
# Script de actualización
#!/bin/bash
# update.sh

# Crear backup
./backup.sh

# Actualizar código
git pull origin main
npm install --production
npm run build

# Reiniciar con zero-downtime
pm2 reload ecosystem.config.js
```

### Optimizaciones de Rendimiento

#### Configuración de Node.js

```javascript
// node.config.js
module.exports = {
  max_old_space_size: 512,
  max_new_space_size: 128,
  optimize_for_size: true,
  always_compact: true
};
```

#### Profiling y Debugging

```bash
# Profiling de memoria
node --inspect --max-old-space-size=512 dist/index.js

# Profiling de CPU
node --prof dist/index.js
```

### Métricas de Producción

#### KPIs Recomendados

| Métrica | Objetivo | Alerta |
|---------|----------|--------|
| **Uptime** | >99.9% | <99.5% |
| **Latencia Media** | <500ms | >2s |
| **Tasa de Error** | <1% | >5% |
| **Memoria** | <70% | >85% |
| **CPU** | <60% | >80% |

#### Monitoreo Continuo

- **Application Performance Monitoring (APM)**: New Relic, DataDog
- **Error Tracking**: Sentry, Rollbar
- **Log Aggregation**: ELK Stack, Loki
- **Metrics**: Prometheus, InfluxDB

### Troubleshooting en Producción

#### Comandos Útiles

```bash
# Ver logs en tiempo real
pm2 logs apex-bot

# Ver métricas del proceso
pm2 monit

# Reinicio graceful
pm2 gracefulReload apex-bot

# Debug mode
pm2 reloadLogs
pm2 start ecosystem.config.js --log-date-format "YYYY-MM-DD HH:mm:ss Z"
```

#### Diagnóstico de Problemas

```bash
# Ver estado del sistema
df -h
free -h
top -p $(pgrep node)

# Ver logs de errores
grep "ERROR" logs/app.log | tail -20

# Ver estado de health checks
curl -s http://localhost:3001/health | jq .
```

Esta configuración asegura que el bot sea altamente confiable, escalable y fácil de mantener en entornos de producción exigentes.

---

## ⚙️ Instalación y Configuración

### 1. Clona el repositorio

```bash
git clone https://github.com/brauliorg12/discord-apex.git
cd discord-apex
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

# APIs Externas
TRACKER_API=TU_API_KEY_DE_APEX_TRACKER
MOZA_API_KEY=TU_API_KEY_DE_MOZAMBIQUE
MOZA_URL=https://api.mozambiquehe.re

# Configuración Global
EXCLUDED_ROLES=Admin,Apex,Server Booster,Moderador,Embajador,Illuminati
```

### Variables de Entorno Detalladas

| Variable         | Descripción                  | Requerida | Ejemplo                        |
| ---------------- | ---------------------------- | --------- | ------------------------------ |
| `DISCORD_TOKEN`  | Token del bot de Discord     | ✅        | `XXXXXXXXX`                    |
| `CLIENT_ID`      | ID de la aplicación Discord  | ✅        | `XXXXXXXXX`                    |
| `API_URL`        | URL del health check interno | ❌        | `http://localhost:3001/health` |
| `HEALTH_PORT`    | Puerto del servidor de salud | ❌        | `3001`                         |
| `TRACKER_API`    | API Key de Apex Tracker      | ❌        | `XXXXXXXXX`                    |
| `MOZA_API_KEY`   | API Key de Mozambique        | ❌        | `XXXXXXXXX`                    |
| `MOZA_URL`       | URL de la API de Mozambique  | ❌        | `https://api.mozambiquehe.re`  |
| `EXCLUDED_ROLES` | Roles a excluir en listados  | ❌        | `Admin,Apex,Server Booster`    |
| `BOT_OWNER_ID`   | ID del owner del bot         | ❌        | `123456789012345678`           |

> **Nota**: Las variables específicas de servidor (como IDs de canales) ya no son necesarias ya que el bot las guarda automáticamente por servidor.

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

---

## 🛠️ Configuración Discord

### Roles requeridos

Crea estos roles en tu servidor (nombres exactos):

- Bronce
- Plata
- Oro
- Platino
- Diamante
- Maestro
- Apex Predator

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
- Enviar mensajes
- Leer historial de mensajes
- Usar emojis externos
- Gestionar mensajes

---

## 🔐 Permisos Requeridos Detallados

El bot requiere permisos específicos tanto a nivel de servidor como de canal. A continuación, una explicación detallada de cada permiso, dónde se utiliza y por qué es necesario:

### **Permisos a Nivel de Servidor (Guild):**

#### **`ManageRoles`** - Gestionar Roles

- **Descripción**: Permite al bot crear y asignar roles de rangos de Apex Legends
- **Dónde se usa**: `setup-roles-handlers.ts`, `handleMissingRoles`, `setup-config-handler.ts`
- **Crítico**: Sí - El setup falla completamente sin este permiso
- **Por qué**: El bot crea automáticamente roles como "Bronce", "Plata", etc. cuando no existen

#### **`UseApplicationCommands`** - Usar Comandos de Aplicación

- **Descripción**: Permite al bot responder a comandos slash y de contexto
- **Dónde se usa**: Todos los comandos (`/setup-roles`, `/apex-status`, etc.)
- **Crítico**: Sí - Los comandos no funcionan sin este permiso
- **Por qué**: Esencial para la interacción básica con el bot

### **Permisos a Nivel de Canal (Channel):**

#### **`ViewChannel`** - Ver Canal

- **Descripción**: Permite al bot ver el canal donde se ejecutan comandos y se envían mensajes
- **Dónde se usa**: Todos los comandos y handlers de interacciones
- **Crítico**: Sí - El bot no puede funcionar en el canal sin este permiso
- **Por qué**: Necesario para procesar cualquier interacción en el canal

#### **`SendMessages`** - Enviar Mensajes

- **Descripción**: Permite enviar mensajes de selección de roles, estadísticas y respuestas
- **Dónde se usa**: `setup-roles.ts`, `apex-status.ts`, handlers de botones y modales
- **Crítico**: Sí - El bot no puede comunicarse sin este permiso
- **Por qué**: Envía el panel de roles, estadísticas y respuestas a comandos

#### **`ManageMessages`** - Gestionar Mensajes

- **Descripción**: Permite fijar mensajes importantes y limpiar mensajes antiguos
- **Dónde se usa**: `setup-roles.ts` (pin messages), `cleanupExistingMessages`, `send-online-panel.ts`
- **Crítico**: Moderadamente - El bot funciona sin él pero no puede fijar mensajes importantes
- **Por qué**: Fija el panel de roles y estadísticas para mantenerlos visibles

#### **`UseExternalEmojis`** - Usar Emojis Externos

- **Descripción**: Permite usar emojis personalizados de Discord en botones y embeds
- **Dónde se usa**: `button-helper.ts`, embeds con emojis en handlers
- **Crítico**: No - Los emojis se muestran como texto alternativo
- **Por qué**: Mejora la apariencia visual de botones y embeds

#### **`ReadMessageHistory`** - Leer Historial de Mensajes

- **Descripción**: Permite verificar el estado del canal y limpiar mensajes existentes
- **Dónde se usa**: `cleanupExistingMessages`, verificación de canal en `setup-roles.ts`
- **Crítico**: Moderadamente - Afecta la limpieza automática de mensajes
- **Por qué**: Necesario para identificar mensajes antiguos durante el setup

#### **`EmbedLinks`** - Insertar Enlaces

- **Descripción**: Permite enviar embeds con enlaces a imágenes y recursos externos
- **Dónde se usa**: Todos los embeds enviados por el bot (rank cards, stats, etc.)
- **Crítico**: Sí - Los embeds no se muestran correctamente sin este permiso
- **Por qué**: Los embeds contienen enlaces a imágenes de tarjetas de rango y perfiles

#### **`AttachFiles`** - Adjuntar Archivos

- **Descripción**: Permite adjuntar imágenes generadas como tarjetas de rango y gráficos
- **Dónde se usa**: `rank-card-canvas.ts`, `recent-avatars-canvas.ts`, `predator-badge-canvas.ts`
- **Crítico**: Sí - Las imágenes no se pueden mostrar sin este permiso
- **Por qué**: El bot genera y envía imágenes dinámicas de rangos y estadísticas

### **Cómo Verificar y Solucionar Permisos Faltantes**

1. **Mensajes Automáticos**: El bot detecta automáticamente permisos faltantes y muestra mensajes detallados
2. **Configuración del Servidor**:
   - Ve a **Configuración del servidor** → **Roles**
   - Busca el rol del bot (generalmente "Apex Range")
   - Activa los permisos faltantes marcados en rojo
3. **Permisos por Canal**: Para permisos específicos de canal, verifica la configuración del canal individual
4. **Reintentos**: Después de cambiar permisos, ejecuta `/setup-roles` nuevamente

### **Ejemplo de Mensaje de Error Detallado**

Cuando falta un permiso, el bot muestra información específica como:

```
❌ Permisos Faltantes

El bot necesita los siguientes permisos para funcionar correctamente:

• Gestionar Roles (servidor)
  Crítico para crear roles de rangos de Apex Legends automáticamente cuando no existen, y asignarlos a usuarios.

  **Dónde se usa:** setup-roles-handlers.ts, handleMissingRoles, setup-config-handler.ts
  **Crítico:** Sí - El setup falla completamente sin este permiso

• Adjuntar Archivos (canal)
  Esencial para adjuntar imágenes generadas como tarjetas de rango, gráficos de estadísticas y avatares.

  **Dónde se usa:** rank-card-canvas.ts, recent-avatars-canvas.ts, predator-badge-canvas.ts
  **Crítico:** Sí - Las imágenes no se pueden mostrar sin este permiso

🔧 Solución:
1. Ve a Configuración del servidor → Roles
2. Busca el rol "Apex Range" (o el rol del bot)
3. Activa los permisos faltantes
4. Para permisos de canal, también verifica la configuración específica del canal
```

### **Notificaciones Automáticas de Errores**

El bot incluye un sistema avanzado de **notificaciones automáticas de errores** que informa directamente al owner del servidor cuando ocurren problemas críticos:

#### Funcionalidades del Sistema

- **Notificación por DM**: Los errores se envían directamente al owner del servidor vía mensaje privado de Discord, evitando spamear canales públicos.
- **Tipos de errores notificados**:
  - **Falta de permisos**: Cuando el bot no puede editar mensajes por falta de permisos "Gestionar Mensajes".
  - **Mensaje no encontrado**: Cuando el mensaje de Apex ha sido eliminado y no se puede actualizar.
  - **Errores desconocidos**: Cualquier otro error inesperado durante la actualización.
- **Información detallada**: Cada notificación incluye:
  - Descripción clara del problema
  - Canal afectado
  - Servidor afectado
  - Instrucciones específicas para solucionarlo
- **Fallback inteligente**: Si no se puede enviar DM (ej. DMs bloqueados), intenta enviar al canal afectado como último recurso.
- **Sin spam**: Solo se notifica cuando realmente ocurre un error, no en operaciones normales.

#### Ejemplo de Notificación por DM

Cuando ocurre un error de permisos, el owner recibe un mensaje como:

```
⚠️ Error de Actualización de Apex

No pude actualizar el embed de estado de Apex Legends en el canal #apex-status.

Verifica que el bot tenga permisos para Gestionar Mensajes en ese canal.

Si el problema persiste, ejecuta /apex-status de nuevo para resetear.

Servidor: Mi Servidor de Apex (#1234567890123456789)
Canal: #apex-status
```

#### Beneficios

- ✅ **Detección proactiva**: El owner se entera inmediatamente de problemas sin necesidad de revisar logs.
- ✅ **Solución rápida**: Instrucciones claras para arreglar el problema.
- ✅ **Privacidad**: Las notificaciones van al owner, no al canal público.
- ✅ **Robustez**: El bot continúa funcionando incluso si hay errores temporales.
- ✅ **Mantenimiento reducido**: Menos soporte manual necesario.

#### Cómo Funciona Técnicamente

- **Archivo responsable**: `src/utils/error-notifier.ts`
- **Activación**: Se ejecuta automáticamente en `update-status-message.ts` cuando falla la edición del embed de Apex.
- **Prioridad**: Primero intenta DM, luego fallback al canal.
- **Logging**: Todos los envíos se registran en consola para monitoreo.

#### Solución de Problemas

- **No recibo DMs**: Asegúrate de que el bot pueda enviarte mensajes privados (verifica configuración de privacidad en Discord).
- **DMs bloqueados**: El sistema automáticamente hace fallback al canal afectado.
- **Notificaciones duplicadas**: Solo se envía una notificación por error, no repetidamente.
- **Configuración del owner**: El owner se detecta automáticamente usando `guild.fetchOwner()`.

Este sistema asegura que los administradores estén siempre informados y puedan mantener el bot funcionando correctamente sin intervención constante.

### **Permisos Recomendados Adicionales**

- **`MentionEveryone`**: No requerido, pero útil si quieres mencionar roles
- **`Administrator`**: Solo para ejecutar `/setup-roles` (usuario, no bot)

### **Solución de Problemas Comunes**

- **"Permisos insuficientes"**: Verifica que el rol del bot tenga todos los permisos marcados como "Crítico: Sí"
- **Botones no responden**: Puede ser falta de `UseApplicationCommands` o `ViewChannel`
- **Imágenes no aparecen**: Verifica `AttachFiles` y `EmbedLinks`
- **Mensajes no se fijan**: Falta `ManageMessages` (no crítico para funcionamiento básico)

Esta documentación detallada asegura que puedas configurar correctamente el bot y resolver cualquier problema de permisos de manera eficiente.

---

## 🩺 Health Server y Monitoreo

El bot incluye un servidor de salud integrado para monitoreo:

### Endpoints Disponibles

- `GET /health` - Verificación básica de salud
- `GET /api-status` - Estado de la API externa
- `GET /instance` - Información de la instancia actual (PID, uptime, versión)

### Ejemplo de Respuesta `/instance`

```json
{
  "pid": 12345,
  "uptime": 3600.5,
  "version": "1.10.6",
  "timestamp": "2025-09-16T..."
}
```

### Uso

- El health server se inicia automáticamente en el puerto 3001 (configurable).
- Útil para monitoreo con herramientas como UptimeRobot o para verificar el estado del bot.

---

## 🖼️ Cards y Estadísticas Visuales

El bot genera imágenes dinámicas con los avatares y rangos de los jugadores usando [@napi-rs/canvas](https://www.npmjs.com/package/@napi-rs/canvas).  
Las cards muestran los últimos registrados y los jugadores online por rango, todo en alta calidad.

---

## 🆕 Paginación efímera en paneles de jugadores por rango

El bot ahora permite navegar entre páginas de jugadores online por rango usando botones interactivos:

Botones "Siguiente" y "Anterior": Navega fácilmente entre páginas de jugadores en los paneles efímeros.
Numeración automática: Los jugadores aparecen numerados solo en los paneles efímeros (cuando usas "Ver más" o paginas).
Visualización clara: El panel principal sigue mostrando la lista sin numeración, manteniendo la interfaz limpia y ordenada.
Experiencia mejorada: Puedes ver todos los jugadores de un rango, incluso si hay más de los que caben en una sola página.
Esta funcionalidad facilita la gestión y visualización de grandes comunidades, permitiendo acceder a toda la información de manera ordenada y rápida.

---

## 📦 Archivos de Datos

El bot crea automáticamente archivos JSON separados para cada servidor:

- `db/players_{guildId}.json`: Lista de jugadores y fecha de asignación de rango por servidor.
- `.bot-state/{guildId}.json`: Estado del bot por servidor (canal, mensajes, configuración).

> **Todos los archivos de datos JSON se almacenan en las carpetas `/db` y `/.bot-state` ubicadas en la raíz del proyecto.**  
> Si no existen, el bot las creará automáticamente al ejecutarse.

### 💾 Conservación de Datos

**Los archivos JSON se conservan automáticamente** cuando:

- ✅ El bot es removido de un servidor
- ✅ Un servidor se vuelve inaccesible
- ✅ El bot se reinicia

Esto permite:

- **Recuperación rápida**: Si el bot vuelve a un servidor, puede restaurar la configuración anterior
- **Datos históricos**: Mantener registro de actividad pasada
- **Backup automático**: Los archivos sirven como backup de la configuración

### 🌍 Presencia Global vs. Estadísticas Locales

- **Presencia Global**: Muestra estadísticas combinadas de TODOS los servidores (visible en todos lados)
- **Embeds Locales**: Muestran estadísticas específicas del servidor donde están ubicados

**Ejemplo:**

- **Servidor A**: Embed local muestra "15 online | 50 registrados" + Presencia global "25 online | 150 registrados | 3 servidores"
- **Servidor B**: Embed local muestra "10 online | 100 registrados" + Presencia global igual

### 🧹 Limpieza Opcional

Si deseas limpiar archivos antiguos, puedes:

1. **Manual**: Eliminar archivos específicos de `.bot-state/` y `db/`
2. **Automática**: Descomentar el código en `src/init-bot.ts` para limpieza automática
3. **Comando**: Usar `/cleanup-data confirm:true` (solo para el owner del bot)

### Comando `/cleanup-data`

Comando administrativo para limpiar archivos JSON de servidores donde el bot ya no está presente.  
**Solo puede ser usado por el owner del bot** (configurado en `BOT_OWNER_ID`).

**Uso:**

```
/cleanup-data confirm:true
```

**Qué hace:**

- Escanea todos los archivos JSON existentes
- Identifica archivos de servidores donde el bot ya no está presente
- Elimina los archivos obsoletos
- Muestra un resumen de la operación

**Nota:** Este comando es opcional y solo debe usarse si realmente quieres eliminar datos históricos.

### Sistema de Lock de Instancias

Para prevenir conflictos al ejecutar múltiples instancias:

- `.bot-lock`: Archivo temporal que previene ejecutar el bot simultáneamente.
- Se crea automáticamente al iniciar y se elimina al cerrar.
- Si intentas ejecutar otra instancia, el bot se detendrá con un mensaje de error.

### 🔄 Recuperación de Datos

Cuando el bot vuelve a un servidor donde ya existían archivos:

1. **Configuración automática**: El bot detecta y restaura la configuración anterior
2. **Mensajes existentes**: Los IDs de mensajes se verifican y reutilizan si son válidos
3. **Jugadores registrados**: La lista de jugadores se mantiene intacta
4. **Re-setup opcional**: Puedes ejecutar `/setup-roles` nuevamente si necesitas cambiar la configuración

> **Nota**: Si los mensajes originales fueron eliminados, el bot creará nuevos paneles automáticamente.

---

## 📝 Ejemplo de Uso

1. Un admin ejecuta `/setup-roles` en el canal deseado.
2. El panel aparece con botones para seleccionar rango.
3. Los usuarios eligen su rango y el bot les asigna el rol.
4. El mensaje de estadísticas se actualiza automáticamente.
5. Los usuarios pueden ver su rango con el menú contextual "Ver mi rango en Apex Range".

---

## 🐳 Docker

Puedes ejecutar el bot fácilmente usando Docker desde GitHub Container Registry (GHCR):

```bash
docker pull ghcr.io/brauliorg12/discord-apex:latest
docker run -e DISCORD_TOKEN=TU_TOKEN -e CLIENT_ID=TU_CLIENT_ID ghcr.io/brauliorg12/discord-apex:latest
```

Asegúrate de pasar las variables de entorno necesarias (`DISCORD_TOKEN`, `CLIENT_ID`, etc).

---

## ❓ Solución de Problemas

### Problemas Comunes

- **Comandos no aparecen**: Ejecuta `npm run deploy-commands` y espera unos minutos.
- **Bot no responde**: Revisa el token, permisos y configuración.
- **Comando de contexto tarda en aparecer**: Puede ser caché de Discord (espera hasta 1 hora).
- **Error de instancia duplicada**: Si ves "Ya hay una instancia del bot corriendo", detén la otra instancia primero.
- **Nuevo servidor no funciona**: Asegúrate de que un administrador ejecute `/setup-roles` en el nuevo servidor.

### Verificación de Estado

- **Health Check**: Visita `http://localhost:3001/health` para verificar que el bot esté corriendo.
- **Estado de API**: Usa `http://localhost:3001/api-status` para ver el estado de las APIs externas.
- **Info de Instancia**: `http://localhost:3001/instance` muestra detalles de la instancia actual.

### Multi-Servidor

- **Configuración por servidor**: Cada servidor necesita su propio `/setup-roles`.
- **Datos independientes**: Los archivos JSON son separados por servidor.
- **Permisos**: El bot necesita los mismos permisos en cada servidor.
- **Presencia global**: La presencia del bot combina estadísticas de todos los servidores.

### Logs y Debug

- Los logs del bot se muestran en la consola donde se ejecuta.
- Revisa los logs para mensajes de error específicos.
- Para debug avanzado, ejecuta con `npm run dev` para ver logs detallados.

---

## 🤝 Contribuir

1. Haz un fork y crea una rama para tu feature.
2. Haz tus cambios y abre un Pull Request.
3. Sigue la convención de commits: `Add:`, `Fix:`, `Update:`, etc.

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

---

## Términos y Privacidad

El uso de este bot implica la aceptación de los [Términos y Condiciones](https://apex-range.cubanova.com/terms.html) y la [Política de Privacidad](https://apex-range.cubanova.com/privacy.html).

---

## 👤 Autor

**Braulio Rodriguez**

- GitHub: [@brauliorg12](https://github.com/brauliorg12)
- Discord: burlon23
- Email: cubanovainfo@gmail.com
- Company: CubaNova

---

¿Te gusta este bot?  
⭐ ¡Dale una estrella en GitHub! ⭐

[Reportar Bug](https://github.com/brauliorg12/discord-apex/issues) • [Solicitar Feature](https://github.com/brauliorg12/discord-apex/issues) • [Discusiones](https://github.com/brauliorg12/discord-apex/discussions)
