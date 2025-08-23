# 🛡️ Apex Legends Rank Bot

Bot de Discord para gestionar y mostrar los rangos de los jugadores de Apex Legends en tu servidor, con panel interactivo, estadísticas y cards visuales.

![CI](https://github.com/brauliorg12/discord-apex/actions/workflows/ci-cd.yml/badge.svg)
![Version](https://img.shields.io/github/v/release/brauliorg12/discord-apex)
![License](https://img.shields.io/github/license/brauliorg12/discord-apex)
![GHCR Pulls](https://img.shields.io/badge/GHCR-pulls-blue?logo=github)
![Docker Pulls](https://img.shields.io/docker/pulls/brauliorg12/discord-apex)

---

## 🚀 ¿Qué es Apex Legends Rank Bot?

Un bot profesional para comunidades de Apex Legends que permite:

- Asignar roles de rango mediante botones.
- Mostrar estadísticas y cards visuales de jugadores.
- Panel persistente y configurable.
- Comandos slash y de contexto para gestión avanzada.

---

## 🟢 Comandos Disponibles

| Comando / Acción               | Descripción                                                        | Permisos      |
| ------------------------------ | ------------------------------------------------------------------ | ------------- |
| `/setup-roles`                 | Configura el panel de selección de rango y mensaje de estadísticas | Administrador |
| `/total-jugadores`             | Muestra el número total de jugadores con rango                     | Todos         |
| `/api-status`                  | Muestra el estado actual de la API externa                         | Todos         |
| `Ver mi rango Apex` (contexto) | Muestra tu rango actual y opciones de gestión                      | Todos         |

> **Nota:** El comando de contexto aparece al hacer click derecho sobre un usuario.

---

## 🧑‍💼 Comando `/api-status`

Consulta el estado de la API externa utilizada por el bot.  
Muestra si la API está conectada o no y la última vez que se verificó.

---

## 🧑‍💼 Comando de Contexto: Ver mi rango Apex

Puedes ver el rango de cualquier usuario (incluyéndote a ti mismo) usando el menú contextual:

1. Haz **click derecho** sobre el nombre de usuario (en la lista de miembros o en el chat).
2. Selecciona **"Ver mi rango Apex"** en la sección de Apps.

### Funcionamiento:

- **Si eres tú mismo:**

  - El embed muestra:
    - "Tu rango en Apex Legends"
    - El rango actual con su color y emoji
    - Botones para gestionar tu rango y cerrar el mensaje
  - Si no tienes rango, te permite seleccionarlo directamente.

- **Si es otro usuario:**

  - El embed muestra:
    - "Rango de [nombre]"
    - El rango actual del usuario con color y emoji
    - Solo el botón "Cerrar"
  - Si el usuario no tiene rango, lo indica claramente.

- **Botón "Cerrar":**
  - Siempre disponible para cerrar el mensaje ephemeral.

> Este comando es privado (ephemeral) y solo visible para quien lo ejecuta.

---

## 🎛️ Panel Interactivo

- **Botones para seleccionar rango**: Elige tu rango y el bot te asigna el rol correspondiente.
- **Gestión de rango**: Cambia o elimina tu rango fácilmente.
- **Estadísticas en tiempo real**: Ve cuántos jugadores hay por rango y quiénes están online.
- **Cards visuales**: Avatares de los últimos registrados y listados por rango.

---

## ✨ Características principales

- Panel persistente y auto-actualizable.
- Cards generadas con @napi-rs/canvas para máxima calidad.
- Filtros por rango y gestión desde el propio canal.
- Comandos slash y menú contextual profesional.
- Migración automática de datos antiguos.
- Logs claros y monitoreo de estado/API.

---

## 🏗️ Estructura del Proyecto

- `src/commands/`: Comandos slash y de contexto.
- `src/utils/`: Helpers, renderers de cards, lógica de estadísticas.
- `src/interactions/`: Handlers de botones y selects.
- `src/index.ts`: Punto de entrada principal.
- `src/deploy-commands.ts`: Script para desplegar comandos.

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

Crea un archivo `.env` en la raíz con:

```
DISCORD_TOKEN=TU_TOKEN_DEL_BOT
CLIENT_ID=TU_CLIENT_ID
```

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

- Gestionar roles
- Enviar mensajes
- Leer historial de mensajes
- Usar emojis externos
- Gestionar mensajes

---

## 🖼️ Cards y Estadísticas Visuales

El bot genera imágenes dinámicas con los avatares y rangos de los jugadores usando [@napi-rs/canvas](https://www.npmjs.com/package/@napi-rs/canvas).  
Las cards muestran los últimos registrados y los jugadores online por rango, todo en alta calidad.

---

## 📦 Archivos de Datos

- `bot-state.json`: Estado principal del bot (canal, mensajes, etc).
- `players.json`: Lista de jugadores y fecha de asignación de rango.

Migración automática de formatos antiguos incluida.

---

## 📝 Ejemplo de Uso

1. Un admin ejecuta `/setup-roles` en el canal deseado.
2. El panel aparece con botones para seleccionar rango.
3. Los usuarios eligen su rango y el bot les asigna el rol.
4. El mensaje de estadísticas se actualiza automáticamente.
5. Los usuarios pueden ver su rango con el menú contextual "Ver mi rango Apex".

---

## 🐳 Docker

Puedes ejecutar el bot fácilmente usando Docker desde GitHub Container Registry:

```bash
docker pull ghcr.io/brauliorg12/discord-apex:latest
docker run -e DISCORD_TOKEN=TU_TOKEN -e CLIENT_ID=TU_CLIENT_ID ghcr.io/brauliorg12/discord-apex:latest
```

Asegúrate de pasar las variables de entorno necesarias (`DISCORD_TOKEN`, `CLIENT_ID`, etc).

---

## ❓ Solución de Problemas

- Si los comandos no aparecen, ejecuta `npm run deploy-commands` y espera unos minutos.
- Si el bot no responde, revisa el token, permisos y configuración.
- El comando de contexto puede tardar en aparecer por caché de Discord.

---

## 🤝 Contribuir

1. Haz un fork y crea una rama para tu feature.
2. Haz tus cambios y abre un Pull Request.
3. Sigue la convención de commits: `Add:`, `Fix:`, `Update:`, etc.

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

---

## 👤 Autor

**Braulio Rodriguez**

- GitHub: [@brauliorg12](https://github.com/brauliorg12)
- Discord: burlon23
- Email: cubanovainfo@gmail.com

---

¿Te gusta este bot?  
⭐ ¡Dale una estrella en GitHub! ⭐

[Reportar Bug](https://github.com/brauliorg12/discord-apex/issues) • [Solicitar Feature](https://github.com/brauliorg12/discord-apex/issues) • [Discusiones](https://github.com/brauliorg12/discord-apex/discussions)
