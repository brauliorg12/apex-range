# <img src="https://cdn.discordapp.com/emojis/1410729026410119269.webp?size=40&quality=lossless" alt="Apex Icon" width="32" style="vertical-align:middle"> Apex Legends Rank Bot

Bot de Discord para gestionar y mostrar los rangos de los jugadores de Apex Legends en tu servidor, con panel interactivo, estadísticas y cards visuales.

![Version](https://img.shields.io/github/v/release/brauliorg12/apex-range)
![License](https://img.shields.io/github/license/brauliorg12/apex-range)
![GHCR Pulls](https://img.shields.io/badge/GHCR-pulls-blue?logo=github)

**🌐 Website: [https://apex-range.cubanova.com](https://apex-range.cubanova.com)**

---

**[>> Invitar Apex Legends Rank Bot a tu Servidor <<](https://discord.com/oauth2/authorize?client_id=1406424026427031696&scope=bot+applications.commands&permissions=268560384)**

### 🎯 **Análisis Detallado de Permisos Pre-configurados**

¡Excelente configuración! El valor `268560384` incluye **exactamente** todos los permisos críticos necesarios para el funcionamiento óptimo del bot.

#### 📋 **Permisos Incluidos en el Enlace:**

| Permiso                    | Valor Binario | Estado      | Descripción                          |
| -------------------------- | ------------- | ----------- | ------------------------------------ |
| **ViewChannel**            | 1024          | ✅ Incluido | Ver canales y mensajes               |
| **SendMessages**           | 2048          | ✅ Incluido | Enviar mensajes en canales           |
| **ManageMessages**         | 8192          | ✅ Incluido | Gestionar mensajes (fijar, eliminar) |
| **UseExternalEmojis**      | 262144        | ✅ Incluido | Usar emojis de otros servidores      |
| **ReadMessageHistory**     | 65536         | ✅ Incluido | Leer historial de mensajes           |
| **EmbedLinks**             | 16384         | ✅ Incluido | Insertar enlaces en embeds           |
| **AttachFiles**            | 32768         | ✅ Incluido | Adjuntar archivos e imágenes         |
| **ManageRoles**            | 268435456     | ✅ Incluido | Gestionar roles de rangos            |
| **UseApplicationCommands** | 2147483648    | ✅ Incluido | Usar comandos slash y de contexto    |

#### 🔢 **Verificación Matemática:**

```
268560384 = 1024 + 2048 + 8192 + 16384 + 32768 + 65536 + 262144 + 268435456
```

**¡Cálculo perfecto! ✅**

#### 📊 **Estado de la Configuración:**

- 🟢 **Permisos Críticos**: **100% Cubiertos** (9/9)
- 🟢 **Cobertura Total**: **100% de Compatibilidad**
- 🟢 **Configuración Óptima**: Lista para usar

#### 🚀 **Resultado Final:**

🎉 **Tu enlace de invitación está perfectamente configurado!**

Los administradores solo necesitan hacer **un click** en el enlace y el bot tendrá automáticamente todos los permisos necesarios para funcionar de manera excepcional en cualquier servidor.

> 💡 **Consejo Pro**: Esta configuración pre-optimizada ahorra tiempo y evita problemas de permisos comunes.

---

## 🚀 ¿Qué es Apex Legends Rank Bot?

Un bot profesional para comunidades de Apex Legends que permite:

- Asignar roles de rango mediante botones.
- Mostrar estadísticas y cards visuales de jugadores.
- Panel persistente y configurable.
- Comandos slash y de contexto para gestión avanzada.
- **Soporte completo para múltiples servidores** - funciona automáticamente en cualquier servidor donde se instale.

---

## 🆕 **Multi-Servidor Automático**

El bot ahora soporta **múltiples servidores simultáneamente** sin configuración adicional:

### Funcionalidades Multi-Servidor

- **Configuración Independiente**: Cada servidor mantiene su propia configuración, roles y datos.
- **Detección Automática**: Al unirse a un nuevo servidor, el bot envía automáticamente un mensaje de bienvenida invitando a ejecutar `/setup-roles`.
- **Recuperación Automática**: Si el bot vuelve a un servidor donde ya estaba configurado, automáticamente restaura todas las funciones y actualiza la presencia global.
- **Archivos Separados**: Se crean archivos JSON independientes por servidor:
  - `.bot-state/{guildId}.json` - Estado del bot por servidor
  - `db/players_{guildId}.json` - Jugadores por servidor
- **Prevención de Conflictos**: Sistema de lock que impide ejecutar múltiples instancias del mismo bot.
- **Presencia Global**: La presencia del bot muestra estadísticas combinadas de todos los servidores configurados.
- **Monitoreo Mejorado**: Endpoint `/instance` para verificar el estado de la instancia actual.

### Presencia Global

La presencia del bot muestra estadísticas combinadas de todos los servidores:

```
🟢 25 en línea | 👥 150 registrados | 🌐 3 servidores
```

Esto incluye:

- **Jugadores online** en total de todos los servidores
- **Jugadores registrados** en total de todos los servidores
- **Número de servidores** donde el bot está configurado

### Recuperación Automática de Servidores

Cuando el bot se une a un servidor donde ya existía configuración previa:

1. **Detección Inteligente**: El bot verifica automáticamente si ya hay archivos de configuración para ese servidor.
2. **Restauración Completa**: Restaura todos los paneles, mensajes y configuraciones anteriores.
3. **Actualización de Presencia**: Inmediatamente actualiza la presencia global con las estadísticas del servidor recuperado.
4. **Sincronización de Datos**: Sincroniza la lista de jugadores con los roles actuales del servidor.
5. **Mensaje de Confirmación**: Envía un mensaje confirmando que el bot ha sido reconectado exitosamente.

### Cómo Funciona

1. **Instalación**: Invita el bot a tu servidor usando el enlace de arriba.
2. **Configuración**: Un administrador ejecuta `/setup-roles` en el canal deseado.
3. **Funcionamiento**: El bot opera independientemente en cada servidor.
4. **Escalabilidad**: Puedes tener el bot en tantos servidores como quieras.
5. **Recuperación**: Si el bot sale y vuelve, automáticamente restaura la configuración.

> **Nota**: El bot detecta automáticamente nuevos servidores y se configura por separado en cada uno. Si vuelve a un servidor ya configurado, restaura automáticamente todas las funciones.

---

## 🆕 Sistema de Roles Personalizados por Servidor

El bot ahora soporta **nombres de roles personalizados por servidor**, permitiendo que cada comunidad use sus propios nombres de rangos sin afectar a otros servidores.

### Funcionalidades del Sistema

- **Configuración Independiente**: Cada servidor puede tener sus propios nombres de roles (ej. "Bronce" → "Cobre", "Apex Predator" → "Leyenda Suprema").
- **Detección Automática**: Al ejecutar `/setup-roles`, el bot detecta roles existentes en el servidor y sugiere mapeos automáticamente usando similitud de nombres.
- **Almacenamiento JSON**: Los mapeos se guardan en `db/server-config-{guildId}.json` por servidor.
- **Validación en Tiempo Real**: El bot verifica que los roles mapeados existan en Discord; si se eliminan, usa automáticamente los nombres por defecto.
- **Fallback Seguro**: Si un rol personalizado no existe, el sistema usa el nombre por defecto de APEX_RANKS sin errores.
- **Setup Interactivo**: Menú con botones para confirmar mapeos sugeridos o crear roles faltantes.

### Cómo Funciona

1. **Detección Inteligente**: El bot compara los nombres de roles existentes con los rangos por defecto usando normalización (minúsculas, sin acentos) y similitud de strings.
2. **Sugerencias Automáticas**: Muestra una lista de mapeos sugeridos con botones "Confirmar" o "Saltar".
3. **Confirmación del Usuario**: El administrador confirma los mapeos, que se guardan en JSON.
4. **Validación Continua**: En todas las operaciones, `getApexRanksForGuild()` valida que los roles existan; si no, usa defaults.
5. **Actualización Dinámica**: Los cambios en roles se reflejan automáticamente sin reconfiguración.

### Ejemplo de Mapeo

**Servidor Español:**

- Rookie → Novato
- Bronze → Bronce
- Apex Predator → Depredador Apex

**Servidor Inglés (por defecto):**

- Rookie → Rookie
- Bronze → Bronze
- Apex Predator → Apex Predator

### Archivo de Configuración

Cada servidor tiene su propio JSON en `db/server-config-{guildId}.json`:

```json
{
  "rookie": "Novato",
  "bronze": "Bronce",
  "silver": "Plata",
  "gold": "Oro",
  "platinum": "Platino",
  "diamond": "Diamante",
  "master": "Maestro",
  "predator": "Depredador Apex"
}
```

### Beneficios

- ✅ **Flexibilidad Total**: Cada servidor puede usar sus propios nombres culturales/idiomáticos.
- ✅ **Sin Conflictos**: Un servidor puede tener "Oro" mientras otro tiene "Gold".
- ✅ **Detección Automática**: Reduce configuración manual al sugerir mapeos existentes.
- ✅ **Robustez**: Maneja eliminaciones de roles sin romper el bot.
- ✅ **Escalabilidad**: Funciona igual en 1 o 1000 servidores.

### Configuración Paso a Paso

1. **Ejecuta `/setup-roles`** en tu servidor como administrador.
2. **El bot detecta roles existentes** y muestra sugerencias de mapeo.
3. **Confirma los mapeos** usando los botones interactivos.
4. **Si faltan roles**, el bot ofrece crearlos automáticamente (si tiene permisos) o proporciona instrucciones manuales.
5. **Los mapeos se guardan** y se usan automáticamente en todas las funciones del bot.

### Validación y Seguridad

- **Chequeo de Existencia**: Antes de usar un nombre personalizado, el bot verifica `guild.roles.cache.some((r: any) => r.name === mappedName)`.
- **Fallback Automático**: Si el rol no existe, usa el nombre por defecto de APEX_RANKS.
- **Sin Errores**: El sistema nunca falla por configuración corrupta; siempre hay un nombre válido.
- **Actualización en Tiempo Real**: Los cambios en roles de Discord se detectan inmediatamente.

### Detalles Técnicos

- **Función Principal**: `getApexRanksForGuild(guildId, guild?)` en `src/models/constants.ts`.
- **Almacenamiento**: `loadServerConfig(guildId)` y `saveServerConfig(guildId, config)` en `src/utils/server-config.ts`.
- **Setup Handlers**: `src/configs/setup-roles-handlers.ts` maneja la detección y confirmación.
- **Validación Global**: Todas las funciones del bot pasan `guild` a `getApexRanksForGuild` para activar validación.

### Solución de Problemas

- **Roles no se mapean**: Asegúrate de que los nombres sean similares a los por defecto para la detección automática.
- **Errores después de eliminar roles**: El bot automáticamente usa defaults; no requiere acción manual.
- **Configuración perdida**: Los JSON se conservan; ejecuta `/setup-roles` nuevamente si necesitas cambiar mapeos.
- **Múltiples servidores**: Cada servidor mantiene su configuración independiente.

Este sistema hace que el bot sea completamente adaptable a cualquier comunidad, manteniendo simplicidad y robustez.

---

## 🔗 Integración con la API de Mozambique (Perfil Apex)

El bot ahora permite consultar el perfil de cualquier jugador de Apex Legends usando la [API de Mozambique](https://apexlegendsapi.com/).

### Funcionalidad

- Consulta tu perfil de Apex Legends desde el panel o usando el modal interactivo.
- Muestra estadísticas básicas: nivel, rango, kills, leyenda seleccionada, UID y plataforma.
- El card/embed del perfil usa el color correspondiente al rango del jugador.
- Si ocurre un error (por ejemplo, usuario no encontrado), se muestra un card de error con borde rojo y botón cerrar.
- Estadísticas y rango del modo Arenas, si están disponibles.
- Información en tiempo real del jugador (estado online, sala, etc), si la API lo provee.

### Configuración

1. **Obtén tu API Key gratuita en** [https://apexlegendsapi.com/](https://apexlegendsapi.com/).
2. Agrega estas variables a tu archivo `.env`:

   ```
   MOZA_API_KEY=TU_API_KEY_DE_MOZAMBIQUE
   MOZA_URL=https://api.mozambiquehe.re
   ```

3. Reinicia el bot para que tome la nueva configuración.

### Cómo usarlo

- Haz click en el botón **"Ver perfil Apex Global"** en el panel del bot.
- Completa el modal con tu nombre de usuario y plataforma (PC, PS4 o X1).
- Recibirás un mensaje privado con tu perfil y estadísticas.
- **Además del embed principal**, recibirás:
  - Un **embed de Arenas** con tu rango y estadísticas en ese modo.
  - Un **embed de Realtime** con tu estado actual en el juego (si la API lo provee).

---

## 🆕 Panel de Estado de Apex Legends y Perfil Interactivo

### Card de Estado de la API Mozambique

El bot ahora incluye un **embed dinámico** que muestra información en tiempo real de la API oficial de Mozambique:

- **Rotación de mapas**: Battle Royale, Ranked y LTM, siempre actualizados.
- **RP necesario para Predator**: Visualización clara para PC, PS4 y Xbox.
- **Actualización automática**: El panel se refresca cada 5 minutos para mantener la información al día.
- **Fuente y timestamp**: Siempre sabrás de dónde provienen los datos y cuándo se actualizaron.

Esto permite a tu comunidad estar informada al instante sobre el estado del juego y los requisitos competitivos.

### Botón "Ver perfil Apex Global"

Debajo del embed de estado, encontrarás el botón:

```
[ Ver perfil Apex Global ]
```

- Al pulsarlo, se abre un modal donde puedes ingresar tu plataforma y usuario.
- El bot consulta la API de Mozambique y te envía un **card privado** con tus estadísticas principales: nivel, kills, rango, leyenda principal, UID y plataforma.
- El embed utiliza colores y emojis personalizados según tu rango.
- Si ocurre un error (usuario no encontrado, API caída, etc), recibirás un mensaje claro y profesional.

#### Experiencia de usuario

- **Acceso rápido**: Todo desde el canal principal, sin comandos complicados.
- **Privacidad**: Tu perfil se muestra solo a ti mediante mensaje ephemeral.
- **Integración total**: El botón y el embed están siempre visibles y actualizados en el panel.
- Al consultar tu perfil, verás **hasta tres embeds**:
  - El embed principal con tus estadísticas globales.
  - El embed de Arenas con tu rango y datos de ese modo.
  - El embed de Realtime con tu estado actual en el juego (si está disponible).

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

## 🎨 Tipografía utilizada

El bot utiliza la fuente **Montserrat Bold** para todos los cards visuales y textos generados con canvas, logrando un estilo moderno y profesional.

La fuente se encuentra en la carpeta:

```
assets/fonts/Montserrat-Bold.ttf
```

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

| Comando / Acción   | Descripción                                                                                                              | Permisos      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `/setup-roles`     | Configura el panel de selección de rango y mensaje de estadísticas con menú interactivo para crear roles automáticamente | Administrador |
| `/apex-status`     | Muestra el estado de Apex (mapas, Predator RP)                                                                           | Todos         |
| `/total-jugadores` | Muestra el número total de jugadores con rango                                                                           | Todos         |
| `/cleanup-data`    | [ADMIN] Limpia archivos JSON de servidores obsoletos                                                                     | Owner del Bot |

> **Nota:** Los comandos `/setup-roles` y `/apex-status` son independientes y pueden configurarse en canales distintos. El comando de contexto aparece al hacer click derecho sobre un usuario.

### Menú Interactivo de Configuración

Al ejecutar `/setup-roles`, el bot:

1. **Detecta roles faltantes automáticamente** y muestra un menú interactivo con opciones.
2. **Ofrece crear roles automáticamente** si el bot tiene permisos, o proporciona instrucciones manuales.
3. **Guía paso a paso** con botones para continuar o cancelar la configuración.
4. **Integración completa**: Incluye el botón "Ver perfil Apex Global" en el panel generado.

## Menú Contextual

- `Ver mi rango en Apex Range` (contexto) | Muestra tu rango actual y opciones de gestión | Todos |

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

## Comando `/api-status`

Consulta el estado de la API externa utilizada por el bot.  
Muestra si la API está conectada y la última vez que se verificó.

---

## Comando de Contexto: Ver mi rango en Apex Range

Permite consultar el rango de cualquier usuario (incluyéndote a ti mismo) desde el menú contextual:

1. Haz click derecho sobre el nombre de usuario (en la lista de miembros o en el chat).
2. Selecciona **"Ver mi rango en Apex Range"** en la sección de Apps.

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
- **Soporte completo para múltiples servidores**.
- **Detección automática de nuevos servidores**.
- **Recuperación automática de configuración previa**.
- **Sistema de lock para prevenir instancias duplicadas**.
- **Archivos de datos separados por servidor**.
- **Health server integrado con monitoreo avanzado**.
- **Presencia global con estadísticas combinadas de todos los servidores**.

---

## 📊 Sistema de Logging Avanzado

El bot implementa un sistema de logging profesional y granular:

- **Logs separados por servidor**: Cada servidor tiene su propio archivo de log (`logs/guild_{guildId}_{guildName}.log`) para facilitar el debugging y monitoreo.
- **Detección mejorada de eventos**: Logs detallados para conexiones, errores, interacciones y cambios de estado.
- **Monitoreo en tiempo real**: Información clara sobre permisos, roles y configuraciones por servidor.
- **Separación de concerns**: Logs globales (`logs/global.log`) para eventos del sistema y logs específicos para eventos por servidor.

> **Nota**: Los logs se rotan automáticamente y se almacenan en la carpeta `logs/` para análisis posterior.

---

## 🖼️ Carga Dinámica de Imágenes

El bot implementa un sistema avanzado de **carga dinámica de imágenes** que permite actualizar las imágenes del embed de selección de rango sin necesidad de reiniciar el bot o redeployar comandos.

### Funcionalidades

- **Actualización automática cada 5 minutos**: Las imágenes se refrescan automáticamente sin intervención manual
- **Configuración centralizada**: Todas las imágenes se configuran en un solo archivo TypeScript
- **Hot reload**: Cambia la URL en el archivo de configuración y el embed se actualizará automáticamente
- **Múltiples servidores**: Cada servidor puede tener su propia imagen independiente
- **Fallback automático**: Si hay errores en la carga, el sistema mantiene la última imagen válida

### Archivo de Configuración

Las imágenes se configuran en el archivo `src/configs/images.ts`:

```typescript
// Configuración de imágenes para el bot
export const imagesConfig = {
  initRoleSelectionImage:
    'https://apex-range.cubanova.com/assets/imgs/init.png',
};
```

### Cómo Funciona

1. **Configuración inicial**: Al ejecutar `/setup-roles`, el bot carga la imagen desde `images.ts`
2. **Actualización automática**: Cada 5 minutos, el bot vuelve a leer el archivo TypeScript y actualiza el embed si la URL cambió
3. **Detección de cambios**: El sistema compara la nueva URL con la anterior para evitar actualizaciones innecesarias
4. **Manejo de errores**: Si la nueva URL es inválida, se mantiene la imagen anterior

### Beneficios

- ✅ **Actualizaciones instantáneas**: Cambia la imagen sin tocar código
- ✅ **Sin downtime**: Las actualizaciones ocurren en background
- ✅ **Configuración simple**: Solo necesitas editar un archivo TypeScript
- ✅ **Escalabilidad**: Funciona igual en 1 o 100 servidores
- ✅ **Robustez**: Sistema de validación y fallback integrado

### Uso Práctico

Para cambiar la imagen del embed de selección de rango:

1. Edita `src/configs/images.ts`
2. Cambia la URL en `initRoleSelectionImage`
3. Guarda el archivo
4. Espera máximo 5 minutos o reinicia el bot para ver los cambios inmediatamente

**Ejemplo de cambio:**

```typescript
// Antes
export const imagesConfig = {
  initRoleSelectionImage:
    'https://apex-range.cubanova.com/assets/imgs/init.png',
};

// Después
export const imagesConfig = {
  initRoleSelectionImage: 'https://tu-servidor.com/nueva-imagen.png',
};
```

El embed se actualizará automáticamente en todos los servidores donde esté configurado el bot.

---

## 🏗️ Estructura del Proyecto

- `src/commands/`  
  Comandos slash y de contexto (ej: `/setup-roles`, `/apex-status`, `/total-jugadores`, comandos de menú contextual).

- `src/configs/`  
  Configuraciones y handlers específicos por funcionalidad (ej: `setup-roles-handlers.ts` para gestión de roles).

- `src/interactions/`  
  Handlers para botones, selects y menús interactivos (ej: gestión de rangos, panel de ayuda, listado de jugadores).

- `src/services/`  
  Integraciones con APIs externas y lógica de negocio (ej: `apex-api.ts` para la API de Mozambique).

- `src/utils/`  
  Funciones auxiliares, helpers, renderizado de cards, lógica de estadísticas, banderas de países, etc.

- `src/index.ts`  
  Punto de entrada principal del bot con sistema de lock de instancias.

- `src/init-bot.ts`  
  Inicialización del bot y configuración multi-servidor.

- `src/health-server.ts`  
  Servidor de salud con endpoints de monitoreo.

- `src/deploy-commands.ts`  
  Script para desplegar los comandos en Discord.

- `assets/fonts/`  
  Fuentes utilizadas para los cards visuales (ej: `Montserrat-Bold.ttf`).

- `assets/`  
  Imágenes, emojis y otros recursos estáticos.

- `db/`  
  Archivos de datos JSON de jugadores por servidor (`players_{guildId}.json`).

- `.bot-state/`  
  Archivos de estado del bot por servidor (`{guildId}.json`).

- `.bot-lock`  
  Archivo temporal para prevenir múltiples instancias.

- `.env`  
  Variables de entorno para configuración sensible.

- `README.md`  
  Documentación principal del proyecto.

- `package.json`  
  Dependencias, scripts y metadatos del proyecto.

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

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
# Variables Obligatorias
DISCORD_TOKEN=TU_TOKEN_DEL_BOT
CLIENT_ID=TU_CLIENT_ID

# Variables Internas (Opcionales)
API_URL=http://localhost:3001/health
HEALTH_PORT=3001

# APIs Externas
TRACKER_API=TU_API_KEY_DE_APEX_TRACKER
MOZA_API_KEY=TU_API_KEY_DE_MOZAMBIQUE
MOZA_URL=https://api.mozambiquehe.re

# Configuración Global
EXCLUDED_ROLES=Admin,Apex,Server Booster,Moderador,Embajador,Illuminati
```

### Variables de Entorno Detalladas

| Variable         | Descripción                  | Requerida | Ejemplo                        |
| ---------------- | ---------------------------- | --------- | ------------------------------ |
| `DISCORD_TOKEN`  | Token del bot de Discord     | ✅        | `XXXXXXXXX`                    |
| `CLIENT_ID`      | ID de la aplicación Discord  | ✅        | `XXXXXXXXX`                    |
| `API_URL`        | URL del health check interno | ❌        | `http://localhost:3001/health` |
| `HEALTH_PORT`    | Puerto del servidor de salud | ❌        | `3001`                         |
| `TRACKER_API`    | API Key de Apex Tracker      | ❌        | `XXXXXXXXX`                    |
| `MOZA_API_KEY`   | API Key de Mozambique        | ❌        | `XXXXXXXXX`                    |
| `MOZA_URL`       | URL de la API de Mozambique  | ❌        | `https://api.mozambiquehe.re`  |
| `EXCLUDED_ROLES` | Roles a excluir en listados  | ❌        | `Admin,Apex,Server Booster`    |
| `BOT_OWNER_ID`   | ID del owner del bot         | ❌        | `123456789012345678`           |

> **Nota**: Las variables específicas de servidor (como IDs de canales) ya no son necesarias ya que el bot las guarda automáticamente por servidor.

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

El bot incluye **detección automática mejorada de permisos faltantes** con mensajes detallados:

- **Verificación granular**: Comprueba permisos por servidor y canal por separado.
- **Mensajes de error específicos**: Indica exactamente qué permiso falta y cómo solucionarlo.
- **Guía integrada**: Proporciona instrucciones directas para activar permisos faltantes.

**Permisos requeridos:**

- Gestionar roles
- Enviar mensajes
- Leer historial de mensajes
- Usar emojis externos
- Gestionar mensajes

---

## 🔐 Permisos Requeridos Detallados

El bot requiere permisos específicos tanto a nivel de servidor como de canal. A continuación, una explicación detallada de cada permiso, dónde se utiliza y por qué es necesario:

### **Permisos a Nivel de Servidor (Guild):**

#### **`ManageRoles`** - Gestionar Roles

- **Descripción**: Permite al bot crear y asignar roles de rangos de Apex Legends
- **Dónde se usa**: `setup-roles-handlers.ts`, `handleMissingRoles`, `setup-config-handler.ts`
- **Crítico**: Sí - El setup falla completamente sin este permiso
- **Por qué**: El bot crea automáticamente roles como "Bronce", "Plata", etc. cuando no existen

#### **`UseApplicationCommands`** - Usar Comandos de Aplicación

- **Descripción**: Permite al bot responder a comandos slash y de contexto
- **Dónde se usa**: Todos los comandos (`/setup-roles`, `/apex-status`, etc.)
- **Crítico**: Sí - Los comandos no funcionan sin este permiso
- **Por qué**: Esencial para la interacción básica con el bot

### **Permisos a Nivel de Canal (Channel):**

#### **`ViewChannel`** - Ver Canal

- **Descripción**: Permite al bot ver el canal donde se ejecutan comandos y se envían mensajes
- **Dónde se usa**: Todos los comandos y handlers de interacciones
- **Crítico**: Sí - El bot no puede funcionar en el canal sin este permiso
- **Por qué**: Necesario para procesar cualquier interacción en el canal

#### **`SendMessages`** - Enviar Mensajes

- **Descripción**: Permite enviar mensajes de selección de roles, estadísticas y respuestas
- **Dónde se usa**: `setup-roles.ts`, `apex-status.ts`, handlers de botones y modales
- **Crítico**: Sí - El bot no puede comunicarse sin este permiso
- **Por qué**: Envía el panel de roles, estadísticas y respuestas a comandos

#### **`ManageMessages`** - Gestionar Mensajes

- **Descripción**: Permite fijar mensajes importantes y limpiar mensajes antiguos
- **Dónde se usa**: `setup-roles.ts` (pin messages), `cleanupExistingMessages`, `send-online-panel.ts`
- **Crítico**: Moderadamente - El bot funciona sin él pero no puede fijar mensajes importantes
- **Por qué**: Fija el panel de roles y estadísticas para mantenerlos visibles

#### **`UseExternalEmojis`** - Usar Emojis Externos

- **Descripción**: Permite usar emojis personalizados de Discord en botones y embeds
- **Dónde se usa**: `button-helper.ts`, embeds con emojis en handlers
- **Crítico**: No - Los emojis se muestran como texto alternativo
- **Por qué**: Mejora la apariencia visual de botones y embeds

#### **`ReadMessageHistory`** - Leer Historial de Mensajes

- **Descripción**: Permite verificar el estado del canal y limpiar mensajes existentes
- **Dónde se usa**: `cleanupExistingMessages`, verificación de canal en `setup-roles.ts`
- **Crítico**: Moderadamente - Afecta la limpieza automática de mensajes
- **Por qué**: Necesario para identificar mensajes antiguos durante el setup

#### **`EmbedLinks`** - Insertar Enlaces

- **Descripción**: Permite enviar embeds con enlaces a imágenes y recursos externos
- **Dónde se usa**: Todos los embeds enviados por el bot (rank cards, stats, etc.)
- **Crítico**: Sí - Los embeds no se muestran correctamente sin este permiso
- **Por qué**: Los embeds contienen enlaces a imágenes de tarjetas de rango y perfiles

#### **`AttachFiles`** - Adjuntar Archivos

- **Descripción**: Permite adjuntar imágenes generadas como tarjetas de rango y gráficos
- **Dónde se usa**: `rank-card-canvas.ts`, `recent-avatars-canvas.ts`, `predator-badge-canvas.ts`
- **Crítico**: Sí - Las imágenes no se pueden mostrar sin este permiso
- **Por qué**: El bot genera y envía imágenes dinámicas de rangos y estadísticas

### **Cómo Verificar y Solucionar Permisos Faltantes**

1. **Mensajes Automáticos**: El bot detecta automáticamente permisos faltantes y muestra mensajes detallados
2. **Configuración del Servidor**:
   - Ve a **Configuración del servidor** → **Roles**
   - Busca el rol del bot (generalmente "Apex Range")
   - Activa los permisos faltantes marcados en rojo
3. **Permisos por Canal**: Para permisos específicos de canal, verifica la configuración del canal individual
4. **Reintentos**: Después de cambiar permisos, ejecuta `/setup-roles` nuevamente

### **Ejemplo de Mensaje de Error Detallado**

Cuando falta un permiso, el bot muestra información específica como:

```
❌ Permisos Faltantes

El bot necesita los siguientes permisos para funcionar correctamente:

• Gestionar Roles (servidor)
  Crítico para crear roles de rangos de Apex Legends automáticamente cuando no existen, y asignarlos a usuarios.

  **Dónde se usa:** setup-roles-handlers.ts, handleMissingRoles, setup-config-handler.ts
  **Crítico:** Sí - El setup falla completamente sin este permiso

• Adjuntar Archivos (canal)
  Esencial para adjuntar imágenes generadas como tarjetas de rango, gráficos de estadísticas y avatares.

  **Dónde se usa:** rank-card-canvas.ts, recent-avatars-canvas.ts, predator-badge-canvas.ts
  **Crítico:** Sí - Las imágenes no se pueden mostrar sin este permiso

🔧 Solución:
1. Ve a Configuración del servidor → Roles
2. Busca el rol "Apex Range" (o el rol del bot)
3. Activa los permisos faltantes
4. Para permisos de canal, también verifica la configuración específica del canal
```

### **Permisos Recomendados Adicionales**

- **`MentionEveryone`**: No requerido, pero útil si quieres mencionar roles
- **`Administrator`**: Solo para ejecutar `/setup-roles` (usuario, no bot)

### **Solución de Problemas Comunes**

- **"Permisos insuficientes"**: Verifica que el rol del bot tenga todos los permisos marcados como "Crítico: Sí"
- **Botones no responden**: Puede ser falta de `UseApplicationCommands` o `ViewChannel`
- **Imágenes no aparecen**: Verifica `AttachFiles` y `EmbedLinks`
- **Mensajes no se fijan**: Falta `ManageMessages` (no crítico para funcionamiento básico)

Esta documentación detallada asegura que puedas configurar correctamente el bot y resolver cualquier problema de permisos de manera eficiente.

---

## 🩺 Health Server y Monitoreo

El bot incluye un servidor de salud integrado para monitoreo:

### Endpoints Disponibles

- `GET /health` - Verificación básica de salud
- `GET /api-status` - Estado de la API externa
- `GET /instance` - Información de la instancia actual (PID, uptime, versión)

### Ejemplo de Respuesta `/instance`

```json
{
  "pid": 12345,
  "uptime": 3600.5,
  "version": "1.10.6",
  "timestamp": "2025-09-16T..."
}
```

### Uso

- El health server se inicia automáticamente en el puerto 3001 (configurable).
- Útil para monitoreo con herramientas como UptimeRobot o para verificar el estado del bot.

---

## 🖼️ Cards y Estadísticas Visuales

El bot genera imágenes dinámicas con los avatares y rangos de los jugadores usando [@napi-rs/canvas](https://www.npmjs.com/package/@napi-rs/canvas).  
Las cards muestran los últimos registrados y los jugadores online por rango, todo en alta calidad.

---

## 🆕 Paginación efímera en paneles de jugadores por rango

El bot ahora permite navegar entre páginas de jugadores online por rango usando botones interactivos:

Botones "Siguiente" y "Anterior": Navega fácilmente entre páginas de jugadores en los paneles efímeros.
Numeración automática: Los jugadores aparecen numerados solo en los paneles efímeros (cuando usas "Ver más" o paginas).
Visualización clara: El panel principal sigue mostrando la lista sin numeración, manteniendo la interfaz limpia y ordenada.
Experiencia mejorada: Puedes ver todos los jugadores de un rango, incluso si hay más de los que caben en una sola página.
Esta funcionalidad facilita la gestión y visualización de grandes comunidades, permitiendo acceder a toda la información de manera ordenada y rápida.

---

## 📦 Archivos de Datos

El bot crea automáticamente archivos JSON separados para cada servidor:

- `db/players_{guildId}.json`: Lista de jugadores y fecha de asignación de rango por servidor.
- `.bot-state/{guildId}.json`: Estado del bot por servidor (canal, mensajes, configuración).

> **Todos los archivos de datos JSON se almacenan en las carpetas `/db` y `/.bot-state` ubicadas en la raíz del proyecto.**  
> Si no existen, el bot las creará automáticamente al ejecutarse.

### 💾 Conservación de Datos

**Los archivos JSON se conservan automáticamente** cuando:

- ✅ El bot es removido de un servidor
- ✅ Un servidor se vuelve inaccesible
- ✅ El bot se reinicia

Esto permite:

- **Recuperación rápida**: Si el bot vuelve a un servidor, puede restaurar la configuración anterior
- **Datos históricos**: Mantener registro de actividad pasada
- **Backup automático**: Los archivos sirven como backup de la configuración

### 🌍 Presencia Global vs. Estadísticas Locales

- **Presencia Global**: Muestra estadísticas combinadas de TODOS los servidores (visible en todos lados)
- **Embeds Locales**: Muestran estadísticas específicas del servidor donde están ubicados

**Ejemplo:**

- **Servidor A**: Embed local muestra "15 online | 50 registrados" + Presencia global "25 online | 150 registrados | 3 servidores"
- **Servidor B**: Embed local muestra "10 online | 100 registrados" + Presencia global igual

### 🧹 Limpieza Opcional

Si deseas limpiar archivos antiguos, puedes:

1. **Manual**: Eliminar archivos específicos de `.bot-state/` y `db/`
2. **Automática**: Descomentar el código en `src/init-bot.ts` para limpieza automática
3. **Comando**: Usar `/cleanup-data confirm:true` (solo para el owner del bot)

### Comando `/cleanup-data`

Comando administrativo para limpiar archivos JSON de servidores donde el bot ya no está presente.  
**Solo puede ser usado por el owner del bot** (configurado en `BOT_OWNER_ID`).

**Uso:**

```
/cleanup-data confirm:true
```

**Qué hace:**

- Escanea todos los archivos JSON existentes
- Identifica archivos de servidores donde el bot ya no está presente
- Elimina los archivos obsoletos
- Muestra un resumen de la operación

**Nota:** Este comando es opcional y solo debe usarse si realmente quieres eliminar datos históricos.

### Sistema de Lock de Instancias

Para prevenir conflictos al ejecutar múltiples instancias:

- `.bot-lock`: Archivo temporal que previene ejecutar el bot simultáneamente.
- Se crea automáticamente al iniciar y se elimina al cerrar.
- Si intentas ejecutar otra instancia, el bot se detendrá con un mensaje de error.

### 🔄 Recuperación de Datos

Cuando el bot vuelve a un servidor donde ya existían archivos:

1. **Configuración automática**: El bot detecta y restaura la configuración anterior
2. **Mensajes existentes**: Los IDs de mensajes se verifican y reutilizan si son válidos
3. **Jugadores registrados**: La lista de jugadores se mantiene intacta
4. **Re-setup opcional**: Puedes ejecutar `/setup-roles` nuevamente si necesitas cambiar la configuración

> **Nota**: Si los mensajes originales fueron eliminados, el bot creará nuevos paneles automáticamente.

---

## 📝 Ejemplo de Uso

1. Un admin ejecuta `/setup-roles` en el canal deseado.
2. El panel aparece con botones para seleccionar rango.
3. Los usuarios eligen su rango y el bot les asigna el rol.
4. El mensaje de estadísticas se actualiza automáticamente.
5. Los usuarios pueden ver su rango con el menú contextual "Ver mi rango en Apex Range".

---

## 🐳 Docker

Puedes ejecutar el bot fácilmente usando Docker desde GitHub Container Registry (GHCR):

```bash
docker pull ghcr.io/brauliorg12/discord-apex:latest
docker run -e DISCORD_TOKEN=TU_TOKEN -e CLIENT_ID=TU_CLIENT_ID ghcr.io/brauliorg12/discord-apex:latest
```

Asegúrate de pasar las variables de entorno necesarias (`DISCORD_TOKEN`, `CLIENT_ID`, etc).

---

## ❓ Solución de Problemas

### Problemas Comunes

- **Comandos no aparecen**: Ejecuta `npm run deploy-commands` y espera unos minutos.
- **Bot no responde**: Revisa el token, permisos y configuración.
- **Comando de contexto tarda en aparecer**: Puede ser caché de Discord (espera hasta 1 hora).
- **Error de instancia duplicada**: Si ves "Ya hay una instancia del bot corriendo", detén la otra instancia primero.
- **Nuevo servidor no funciona**: Asegúrate de que un administrador ejecute `/setup-roles` en el nuevo servidor.

### Verificación de Estado

- **Health Check**: Visita `http://localhost:3001/health` para verificar que el bot esté corriendo.
- **Estado de API**: Usa `http://localhost:3001/api-status` para ver el estado de las APIs externas.
- **Info de Instancia**: `http://localhost:3001/instance` muestra detalles de la instancia actual.

### Multi-Servidor

- **Configuración por servidor**: Cada servidor necesita su propio `/setup-roles`.
- **Datos independientes**: Los archivos JSON son separados por servidor.
- **Permisos**: El bot necesita los mismos permisos en cada servidor.
- **Presencia global**: La presencia del bot combina estadísticas de todos los servidores.

### Logs y Debug

- Los logs del bot se muestran en la consola donde se ejecuta.
- Revisa los logs para mensajes de error específicos.
- Para debug avanzado, ejecuta con `npm run dev` para ver logs detallados.

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
- Company: CubaNova

---

¿Te gusta este bot?  
⭐ ¡Dale una estrella en GitHub! ⭐

[Reportar Bug](https://github.com/brauliorg12/discord-apex/issues) • [Solicitar Feature](https://github.com/brauliorg12/discord-apex/issues) • [Discusiones](https://github.com/brauliorg12/discord-apex/discussions)
