# Apex Legends Rank Bot

Un bot de Discord para gestionar y mostrar los rangos de los jugadores de Apex Legends en un servidor.

## Características

- Asignación de roles según el rango en Apex Legends.
- Panel de control interactivo con botones.
- Mensaje de estado que se actualiza automáticamente con el recuento de jugadores por rango.
- Listado de todos los jugadores registrados con su rango y fecha de registro.
- Comandos slash para una fácil interacción.

## Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución de JavaScript del lado del servidor.
- **TypeScript**: Tipado estático sobre JavaScript.
- **Discord.js**: Librería para interactuar con la API de Discord.

## Archivos de Datos (JSON)

Este bot utiliza archivos JSON para almacenar datos persistentes. Estos archivos se crean automáticamente en la raíz del proyecto.

### `bot-state.json`

Este archivo es crucial para el funcionamiento continuo del bot entre reinicios. Almacena el estado principal del bot.

- **`guildId`**: El ID del servidor de Discord donde está configurado el bot.
- **`channelId`**: El ID del canal donde se encuentra el mensaje de estado/panel.
- **`messageId`**: El ID del mensaje de estado que el bot necesita encontrar y actualizar.

Gracias a este archivo, si el bot se reinicia, puede localizar inmediatamente el mensaje de estado y continuar actualizándolo sin necesidad de volver a ejecutar el comando de configuración.

### `players.json`

Este archivo funciona como una pequeña base de datos para almacenar información específica de los jugadores.

Nueva estructura (más clara y extensible):

```json
[
  {
    "userId": "123456789012345678",
    "assignedAt": "2025-08-18T20:38:51.842Z"
  }
]
```

- **`userId`**: El ID de Discord del jugador.
- **`assignedAt`**: La fecha y hora (en formato ISO 8601) de la última vez que el jugador se asignó o actualizó su rango a través del bot.

Migración automática: si ya tienes un `players.json` en el formato antiguo (objeto indexado por `userId`), el bot lo convertirá automáticamente a este nuevo formato la próxima vez que lea el archivo.

## Instalación

1. **Clona el repositorio**:

   ```bash
   git clone https://github.com/your-username/discord-apex.git
   cd discord-apex
   ```

2. **Instala las dependencias**:

   ```bash
   npm install
   ```

3. **Configura tu bot**:  
   Crea un archivo `.env` en el directorio raíz con el token de tu bot de Discord.  
   Nota: el encabezado de rangos ahora se genera localmente con canvas, no se requiere URL externa.

   ```
   DISCORD_TOKEN=TU_TOKEN_DEL_BOT
   ```

4. **Compila el proyecto**:

   ```bash
   npm run build
   ```

5. **Despliega los comandos de barra (slash commands)**:

   ```bash
   npx ts-node src/deploy-commands.ts
   ```

6. **Ejecuta el bot**:

   ```bash
   npm run dev
   ```

## Configuración del Servidor de Discord

### 1. Creación de Roles

Debes crear los siguientes roles en tu servidor (los nombres deben coincidir exactamente):

- Bronce
- Plata
- Oro
- Platino
- Diamante
- Maestro
- Apex Predator

### 2. Subida de Emojis de Rango

Sube los siguientes emojis personalizados y asígnales los nombres correctos:

- `Ranked_Tier1_Bronze.webp` como `:Ranked_Tier1_Bronze:`
- `Ranked_Tier2_Silver.webp` como `:Ranked_Tier2_Silver:`
- `Ranked_Tier3_Gold.webp` como `:Ranked_Tier3_Gold:`
- `Ranked_Tier4_Platinum.webp` como `:Ranked_Tier4_Platinum:`
- `Ranked_Tier5_Diamond.webp` como `:Ranked_Tier5_Diamond:`
- `Ranked_Tier6_Master.webp` como `:Ranked_Tier6_Master:`
- `Ranked_Tier7_Apex_Predator.webp` como `:Ranked_Tier7_Apex_Predator:`

### 3. Permisos del Bot

El bot necesita los siguientes permisos:

- Gestionar roles
- Enviar mensajes
- Leer historial de mensajes
- Usar emojis externos
- Gestionar mensajes (para fijar mensajes de estadísticas)

## Gráficos con @napi-rs/canvas

Este proyecto utiliza @napi-rs/canvas para generar imágenes (cards) dinámicas que se adjuntan en los mensajes de Discord. Esta librería es un binding nativo muy rápido que expone una API compatible con Canvas (2D).

- Paquete: @napi-rs/canvas
- Uso principal: renderizar avatares circulares, superponer “badges” de rango y dibujar etiquetas (nombres de usuario).

### Qué generamos hoy

- Card “Últimos 5 registrados” (recent-avatars-card):
  - Avatares circulares de los últimos jugadores registrados.
  - Badge de rango en la esquina inferior derecha del avatar (emoji custom vía CDN o Unicode).
  - Nombre de usuario centrado bajo cada avatar, con elipsis si no entra.

Arquitectura:

- src/utils/recent-avatars-card.ts: Orquesta datos (fetch, emojis, nombres) y arma el embed.
- src/utils/recent-avatars-canvas.ts: Renderer reutilizable que dibuja y devuelve el PNG.

### Renderer reutilizable

Archivo: src/utils/recent-avatars-canvas.ts

- API:
  - renderRecentAvatarsCanvas(items, options) => { buffer, encodeMs, width, height }
  - items: array de { avatar, badgeImg?, badgeText?, label }
    - avatar: imagen ya decodificada (loadImage) o null (se dibuja placeholder).
    - badgeImg: imagen del emoji de rango (si es custom).
    - badgeText: texto/emoji Unicode del rango (si no hay imagen).
    - label: nombre a mostrar bajo el avatar.
  - options:
    - size: tamaño del avatar (px). Default: 128
    - pad: padding entre avatares (px). Default: 16
    - labelHeight: alto de la banda inferior para el nombre. Default: 36

Ejemplo de uso para otra card:

```ts
import { loadImage } from '@napi-rs/canvas';
import { renderRecentAvatarsCanvas } from './utils/recent-avatars-canvas';

// Preparar items (cada avatar ya decodificado o null)
const items = [
  { avatar: await loadImage(buf1), label: 'Jugador 1' },
  { avatar: await loadImage(buf2), label: 'Jugador 2', badgeText: '⭐' },
  // ...
];

const { buffer } = await renderRecentAvatarsCanvas(items, {
  size: 128,
  pad: 16,
  labelHeight: 36,
});
// buffer es un PNG listo para adjuntar a un Embed
```

### Emojis de rango

- Emojis personalizados de Discord: se resuelven a PNG vía CDN (https://cdn.discordapp.com/emojis/{id}.png?size=64) y se decodifican con loadImage.
- Emojis Unicode: se dibujan como texto dentro de un recorte circular, con un borde sutil para legibilidad.

Nota: El renderer no hace fetch ni decodifica imágenes; esa responsabilidad queda del caller (para mantener responsabilidad única y facilitar testeo).

### Fuentes

- Por defecto usa “sans-serif” del sistema.
- Para una tipografía consistente, puedes registrar una fuente antes de renderizar:

```ts
import { registerFont } from '@napi-rs/canvas';
registerFont('/ruta/a/Inter-Regular.ttf', { family: 'Inter' });
registerFont('/ruta/a/Inter-Bold.ttf', { family: 'Inter', weight: '700' });
// Luego usa ctx.font = '700 22px Inter';
```

### Rendimiento y buenas prácticas

- Decodificación: usa loadImage(Buffer) y reutiliza resultados si vas a renderizar varias cards.
- Concurrencia: limita el número de fetch/decodificaciones simultáneas si amplías el número de avatares.
- Tamaños:
  - size grande => más píxeles a dibujar/encodear.
  - labelHeight suficiente si subes la fuente (el renderer usa elipsis).
- Encode: canvas.encode('png') es síncrono-async; el renderer devuelve encodeMs para tus métricas.
- Throttling: este repo ya incluye un throttler para coalescer actualizaciones (ver src/utils/update-throttler.ts).

### Requisitos y compatibilidad

- Node.js 18+ recomendado (N-API estable).
- @napi-rs/canvas trae binarios precompilados para plataformas soportadas.
- En entornos Linux minimalistas/Docker, asegúrate de tener:
  - glibc adecuada para tu versión de Node.
  - Paquetes de fuentes (ej: fonts-dejavu) para evitar reemplazos pobres.

### Solución de problemas

- “Error loading shared library” al iniciar:
  - Actualiza a una imagen base con glibc compatible con tu Node o usa una versión LTS reciente.
- Texto/emoji se ven “finos” o “cuadrados”:
  - Instala un pack de fuentes o registra fuentes manualmente.
- Emojis custom no visibles:
  - Verifica que la cadena del emoji sea del tipo <a?:name:id> y que el bot tenga permiso de “Usar emojis externos”.
- PNG en blanco o corrupto:
  - Asegúrate de esperar la promesa de renderRecentAvatarsCanvas y de adjuntar el buffer retornado.

### Extender a más cards

- Reutiliza renderRecentAvatarsCanvas cambiando:
  - label para otras descripciones (p.ej. K/D, nivel, etc.).
  - badgeImg/badgeText para iconos específicos.
  - options (size, pad, labelHeight) para otras densidades.
- Si necesitas un layout en 2 filas/tabla, puedes crear un renderer similar que itere filas/columnas y reutilice los helpers de badge/label.

## Uso

Una vez que el bot esté en funcionamiento y añadido a tu servidor de Discord, puedes usar los siguientes comandos:

- `/setup-roles`: Configura el panel de selección de rango y el mensaje de estadísticas.
- `/total-jugadores`: Muestra el número total de jugadores con un rol de rango de Apex Legends.
- `/api-status`: Muestra el estado actual de la API externa.

Además, los usuarios pueden interactuar con los botones:

- Gestionar Rango — Selecciona o cambia tu rango.
- Todos los Jugadores — Lista completa con fecha de registro.
- Ayuda — Abre el menú de ayuda.
- Cerrar — Cierra el mensaje actual.

## Contribución

¡Las contribuciones son bienvenidas! No dudes en abrir issues o enviar pull requests.

## Licencia

Este proyecto está bajo la Licencia MIT.
