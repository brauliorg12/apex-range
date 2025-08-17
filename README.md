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

5.  **Ejecuta el bot**:
    ```bash
    npm start
    ```

## Uso

Una vez que el bot esté en funcionamiento y añadido a tu servidor de Discord, puedes usar los siguientes comandos:

- `/setup-roles`: Comando para configurar roles (los detalles dependen de la implementación en `src/commands/setup-roles.ts`).

## Contribución

¡Las contribuciones son bienvenidas! No dudes en abrir issues o enviar pull requests.

## Licencia

Este proyecto está bajo la Licencia MIT.
