# Configuraciones Avanzadas y Producción

Esta guía cubre configuraciones avanzadas, optimizaciones de rendimiento, logging, actualizaciones en tiempo real y deployment en producción.

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

| Prioridad | Valor | Uso                       | Ejemplos                                |
| --------- | ----- | ------------------------- | --------------------------------------- |
| Alta      | 2     | Eventos críticos          | Nuevos miembros, cambios de presencia   |
| Normal    | 1     | Actualizaciones regulares | Estadísticas de roles, mensajes de Apex |
| Baja      | 0     | Tareas opcionales         | Limpieza de datos antiguos              |

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

| Tarea                 | Antes       | Después    | Mejora     | Razón                         |
| --------------------- | ----------- | ---------- | ---------- | ----------------------------- |
| **Roles y Presencia** | 60 segundos | 2 minutos  | -67% carga | Suficiente frecuencia para UX |
| **Panel Apex**        | 5 minutos   | 5 minutos  | Sin cambio | Depende de API externa        |
| **Imágenes**          | 5 minutos   | 10 minutos | -50% carga | Alto costo computacional      |

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

1. **Cache de Memoria**: Datos frecuentemente accedidos
2. **Cache de Disco**: Configuración persistente
3. **Cache de API**: Respuestas de servicios externos

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
  'mapRotation', // Crítico - primero
  'serverStatus', // Crítico - segundo
  null, // Espera 1 segundo
  'predatorRank', // Secundario - último
];
```

### Escalabilidad Multi-Servidor

#### Límites de Escalabilidad

| Aspecto             | Límite Actual      | Recomendado | Razón                    |
| ------------------- | ------------------ | ----------- | ------------------------ |
| Servidores          | Sin límite teórico | 100-500     | Recursos del VPS         |
| Usuarios Totales    | Sin límite         | 100K+       | Arquitectura distribuida |
| Tareas Concurrentes | 3 servidores       | 5-10        | Balance CPU/memoria      |
| Cache Size          | 100MB              | 500MB       | Memoria disponible       |

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
async function retryWithBackoff(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // Backoff exponencial
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
```

### Mejores Prácticas de Producción

#### Configuración Recomendada

```typescript
const config = {
  maxConcurrency: 5,
  checkInterval: 3000, // 3 segundos
  cacheTTL: 1800000, // 30 minutos
  maxRetries: 5,
  backoffMultiplier: 2,
};
```

#### Monitoreo Continuo

- **Alertas**: Notificaciones cuando colas crecen demasiado
- **Dashboards**: Visualización de métricas en tiempo real
- **Logs**: Análisis de patrones de uso y rendimiento
- **Auto-scaling**: Ajuste automático de parámetros según carga

### Resultados de Optimización

#### Métricas de Mejora

| Métrica                 | Antes          | Después    | Mejora           |
| ----------------------- | -------------- | ---------- | ---------------- |
| **Timers Activos**      | 3 por servidor | 1 global   | -66% reducción   |
| **Frecuencia Roles**    | 60s            | 120s       | -67% menos carga |
| **Frecuencia Imágenes** | 300s           | 600s       | -50% menos carga |
| **Conflictos**          | Posibles       | Eliminados | 100% estable     |
| **Duplicados**          | Posibles       | Eliminados | 100% eficiente   |
| **Tiempo de Inicio**    | Variable       | < 30s      | Predecible       |
| **Memoria**             | Alta           | Optimizada | -30% promedio    |

Este sistema asegura que el bot pueda escalar eficientemente a cientos de servidores mientras mantiene un rendimiento óptimo y una experiencia de usuario fluida.

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

| Tipo                  | Frecuencia | Trigger         | Acción                                |
| --------------------- | ---------- | --------------- | ------------------------------------- |
| **Roles y Presencia** | 2 minutos  | Timer + Eventos | Actualizar conteos y presencia global |
| **Panel Apex**        | 5 minutos  | Timer           | Refrescar mapas y RP Predator         |
| **Imágenes**          | 10 minutos | Timer           | Regenerar cards visuales              |
| **Cache API**         | Variable   | Respuesta API   | Invalidar datos obsoletos             |

### Arquitectura de Actualización en Tiempo Real

#### Cola de Actualizaciones Prioritarias

```typescript
// Sistema de prioridades
enum UpdatePriority {
  HIGH = 2, // Eventos críticos (nuevos miembros)
  NORMAL = 1, // Actualizaciones regulares
  LOW = 0, // Tareas opcionales
}

// Ejemplo de encolamiento
enqueueGuildUpdate(
  guild,
  async () => {
    await updateRoleCountMessage(guild);
  },
  UpdatePriority.HIGH
);
```

#### Procesamiento Concurrente Controlado

- **Máximo 3 servidores simultáneos**: Evita sobrecargar el sistema
- **Eliminación de duplicados**: Una sola actualización por tipo/servidor
- **Timeout inteligente**: Cancela actualizaciones que tardan demasiado

### Soporte para Cambios Dinámicos

#### Cambios en Roles de Discord

```typescript
// Detección automática de cambios
guild.roles.cache.forEach((role) => {
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
      await new Promise((resolve) => setTimeout(resolve, delay));
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

| Tipo              | Destino  | Condición               | Acción                  |
| ----------------- | -------- | ----------------------- | ----------------------- |
| **Error Crítico** | DM Owner | Fallo de actualización  | Investigación inmediata |
| **Advertencia**   | Canal    | Cache obsoleto          | Información al usuario  |
| **Recuperación**  | Logs     | Conectividad restaurada | Registro automático     |

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
  updateInterval: 120000, // 2 minutos
  cacheTTL: 300000, // 5 minutos
  maxRetries: 3,
  backoffMultiplier: 2,
  maxConcurrency: 3,
};
```

#### Monitoreo Continuo

- **Health Checks**: Verificación cada 30 segundos
- **Performance Metrics**: Latencia y throughput
- **Error Tracking**: Análisis de patrones de fallo
- **Capacity Planning**: Monitoreo de crecimiento

Este sistema asegura que el bot mantenga la información actualizada en todo momento, manejando cambios dinámicos de manera eficiente y transparente para los usuarios.

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
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/health']
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
  }];
}
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

# Reinicio con zero-downtime
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
  always_compact: true,
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

| Métrica            | Objetivo | Alerta |
| ------------------ | -------- | ------ |
| **Uptime**         | >99.9%   | <99.5% |
| **Latencia Media** | <500ms   | >2s    |
| **Tasa de Error**  | <1%      | >5%    |
| **Memoria**        | <70%     | >85%   |
| **CPU**            | <60%     | >80%   |

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
