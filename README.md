# Apex Legends Rank Bot

Un bot de Discord para gestionar y mostrar los rangos de los jugadores de Apex Legends en un servidor.

## Características

- Asignación de roles según el rango en Apex Legends.
- Panel de control interactivo con botones.
- Mensaje de estado que se actualiza automáticamente con el recuento de jugadores por rango.
- Listado de todos los jugadores registrados con su rango y fecha de registro.
- Listado de jugadores en línea por rango.
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

- **Clave (ID de usuario)**: El ID de Discord del jugador.
- **`assignedAt`**: La fecha y hora (en formato ISO 8601) de la última vez que el jugador se asignó o actualizó su rango a través del bot.

Este registro permite mostrar la "fecha de registro" en la lista de jugadores, proporcionando un dato útil sobre cuándo se unió un jugador al sistema de rangos.

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
   Ejemplo:

   ```
   DISCORD_TOKEN=TU_TOKEN_DEL_BOT
   # Imagen para el encabezado de rangos
   RANKS_HEADER_IMAGE_URL=https://app.cubanova.com/assets/images/Apex_Legends_Ranked_Leagues.jpg
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

## Uso

Una vez que el bot esté en funcionamiento y añadido a tu servidor de Discord, puedes usar los siguientes comandos:

- `/setup-roles`: Configura el panel de selección de rango y el mensaje de estadísticas.
- `/total-jugadores`: Muestra el número total de jugadores con un rol de rango de Apex Legends.
- `/api-status`: Muestra el estado actual de la API externa.

Además, los usuarios pueden interactuar con los botones para:

- Gestionar su rango.
- Ver jugadores en línea por rango.
- Acceder a la ayuda de comandos.
- Cerrar cualquier mensaje interactivo con el botón "Cerrar".

## Contribución

¡Las contribuciones son bienvenidas! No dudes en abrir issues o enviar pull requests.

## Licencia

Este proyecto está bajo la Licencia MIT.
