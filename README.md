![Apex Legends Rank Bot Logo](https://cdn.discordapp.com/app-icons/1406424026427031696/8bdee35a57f297417a714ded942fb456.png)

# <img src="https://cdn.discordapp.com/emojis/1410729026410119269.webp?size=40&quality=lossless" alt="Apex Icon" width="32" style="vertical-align:middle"> Apex Legends Rank Bot

Bot de Discord para gestionar y mostrar los rangos de los jugadores de Apex Legends en tu servidor, con panel interactivo, estadísticas y cards visuales.

![Version](https://img.shields.io/github/v/release/brauliorg12/apex-range)
![License](https://img.shields.io/github/license/brauliorg12/apex-range)
![GHCR Pulls](https://img.shields.io/badge/GHCR-pulls-blue?logo=github)
![Docker Pulls](https://img.shields.io/docker/pulls/brauliorg12/apex-range)

---

## 🚀 ¿Qué es Apex Legends Rank Bot?

Un bot profesional para comunidades de Apex Legends que permite:

- Asignar roles de rango mediante botones.
- Mostrar estadísticas y cards visuales de jugadores.
- Panel persistente y configurable.
- Comandos slash y de contexto para gestión avanzada.

---

## 🔗 Integración con la API de Mozambique (Perfil Apex)

El bot ahora permite consultar el perfil de cualquier jugador de Apex Legends usando la [API de Mozambique](https://apexlegendsapi.com/).

### Funcionalidad

- Consulta tu perfil de Apex Legends desde el panel o usando el modal interactivo.
- Muestra estadísticas básicas: nivel, rango, kills, leyenda seleccionada, UID y plataforma.
- El card/embed del perfil usa el color correspondiente al rango del jugador.
- Si ocurre un error (por ejemplo, usuario no encontrado), se muestra un card de error con borde rojo y botón cerrar.

### Configuración

1. **Obtén tu API Key gratuita en** [https://apexlegendsapi.com/](https://apexlegendsapi.com/).
2. Agrega estas variables a tu archivo `.env`:

   ```
   MOZA_API_KEY=TU_API_KEY_DE_MOZAMBIQUE
   MOZA_URL=https://api.mozambiquehe.re
   ```

3. Reinicia el bot para que tome la nueva configuración.

### Cómo usarlo

- Haz click en el botón **"Ver mi perfil Apex"** en el panel del bot.
- Completa el modal con tu nombre de usuario y plataforma (PC, PS4 o X1).
- Recibirás un mensaje privado con tu perfil y estadísticas.

---

## 🆕 Panel de Estado de Apex Legends y Perfil Interactivo

### Card de Estado de la API Mozambique

El bot ahora incluye un **embed dinámico** que muestra información en tiempo real de la API oficial de Mozambique:

- **Rotación de mapas**: Battle Royale, Ranked y LTM, siempre actualizados.
- **RP necesario para Predator**: Visualización clara para PC, PS4 y Xbox.
- **Actualización automática**: El panel se refresca cada 5 minutos para mantener la información al día.
- **Fuente y timestamp**: Siempre sabrás de dónde provienen los datos y cuándo se actualizaron.

Esto permite a tu comunidad estar informada al instante sobre el estado del juego y los requisitos competitivos.

### Botón "Ver mi perfil Apex"

Debajo del embed de estado, encontrarás el botón:

```
[ Ver mi perfil Apex ]
```

- Al pulsarlo, se abre un modal donde puedes ingresar tu usuario y plataforma.
- El bot consulta la API de Mozambique y te envía un **card privado** con tus estadísticas principales: nivel, kills, rango, leyenda principal, UID y plataforma.
- El embed utiliza colores y emojis personalizados según tu rango.
- Si ocurre un error (usuario no encontrado, API caída, etc), recibirás un mensaje claro y profesional.

#### Experiencia de usuario

- **Acceso rápido**: Todo desde el canal principal, sin comandos complicados.
- **Privacidad**: Tu perfil se muestra solo a ti mediante mensaje ephemeral.
- **Integración total**: El botón y el embed están siempre visibles y actualizados en el panel.

#### Detalles técnicos

- El panel y el botón se generan automáticamente al ejecutar `/setup-roles`.
- El estado de la API se obtiene usando la [API de Mozambique](https://apexlegendsapi.com/).
- El botón utiliza componentes interactivos de Discord para una experiencia moderna y fluida.
- El código es modular y fácil de mantener.

---

## 🆕 Sistema de Cache Inteligente (API Mozambique)

El bot implementa una solución profesional y eficiente para lidiar con las limitaciones de las APIs gratuitas (como límites de peticiones, caídas o respuestas incompletas):

- **Cache por canal y servidor:** Cada panel mantiene su propia cache, independiente de otros canales o servidores.
- **Solo se guarda información válida:** El bot solo actualiza la cache si la API responde correctamente. Si la API falla, se mantiene la última información válida.
- **Actualización automática cada 5 minutos:** El panel se refresca periódicamente. Si la API responde bien, se actualiza la cache; si falla, se muestra la última cache disponible.
- **Consulta ordenada de endpoints:**
  - Primero se consultan los endpoints críticos (rotación de mapas y estado de servidores), asegurando que la información esencial esté siempre lo más actualizada posible.
  - Luego, tras un breve intervalo para respetar el rate limit de la API, se consultan los endpoints secundarios (Predator RP).
- **Aviso de cache:** Si se muestra información cacheada, verás en el footer del card el mensaje:  
  `⚠️ Datos en cache cargados hace X minutos`
- **Nunca se sobrescribe la cache con errores:** Así, siempre tendrás la última información válida aunque la API esté temporalmente caída o limitada.
- **Cumplimiento de límites de la API:** El bot distribuye las consultas en el tiempo y por orden, evitando saturar la API y asegurando la máxima robustez.

> **Nota:** Este sistema es una solución práctica y robusta para entornos con APIs gratuitas, donde los límites de peticiones y la inestabilidad pueden ser frecuentes. Así, tu comunidad siempre verá la mejor información posible, incluso si la API externa falla temporalmente.

---

## 🛰️ Estado de los Servidores: Significado de los Emojis

En la card de estado de servidores, los siguientes emojis indican el estado de cada región/plataforma:

| Emoji | Estado      | Significado        |
| ----- | ----------- | ------------------ |
| 🟢    | UP          | Operativo          |
| 🟡    | SLOW        | Lento/intermitente |
| 🔴    | DOWN        | Caído              |
| ⚪    | Desconocido | Estado desconocido |

Esto te permite identificar rápidamente el estado de los servidores de Apex Legends en cada región.

---

## 🆘 Ayuda y Mensaje de Estado

Cuando uses `/apex-status` o veas el panel de estado, ten en cuenta:

- Si ves `⚠️ Datos en cache temporalmente` en alguna card, significa que la API no respondió y se está mostrando la última información válida.
- El panel se actualiza automáticamente cada 5 minutos.
- Los emojis de estado de servidor indican si cada región está operativa, lenta o caída.

---

## ⏱️ Detalles de Intervalos, Reintentos y Tiempos de Consulta

Para adaptarse a las limitaciones de la API de Mozambique y evitar bloqueos, el bot implementa la siguiente estrategia de consulta y cache:

- **Actualización automática:**  
  El panel de estado se actualiza cada **5 minutos** (300 segundos) en cada canal configurado.

- **Orden de consulta de endpoints:**

  1. **Primero** se consultan los endpoints críticos:
     - Rotación de mapas (`mapRotation`)
     - Estado de los servidores (`serverStatus`)
  2. **Luego de 1 segundo de espera**, se consulta el endpoint secundario:
     - RP necesario para Predator (`predatorRank`)

- **Reintentos:**  
  Cada consulta a la API se reintenta hasta **3 veces** en caso de error, con un intervalo de **1.2 segundos** entre cada intento.

- **Cache:**

  - Si la API responde correctamente, se actualiza la cache.
  - Si la API falla, se usa la última cache válida (si existe).
  - Si no hay cache ni respuesta válida, el panel muestra "No disponible".

- **Cumplimiento de rate limit:**

  - Nunca se hacen más de 2 requests/segundo a la API.
  - El endpoint secundario espera 1 segundo tras los críticos para evitar saturar la API.

- **Aviso de cache:**  
  Si se muestra información cacheada, verás en el footer del card el mensaje:  
  `⚠️ Datos en cache cargados hace X minutos`

> **Resumen:**
>
> - Panel actualizado cada 5 minutos.
> - Endpoints críticos primero, secundarios después de 1 segundo.
> - Hasta 3 reintentos por endpoint, con 1.2s de espera.
> - Cache por canal y servidor, nunca sobrescrita con errores.
> - Cumplimiento estricto del rate limit de la API.

---

## 🟢 Comandos Disponibles

| Comando / Acción               | Descripción                                                        | Permisos      |
| ------------------------------ | ------------------------------------------------------------------ | ------------- |
| `/setup-roles`                 | Configura el panel de selección de rango y mensaje de estadísticas | Administrador |
| `/apex-status`                 | Muestra el estado de Apex (mapas, Predator RP)                     | Todos         |
| `/total-jugadores`             | Muestra el número total de jugadores con rango                     | Todos         |
| `/api-status`                  | Muestra el estado actual de la API externa                         | Todos         |
| `Ver mi rango Apex` (contexto) | Muestra tu rango actual y opciones de gestión                      | Todos         |
| **Ver mi perfil Apex** (botón) | Consulta tu perfil de Apex Legends usando la API Mozambique        | Todos         |

> **Nota:** Los comandos `/setup-roles` y `/apex-status` son independientes y pueden configurarse en canales distintos. El comando de contexto aparece al hacer click derecho sobre un usuario.

---

## 🌐 Uso en Múltiples Canales

Una de las características más poderosas del bot es su capacidad para funcionar en diferentes canales de forma simultánea e independiente.

- **Panel de Roles y Estadísticas (`/setup-roles`)**: Puedes ejecutar este comando en un canal principal o de bienvenida (ej: `#bienvenida-y-roles`). El bot recordará este canal y mantendrá el panel de rangos y las estadísticas de jugadores siempre actualizado allí.

- **Panel de Estado de Apex (`/apex-status`)**: Este comando puedes ejecutarlo en un canal completamente diferente (ej: `#noticias-apex`). El bot mostrará y actualizará la rotación de mapas y el RP de Predator en ese canal, sin interferir con el panel de roles.

Esta separación te permite organizar tu servidor de manera más eficiente, manteniendo la información relevante en los canales adecuados.

---

### Rol común "Apex"

Además de los roles de rango, debes crear manualmente un **rol llamado `Apex`** en tu servidor.  
Este rol se asignará automáticamente a cualquier usuario que tenga un rango de Apex, y se removerá si el usuario ya no tiene ningún rango.

Puedes usar este rol para mencionar a todos los jugadores registrados fácilmente:

```
@Apex ¡Hay evento nuevo!
```

---

## Website

Accede al portal oficial: [apex-range.cubanova.com](https://apex-range.cubanova.com)

---

## Comando `/api-status`

Consulta el estado de la API externa utilizada por el bot.  
Muestra si la API está conectada y la última vez que se verificó.

---

## Comando de Contexto: Ver mi rango Apex

Permite consultar el rango de cualquier usuario (incluyéndote a ti mismo) desde el menú contextual:

1. Haz click derecho sobre el nombre de usuario (en la lista de miembros o en el chat).
2. Selecciona **"Ver mi rango Apex"** en la sección de Apps.

### Funcionamiento

- **Si eres tú mismo:**

  - El embed muestra tu rango actual con color, emoji y botones para gestionarlo o cerrarlo.
  - Si no tienes rango, puedes seleccionarlo directamente.

- **Si es otro usuario:**

  - El embed muestra el rango actual del usuario con color y emoji, y solo el botón "Cerrar".
  - Si el usuario no tiene rango, lo indica claramente.

- El mensaje es privado (ephemeral) y solo visible para quien ejecuta el comando.

---

## 🎛️ Panel Interactivo

- **Botones para seleccionar rango**: Elige tu rango y el bot te asigna el rol correspondiente.
- **Gestión de rango**: Cambia o elimina tu rango fácilmente.
- **Estadísticas en tiempo real**: Ve cuántos jugadores hay por rango y quiénes están online.
- **Cards visuales**: Avatares de los últimos registrados y listados por rango.

---

## 🌎 Visualización de países con banderas

Cuando un usuario tiene roles de país (por ejemplo, `ARGENTINA`, `MEXICO`, `VENEZUELA`), el bot mostrará automáticamente la bandera correspondiente junto al nombre del país en los listados de jugadores online.  
El nombre del país aparecerá capitalizado y en _cursiva_ para mayor claridad y menor impacto visual.

Ejemplo de visualización:

```
• @usuario1 (🇦🇷 _Argentina_, 🇲🇽 _Mexico_)
• @usuario2 (_Embajador_)
• @usuario3 (_Venelzuela_)
```

- Si el rol coincide con un país conocido, se muestra la bandera y el nombre capitalizado.
- Si el rol no es un país conocido, se muestra solo el nombre capitalizado y en cursiva.
- Puedes ampliar la lista de países editando el archivo `src/utils/country-flag.ts` y agregando más entradas al objeto `COUNTRY_NAME_TO_ISO`.

> **Nota:** Los roles de país deben estar en mayúsculas y escritos exactamente igual que en Discord para que la bandera se muestre correctamente.

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

### Variables de entorno adicionales

Para ocultar ciertos roles (por ejemplo, Admin, Apex, Server Booster, etc.) en los listados de jugadores, puedes usar la variable `EXCLUDED_ROLES` en tu archivo `.env`:

```
EXCLUDED_ROLES=Admin,Apex,Server Booster,Moderador,Embajador,Illuminati
```

- Separa los nombres de los roles por comas.
- Los roles listados aquí **no aparecerán** junto a los usuarios en los paneles ni listados del bot.
- El filtro también excluye automáticamente los roles de rango y `@everyone`.

Recuerda reiniciar el bot después de modificar el `.env` para que los cambios tengan efecto.

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

- `db/players_<ID_SERVER>.json`: Lista de jugadores y fecha de asignación de rango por servidor.
- `db/bot-state.json`: Estado principal del bot (canal, mensajes, etc).

> **Todos los archivos de datos JSON se almacenan en la carpeta `/db` ubicada en la raíz del proyecto.**  
> Si no existe, el bot la creará automáticamente al ejecutarse.

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

## Términos y Privacidad

El uso de este bot implica la aceptación de los [Términos y Condiciones](https://apex-range.cubanova.com/terms.html) y la [Política de Privacidad](https://apex-range.cubanova.com/privacy.html).

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
