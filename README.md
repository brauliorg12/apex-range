# Bot de Discord para Apex Legends

Este es un bot de Discord diseñado para mejorar la experiencia de tu comunidad de Apex Legends. Proporciona características como la gestión de roles, panel interactivo de rangos, estadísticas y ayuda integrada.

## Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución de JavaScript del lado del servidor.
- **TypeScript**: Tipado estático sobre JavaScript.
- **Discord.js**: Librería para interactuar con la API de Discord.

## Características

- **Gestión de Roles**: Selección y administración de roles de rango de Apex Legends mediante botones interactivos.
- **Panel Interactivo**: Los usuarios pueden gestionar su rango, ver jugadores en línea y acceder a la ayuda desde un menú principal con botones.
- **Actualizaciones de Estado**: Estadísticas automáticas y actualizadas sobre los jugadores y el estado de la API.
- **Ayuda Integrada**: Botón de ayuda en todos los menús interactivos para mostrar comandos y funcionalidades.
- **Botón "Cerrar"**: Todos los menús interactivos incluyen un botón para cerrar el mensaje de manera sencilla.

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
