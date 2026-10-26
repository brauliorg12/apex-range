# Apex Legends Rank Bot

Bot de Discord para gestionar rangos de Apex Legends, mostrar jugadores por rango, publicar paneles de mapas y generar cards visuales.

[![Version](https://img.shields.io/github/v/release/brauliorg12/apex-range)](https://github.com/brauliorg12/apex-range/releases)
[![License](https://img.shields.io/github/license/brauliorg12/apex-range)](LICENSE)
[![GHCR](https://img.shields.io/badge/GHCR-apex--range-blue?logo=github)](https://github.com/brauliorg12/apex-range/pkgs/container/apex-range)

**Sitio web:** [apex-range.cubanova.com](https://apex-range.cubanova.com)

**Invitar al bot:** [Abrir invitación de Discord](https://discord.com/oauth2/authorize?client_id=1406424026427031696&scope=bot+applications.commands&permissions=268560400)

## Características

- Panel de rangos persistente con botones de autoservicio.
- Cards de jugadores generadas con `@napi-rs/canvas`.
- Búsqueda de jugadores, filtros y listados paginados.
- Panel de estado de Apex: mapas, Ranked, Mixtape, Predator RP y estado de servidores.
- Sincronización automática de roles y jugadores.
- Soporte multi-servidor y multi-plataforma.
- Persistencia por guild en archivos JSON con escrituras atómicas.
- Recuperación automática del panel y limpieza de referencias inválidas.
- Health server y logs organizados por día.

## Requisitos

- Node.js 24 o superior para desarrollo local.
- Un bot de Discord con los permisos indicados en [PERMISSIONS.md](docs/PERMISSIONS.md).
- API key de [Mozambique](https://apexlegendsapi.com/) para los paneles de estado.
- Docker y Docker Compose para despliegue en producción.

## Inicio rápido

### Docker o Portainer

La imagen se publica en GitHub Container Registry:

```text
ghcr.io/brauliorg12/apex-range:latest
```

Ejemplo de stack con mounts persistentes:

```yaml
services:
  apex-range:
    image: ghcr.io/brauliorg12/apex-range:latest
    container_name: apex-range
    restart: unless-stopped
    environment:
      DISCORD_TOKEN: ${DISCORD_TOKEN}
      CLIENT_ID: ${CLIENT_ID}
      MOZA_API_KEY: ${MOZA_API_KEY}
      MOZA_URL: https://api.mozambiquehe.re
      BOT_OWNER_ID: ${BOT_OWNER_ID}
      HEALTH_PORT: "3001"
      API_URL: http://localhost:3001/health
      INIT_IMAGE_PATH: /app/assets/imgs/init.png
    volumes:
      - ${APEX_DATA_DIR}/db:/app/db
      - ${APEX_DATA_DIR}/.bot-state:/app/.bot-state
      - ${APEX_DATA_DIR}/logs:/app/logs
      - ${APEX_DATA_DIR}/.apex-cache:/app/.apex-cache
      - ${APEX_ASSETS_DIR}:/app/assets/imgs:ro
```

Definí `APEX_DATA_DIR` y `APEX_ASSETS_DIR` en el entorno del stack o reemplazalos por rutas de tu servidor. No es necesario usar las rutas de un despliegue ajeno.

### Datos persistentes

Los datos del bot no viven en la imagen Docker. Los mounts recomendados son:

| Ruta del contenedor | Contenido |
| --- | --- |
| `/app/db` | Jugadores y configuración por servidor. |
| `/app/.bot-state` | Estado de paneles y referencias por guild. |
| `/app/logs` | Logs de la aplicación y por servidor. |
| `/app/.apex-cache` | Cache de respuestas de la API de Apex. |
| `/app/assets/imgs` | Assets locales de solo lectura, como `init.png`. |

Hacé backup de `db/` y `.bot-state/` antes de actualizar o mover el bot. Los mounts no se borran al recrear el contenedor, pero una actualización de imagen no reemplaza los datos del host.

### Imagen inicial del panel

La imagen del panel de rangos se lee desde `INIT_IMAGE_PATH`:

```env
INIT_IMAGE_PATH=/app/assets/imgs/init.png
```

- Es opcional: si la variable no existe, está vacía o el archivo no está disponible, el panel se muestra sin imagen.
- El archivo debe ser PNG y pesar menos de 8 MB.
- El mount debe ser de solo lectura (`:ro`).
- El bot envía la imagen como adjunto de Discord; no necesita una URL pública.
- El archivo no se copia a la imagen Docker ni se versiona dentro de `dist/`. Para actualizarlo, reemplazalo en el host; el próximo refresco lo detecta.
- Si usás el repositorio como origen del asset, `assets/imgs/init.png` puede montarse directamente.

### Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DISCORD_TOKEN` | Sí | Token del bot. Sin esto no inicia. |
| `CLIENT_ID` | Para comandos | Application ID usado por `deploy-commands`. |
| `MOZA_API_KEY` | Recomendada | API key de Mozambique. |
| `MOZA_URL` | No | Default: `https://api.mozambiquehe.re`. |
| `BOT_OWNER_ID` | No | ID con acceso a comandos administrativos. |
| `HEALTH_PORT` | No | Puerto del health server. Default: `3001`. |
| `API_URL` | No | URL interna del health check. |
| `ADMIN_ALERT_WEBHOOK_URL` | No | Webhook para alertas de infraestructura. |
| `INIT_IMAGE_PATH` | No | Ruta de `init.png` dentro del contenedor. Vacío = sin imagen. |

Nunca commitees un `.env` real. Los secretos deben cargarse como variables de entorno del stack o del orquestador.

### Desarrollo local

```bash
git clone https://github.com/brauliorg12/apex-range.git
cd apex-range
npm ci
cp .env.example .env
```

Completá `.env` con tus credenciales y, si querés la imagen local:

```env
INIT_IMAGE_PATH=assets/imgs/init.png
```

Luego:

```bash
npm run deploy-commands
npm run dev
```

Para compilar:

```bash
npm run build
npm start
```

## Comandos

| Comando | Audiencia | Descripción |
| --- | --- | --- |
| `/setup-roles` | Staff | Configura roles, paneles y mensajes del servidor. |
| `/apex-status` | Staff | Publica el panel de mapas en el canal actual. |
| `/cleanup-state` | Mantenimiento | Limpia referencias inválidas de paneles. |
| `/api-status` | Público | Muestra el estado de las APIs. |
| `/total-jugadores` | Público | Muestra el total de jugadores registrados. |
| `/cleanup-data` | Owner | Limpieza de datos y archivos obsoletos. |
| Menú contextual | Público | Consulta el rango de un usuario. |

La guía dentro del bot muestra solo las acciones disponibles para cada usuario. La sección de staff se oculta a quienes no tienen permisos de gestión.

## Documentación

- [Instalación y configuración](docs/INSTALL.md)
- [Uso y comandos](docs/USAGE.md)
- [Permisos de Discord](docs/PERMISSIONS.md)
- [Mapeo de roles](docs/ROLE-MAPPING.md)
- [Sincronización de rangos](docs/RANK-SYNC.md)
- [Plataformas](docs/PLATFORMS.md)
- [Multi-servidor](docs/MULTI-SERVER.md)
- [Logs](docs/LOGS.md)
- [API y estado](docs/API.md)
- [Configuración avanzada](docs/ADVANCED.md)

## Stack

- TypeScript
- discord.js
- @napi-rs/canvas
- Express para health checks
- Docker y GitHub Actions

## Contribuir

1. Creá una rama para tu cambio.
2. Mantené el estilo y los tipos del proyecto.
3. Abrí un Pull Request con una descripción clara.

## Licencia

MIT. Ver [LICENSE](LICENSE).

## Autor

**Braulio Rodriguez**

- GitHub: [@brauliorg12](https://github.com/brauliorg12)
- Discord: burlon23
- CubaNova

---

Si el bot te resulta útil, podés darle una estrella al repositorio.
