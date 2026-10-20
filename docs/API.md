# Panel de Estado y API

Esta guía explica el panel de estado de Apex Legends, el sistema de cache inteligente y los detalles técnicos de las APIs.

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

- El panel de estado de Apex y sus botones se generan al ejecutar `/apex-status`. El panel de roles y estadísticas se genera con `/setup-roles`.
- El estado de la API se obtiene usando la [API de Mozambique](https://apexlegendsapi.com/).
- El botón utiliza componentes interactivos de Discord para una experiencia moderna y fluida.
- El código es modular y fácil de mantener.

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

## 🛰️ Estado de los Servidores: Significado de los Emojis

En la card de estado de servidores, los siguientes emojis indican el estado de cada región/plataforma:

| Emoji | Estado      | Significado        |
| ----- | ----------- | ------------------ |
| 🟢    | UP          | Operativo          |
| 🟡    | SLOW        | Lento/intermitente |
| 🔴    | DOWN        | Caído              |
| ⚪    | Desconocido | Estado desconocido |

Esto te permite identificar rápidamente el estado de los servidores de Apex Legends en cada región.

## 🆘 Ayuda y Mensaje de Estado

Cuando uses `/apex-status` o veas el panel de estado, ten en cuenta:

- Si ves `⚠️ Datos en cache temporalmente` en alguna card, significa que la API no respondió y se está mostrando la última información válida.
- **Panel de estado Apex**: Se actualiza automáticamente cada 5 minutos.
- **Roles y presencia**: Se actualizan cada 2 minutos para mantener la información al día.
- **Imágenes del embed**: Se refrescan cada 10 minutos para optimizar rendimiento.
- Los emojis de estado de servidor indican si cada región está operativa, lenta o caída.
- Si el panel de Apex es eliminado, el bot lo recrea automáticamente y limpia paneles viejos duplicados.
- Los errores del panel se avisan solo al canal de control/admin o al owner. No se publican tarjetas de error en canales públicos.
- `/apex-status` responde de forma efímera al usuario; el panel público se publica como mensaje aparte.

## ⏱️ Detalles de Intervalos, Reintentos y Tiempos de Consulta

Para adaptarse a las limitaciones de la API de Mozambique y evitar bloqueos, el bot implementa la siguiente estrategia de consulta y cache optimizada:

- **Actualización automática por tipo:**

  - **Panel de estado Apex**: Se actualiza cada **5 minutos** (300 segundos) en cada canal configurado
  - **Roles y presencia**: Se actualizan cada **2 minutos** (120 segundos) para mejor eficiencia
  - **Imágenes del embed**: Se refrescan cada **10 minutos** (600 segundos) para reducir carga

- **Orden de consulta de endpoints:**

  1. **Primero** se consultan los endpoints críticos:
     - Rotación de mapas (`mapRotation`)
     - Estado de los servidores (`serverStatus`)
  2. **Luego de 1 segundo de espera**, se consulta el endpoint secundario:
     - RP necesario para Predator (`predatorRank`)

- **Reintentos:**  
  Cada consulta a la API se reintenta hasta **3 veces** en caso de error, con un intervalo de **1.2 segundos** entre cada intento.

- **Cache inteligente:**

  - Si la API responde correctamente, se actualiza la cache.
  - Si la API falla, se usa la última cache válida (si existe).
  - Si no hay cache ni respuesta válida, el panel muestra "No disponible".

- **Sistema de cola global:**

  - **Procesamiento priorizado**: Las actualizaciones se encolan por importancia (alta, normal, baja)
  - **Control de concurrencia**: Máximo 3 servidores procesando simultáneamente
  - **Eliminación de duplicados**: Evita actualizaciones redundantes del mismo tipo

- **Cumplimiento de rate limit:**

  - Nunca se hacen más de 2 requests/segundo a la API.
  - El endpoint secundario espera 1 segundo tras los críticos para evitar saturar la API.

- **Aviso de cache:**  
  Si se muestra información cacheada, verás en el footer del card el mensaje:  
  `⚠️ Datos en cache cargados hace X minutos`

> **Resumen de optimizaciones:**
>
> - Panel Apex actualizado cada 5 minutos (sin cambios).
> - Roles y presencia cada 2 minutos (antes 60 segundos - 67% menos frecuente).
> - Imágenes cada 10 minutos (antes 5 minutos - 50% menos frecuente).
> - Sistema de cola global evita conflictos y mejora rendimiento.
> - Endpoints críticos primero, secundarios después de 1 segundo.
> - Hasta 3 reintentos por endpoint, con 1.2s de espera.
> - Cache por canal y servidor, nunca sobrescrita con errores.
> - Cumplimiento estricto del rate limit de la API.
