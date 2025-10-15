# 📊 Sistema de Logs Organizado por Días

El bot implementa un **sistema avanzado de logging** con organización automática por días y tipos de log para facilitar el monitoreo, debugging y mantenimiento.

## 📁 Estructura de Logs

```
logs/
├── app/
│   └── 2025-09-20/
│       ├── app-2025-09-20_part1.log
│       └── app-2025-09-20_part2.log (si supera 5MB)
├── interactions/
│   └── 2025-09-20/
│       ├── interactions-2025-09-20_part1.log
│       └── interactions-2025-09-20_part2.log (si supera 5MB)
├── canvas/
│   └── 2025-09-20/
│       ├── canvas-2025-09-20_part1.log
│       └── canvas-2025-09-20_part2.log (si supera 5MB)
├── guilds/
│   └── 2025-09-20/
│       ├── guild_123456789_Server1_part1.log
│       ├── guild_123456789_Server1_part2.log (si supera 5MB)
│       └── guild_987654321_Server2_part1.log
└── global/
    └── 2025-09-20/
        ├── global-2025-09-20_part1.log
        └── global-2025-09-20_part2.log (si supera 5MB)
```

## 🔍 Tipos de Log

### App Logs (`logs/app/`)

- **Propósito**: Logs generales del bot y operaciones principales
- **Contenido**: Inicio del bot, conexiones, errores generales, health checks
- **Frecuencia**: Eventos importantes del sistema

### Interaction Logs (`logs/interactions/`)

- **Propósito**: Registro detallado de comandos y botones usados
- **Contenido**: Todos los slash commands, botones presionados, menús contextuales
- **Formato**: `Tipo: Command | Usuario: name#1234 | Guild: ServerName | Comando: setup-roles`

### Canvas Logs (`logs/canvas/`)

- **Propósito**: Logs específicos de generación de imágenes y cards
- **Contenido**: Creación de cards de rango, renders de canvas, errores de imagen
- **Utilidad**: Debugging de problemas visuales y rendimiento de imágenes

### Guild Logs (`logs/guilds/`)

- **Propósito**: Logs específicos por servidor con información detallada
- **Contenido**: Configuración por servidor, errores específicos, operaciones de setup
- **Estructura**: Un archivo por servidor por día
- **Nombre**: `guild_{guildId}_{guildName}.log`

### Global Logs (`logs/global/`)

- **Propósito**: Logs globales del sistema y errores generales
- **Contenido**: Eventos que afectan múltiples servidores, errores críticos
- **Utilidad**: Monitoreo general del sistema

## ⚡ Características del Sistema

### Rotación Automática

- **Archivos diarios**: Cada día se crea automáticamente un nuevo archivo
- **Fecha en nombre**: `tipo-YYYY-MM-DD_partN.log`
- **Rotación por tamaño**: Cuando un archivo alcanza 5MB, automáticamente se crea una nueva parte
- **Numeración incremental**: Los archivos se numeran secuencialmente (_part1, _part2, etc.)
- **Sin intervención manual**: El sistema maneja la rotación automáticamente

### Organización Jerárquica

- **Carpetas por tipo**: Fácil navegación y búsqueda
- **Subcarpetas por fecha**: Agrupación lógica de logs
- **Estructura predecible**: Siempre sabes dónde encontrar un log específico

### Separación por Servidor

- **Logs independientes**: Cada servidor tiene sus propios archivos
- **Aislamiento de datos**: Problemas de un servidor no afectan otros logs
- **Fácil debugging**: Enfocarte en un servidor específico

### Optimización de Rendimiento

- **Archivos más pequeños**: Los logs diarios son más manejables y se dividen automáticamente
- **Límite de 5MB por archivo**: Cada archivo se limita a 5MB antes de crear una nueva parte
- **Búsqueda rápida**: `grep` y herramientas de búsqueda funcionan mejor con archivos más pequeños
- **Menos I/O**: Rotación automática previene archivos gigantes que afectan el rendimiento
- **Prevención de problemas**: Servidores con mucha actividad no generan archivos inmanejables

### Consistencia Horaria

- **Zona horaria UTC**: Todos los logs usan la misma zona horaria
- **Consistencia global**: Fácil correlacionar eventos entre servidores
- **Formato ISO**: `2025-09-20T12:46:51.822Z`

## 📋 Uso y Comandos Útiles

### Ver Logs en Tiempo Real

```bash
# Ver logs de app del día actual (última parte)
tail -f logs/app/2025-09-20/app-2025-09-20_part*.log

# Ver interacciones de un servidor específico (todas las partes)
tail -f logs/guilds/2025-09-20/guild_335236834621652994_Shooters_Forever_part*.log

# Ver todos los errores de hoy (en todas las partes)
grep "ERROR" logs/*/2025-09-20/*.log

# Ver solo la última parte de logs de un guild
tail -f $(ls -t logs/guilds/2025-09-20/guild_335236834621652994_* | head -1)
```

### Buscar Eventos Específicos

```bash
# Buscar comandos setup-roles ejecutados
grep "setup-roles" logs/interactions/2025-09-20/interactions-2025-09-20.log

# Buscar errores en un servidor específico
grep "ERROR" logs/guilds/2025-09-20/guild_335236834621652994_*.log

# Contar interacciones por usuario
grep "Usuario:" logs/interactions/2025-09-20/interactions-2025-09-20.log | sort | uniq -c | sort -nr
```

### Análisis de Logs

```bash
# Ver tamaño de logs por día
du -sh logs/*/*/

# Contar líneas de log por tipo
wc -l logs/*/*/*.log

# Buscar patrones específicos
grep "Opciones deserializadas" logs/guilds/2025-09-20/*.log
```

## 🔧 Configuración Avanzada

### Variables de Entorno

```env
# Directorio base para logs (opcional)
LOG_DIR=./logs

# Nivel de logging (opcional)
LOG_LEVEL=info
```

### Personalización

- **Rotación personalizada**: Modificar `getCurrentDateString()` para cambiar el formato de fecha
- **Compresión automática**: Agregar compresión gzip para logs antiguos
- **Retención configurable**: Configurar eliminación automática de logs antiguos

## 🚨 Monitoreo y Alertas

### Métricas Importantes

- **Tamaño de logs**: Monitorear crecimiento para detectar anomalías
- **Frecuencia de errores**: Contar errores por tipo y servidor
- **Actividad de usuarios**: Analizar patrones de uso

### Alertas Recomendadas

```bash
# Alertar si hay muchos errores en un día
ERROR_COUNT=$(grep -c "ERROR" logs/app/2025-09-20/app-2025-09-20.log)
if [ $ERROR_COUNT -gt 100 ]; then
    echo "Alerta: Muchos errores detectados ($ERROR_COUNT)"
fi

# Verificar que los logs se están escribiendo
if [ ! -f "logs/app/$(date +%Y-%m-%d)/app-$(date +%Y-%m-%d).log" ]; then
    echo "Alerta: No se están generando logs de app"
fi
```

## 📊 Ejemplos de Logs

### Log de App

```
[2025-09-20T12:46:51.822Z] [App] [HealthServer] Escuchando en el puerto 3001
[2025-09-20T12:46:51.822Z] [App] Bot conectado como Apex Range#7121
[2025-09-20T12:46:52.556Z] [App] Actualización de roles y presencia ejecutada
```

### Log de Interacciones

```
[2025-09-20T12:49:28.450Z] [Interaction] Tipo: ChatInputCommand | Usuario: burlon23 (335236507340111873) | Guild: Shooters Forever | Comando: setup-roles | Detalles: modo: manual, canal_admin: apex-range-admin, canal_publico: apex-rangos
[2025-09-20T12:49:50.461Z] [Interaction] Tipo: Button | Usuario: burlon23 (335236507340111873) | Guild: Shooters Forever | CustomId: continue_setup:eyJtb2RvIjoibWFudWFsIiwiY2FuYWxfYWRtaW4iOiJhcGV4LXJhbmdlLWFkbWluIiwiY2FuYWxfcHVibGljbyI6ImFwZXgtcmFuZ29zIn0=
```

```
[2025-09-20T12:49:28.450Z] [Interaction] Tipo: ChatInputCommand | Usuario: burlon23 (335236507340111873) | Guild: Shooters Forever | Comando: setup-roles | Detalles: modo: manual, control_channel_name: apex-admin, panel_channel_name: apex-rangos
[2025-09-20T12:49:50.461Z] [Interaction] Tipo: Button | Usuario: burlon23 (335236507340111873) | Guild: Shooters Forever | CustomId: continue_setup:eyJtb2RvIjoibWFudWFsIiwiY29udHJvbENoYW5uZWxOYW1lIjoiYXBleC1hZG1pbiIsInBhbmVsQ2hhbm5lbE5hbWUiOiJhcGV4LXJhbmdvcyJ9
```

```
[2025-09-20T12:49:28.450Z] [Interaction] Tipo: ChatInputCommand | Usuario: burlon23 (335236507340111873) | Guild: Shooters Forever | Comando: setup-roles | Detalles: Options: []
[2025-09-20T12:49:50.461Z] [Interaction] Tipo: Button | Usuario: burlon23 (335236507340111873) | Guild: Shooters Forever | CustomId: continue_setup:eyJjb250cm9sQ2hhbm5lbE5hbWUiOiJhcGV4LXJhbmdlLWFkbWluIn0=
```

### Log de Guild

```
[2025-09-20T12:53:40.016Z] [INFO] [Guild:335236834621652994] Modo seleccionado: manual
[2025-09-20T12:53:40.016Z] [INFO] [Guild:335236834621652994] Nombre personalizado para canal de control: apex-range-admin
[2025-09-20T12:53:40.017Z] [INFO] [Guild:335236834621652994] Nombre personalizado para canal del panel: apex-rangos
[2025-09-20T12:53:40.017Z] [ERROR] [Guild:335236834621652994] El bot no tiene permisos para crear canales (ManageChannels)
```

```
[2025-09-20T12:53:40.016Z] [INFO] [Guild:335236834621652994] Modo seleccionado: manual
[2025-09-20T12:53:40.016Z] [INFO] [Guild:335236834621652994] Nombre personalizado para canal de control: apex-admin
[2025-09-20T12:53:40.017Z] [INFO] [Guild:335236834621652994] Nombre personalizado para canal del panel: apex-rangos
[2025-09-20T12:53:40.017Z] [ERROR] [Guild:335236834621652994] El bot no tiene permisos para crear canales (ManageChannels)
```

```
[2025-09-20T12:53:40.016Z] [INFO] [Guild:335236834621652994] Opciones deserializadas del botón: {"controlChannelName": "apex-range-admin"}
[2025-09-20T12:53:40.017Z] [INFO] [Guild:335236834621652994] Nombre personalizado para canal de control: apex-range-admin
[2025-09-20T12:53:40.017Z] [ERROR] [Guild:335236834621652994] El bot no tiene permisos para crear canales (ManageChannels)
```

## 🎯 Mejores Prácticas

### Monitoreo Diario

1. **Revisar logs de errores**: Buscar patrones de errores recurrentes
2. **Verificar actividad**: Confirmar que el bot está procesando comandos
3. **Monitorear rendimiento**: Revisar tiempos de respuesta y frecuencia de operaciones

### Debugging

1. **Logs específicos**: Usar logs de guild para problemas de un servidor
2. **Logs de interacciones**: Verificar que los comandos se están procesando
3. **Logs de app**: Revisar errores generales del sistema

### Mantenimiento

1. **Limpieza periódica**: Eliminar logs antiguos (más de 30 días)
2. **Compresión**: Comprimir logs históricos para ahorrar espacio
3. **Backup**: Mantener backup de logs importantes

## 🔗 Integración con Otras Herramientas

### ELK Stack

```yaml
# Filebeat configuration
filebeat.inputs:
  - type: log
    paths:
      - /path/to/apex-range/logs/**/*.log
    processors:
      - dissect:
          tokenizer: '[%{TIMESTAMP}] [%{LEVEL}] [%{CATEGORY}] %{MESSAGE}'
          field: 'message'
```

### Grafana + Loki

```yaml
# Loki configuration
scrape_configs:
  - job_name: apex-range-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: apex-range
          __path__: /path/to/apex-range/logs/**/*.log
```

### Scripts de Monitoreo

```bash
#!/bin/bash
# Script para monitoreo automático de logs

LOG_DIR="./logs"
TODAY=$(date +%Y-%m-%d)

# Verificar que se están generando logs
check_logs() {
    if [ ! -d "$LOG_DIR/app/$TODAY" ]; then
        echo "⚠️  No se encontraron logs de hoy"
        return 1
    fi
    echo "✅ Logs de hoy encontrados"
}

# Contar errores
count_errors() {
    ERROR_COUNT=$(find "$LOG_DIR" -name "*.log" -exec grep -c "ERROR" {} \; | paste -sd+ | bc)
    echo "📊 Errores totales hoy: $ERROR_COUNT"
}

# Ejecutar checks
check_logs
count_errors
```

---

## 📞 Soporte

Si encuentras problemas con el sistema de logs o necesitas ayuda con el análisis de logs:

1. **Revisa los logs relevantes** para el problema específico
2. **Busca patrones** de error recurrentes
3. **Verifica permisos** de escritura en el directorio de logs
4. **Comprueba configuración** de timezone si hay problemas de fecha

Para soporte técnico, crea un issue en el [repositorio de GitHub](https://github.com/brauliorg12/apex-range/issues).

---
