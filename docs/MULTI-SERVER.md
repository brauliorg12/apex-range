# Multi-Servidor y Inicialización

Esta guía explica las funcionalidades multi-servidor de Apex Legends Rank Bot y cómo maneja la inicialización y recuperación automática.

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
  "version": "1.19.0"
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

| Métrica               | Valor Típico | Umbral de Alerta |
| --------------------- | ------------ | ---------------- |
| Tiempo de Inicio      | < 30s        | > 60s            |
| Memoria al Inicio     | < 100MB      | > 200MB          |
| CPU al Inicio         | < 20%        | > 50%            |
| Tasa de Éxito de APIs | > 95%        | < 90%            |
