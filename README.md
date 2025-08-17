# Bot de Discord para Apex Legends

Este es un bot de Discord diseñado para mejorar la experiencia de tu comunidad de Apex Legends. Proporciona características como la gestión de roles y actualizaciones de estado.

## Tecnologías Utilizadas

Este proyecto está construido con las siguientes tecnologías:

- **Node.js**: Entorno de ejecución de JavaScript del lado del servidor.
- **TypeScript**: Un superconjunto de JavaScript que añade tipado estático.
- **Discord.js**: Una potente librería de Node.js para interactuar con la API de Discord.

## Características

- **Gestión de Roles**: Configura y administra fácilmente los roles dentro de tu servidor de Discord.
- **Actualizaciones de Estado**: Mantén a tu comunidad informada con actualizaciones automáticas de estado.

## Instalación

Para poner en marcha este bot, sigue estos pasos:

1.  **Clona el repositorio**:

    ```bash
    git clone https://github.com/your-username/discord-apex.git
    cd discord-apex
    ```

2.  **Instala las dependencias**:

    ```bash
    npm install
    ```

3.  **Configura tu bot**: Crea un archivo `.env` en el directorio raíz con el token de tu bot de Discord y cualquier otra configuración necesaria. (Ejemplo: `DISCORD_TOKEN=TU_TOKEN_DEL_BOT`)

4.  **Compila el proyecto**:

    ```bash
    npm run build
    ```

5.  **Despliega los comandos de barra (slash commands)**:

    ```bash
    npx ts-node src/deploy-commands.ts
    ```

6.  **Ejecuta el bot**:
    ```bash
    npm run dev
    ```

## Configuración del Servidor de Discord

Antes de ejecutar el bot, es crucial configurar correctamente tu servidor de Discord para asegurar que todas las funcionalidades operen como se espera.

### 1. Creación de Roles

El bot utiliza roles para identificar el rango de los jugadores de Apex Legends. Debes crear los siguientes roles en tu servidor, asegurándote de que los nombres coincidan exactamente:

-   Bronce
-   Plata
-   Oro
-   Platino
-   Diamante
-   Maestro
-   Apex Predator

Puedes crearlos manualmente desde `Ajustes del servidor > Roles > Crear rol`.

### 2. Subida de Emojis de Rango

Para una mejor experiencia visual, el bot utiliza emojis personalizados para cada rango. Debes subir los siguientes iconos a tu servidor:

-   `Ranked_Tier1_Bronze.webp` como `:Ranked_Tier1_Bronze:`
-   `Ranked_Tier2_Silver.webp` como `:Ranked_Tier2_Silver:`
-   `Ranked_Tier3_Gold.webp` como `:Ranked_Tier3_Gold:`
-   `Ranked_Tier4_Platinum.webp` como `:Ranked_Tier4_Platinum:`
-   `Ranked_Tier5_Diamond.webp` como `:Ranked_Tier5_Diamond:`
-   `Ranked_Tier6_Master.webp` como `:Ranked_Tier6_Master:`
-   `Ranked_Tier7_Apex_Predator.webp` como `:Ranked_Tier7_Apex_Predator:`

Puedes subirlos desde `Ajustes del servidor > Emoji > Subir emoji`. Es vital que los nombres de los emojis coincidan con los IDs definidos en `src/constants.ts` para que el bot pueda encontrarlos.

### 3. Permisos del Bot

Asegúrate de que el rol del bot tenga los siguientes permisos para que pueda funcionar correctamente:

-   **Gestionar roles**: Para asignar y desasignar roles de rango a los usuarios.
-   **Enviar mensajes**: Para responder a comandos e interactuar con los usuarios.
-   **Leer el historial de mensajes**: Para procesar comandos y respuestas.
-   **Usar emojis externos**: Para poder mostrar los emojis de rango personalizados.

Estos permisos se pueden configurar en `Ajustes del servidor > Roles`, seleccionando el rol del bot.

## Uso

Una vez que el bot esté en funcionamiento y añadido a tu servidor de Discord, puedes usar los siguientes comandos:

- `/setup-roles`: Comando para configurar roles (los detalles dependen de la implementación en `src/commands/setup-roles.ts`).
- `/total-players`: Muestra el número total de jugadores en línea por rol de Apex Legends.

## Contribución

¡Las contribuciones son bienvenidas! No dudes en abrir issues o enviar pull requests.

## Licencia

Este proyecto está bajo la Licencia MIT.
