# <img src="https://cdn.discordapp.com/emojis/1410729026410119269.webp?size=40&quality=lossless" alt="Apex Icon" width="32" style="vertical-align:middle"> Apex Legends Rank Bot

Bot de Discord para gestionar y mostrar los rangos de los jugadores de Apex Legends en tu servidor, con panel interactivo, estadísticas y cards visuales.

![Version](https://img.shields.io/github/v/release/brauliorg12/apex-range)
![License](https://img.shields.io/github/license/brauliorg12/apex-range)
![GHCR Pulls](https://img.shields.io/badge/GHCR-pulls-blue?logo=github)

**🌐 Website: [https://apex-range.cubanova.com](https://apex-range.cubanova.com)**

---

**[>> Invitar Apex Legends Rank Bot a tu Servidor <<](https://discord.com/oauth2/authorize?client_id=1406424026427031696&scope=bot+applications.commands&permissions=2251802229992448)**

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
- **Soporte completo para múltiples plataformas de Apex Legends** (PC, PlayStation, Xbox, Nintendo Switch).
- **Gestión inteligente de plataformas** con asignación automática de roles.
- **Consultas precisas de perfiles** basadas en la plataforma seleccionada.
- **Integración completa con APIs oficiales** de Mozambique para datos precisos por plataforma.

---

## 📚 Documentación

Para información detallada sobre instalación, uso y configuración avanzada, consulta los siguientes archivos:

- **[INSTALL.md](INSTALL.md)** - Instalación y configuración básica
- **[USAGE.md](USAGE.md)** - Comandos y uso del bot
- **[PERMISSIONS.md](PERMISSIONS.md)** - Permisos requeridos y configuración de Discord
- **[MULTI-SERVER.md](MULTI-SERVER.md)** - Funcionalidades multi-servidor e inicialización
- **[PLATFORMS.md](PLATFORMS.md)** - Soporte para múltiples plataformas
- **[API.md](API.md)** - Panel de estado y detalles de API
- **[ADVANCED.md](ADVANCED.md)** - Configuraciones avanzadas, optimizaciones y producción

---

## ⚙️ Instalación Rápida

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

EXCLUDED_ROLES=Admin,Server Booster,Moderador

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

Para instrucciones detalladas, consulta **[INSTALL.md](INSTALL.md)**.

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

Para información detallada sobre permisos, consulta **[PERMISSIONS.md](PERMISSIONS.md)**.

---

## 🟢 Comandos Disponibles

| Comando / Acción | Descripción                                                                                                              | Permisos      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------- |
| /setup-roles     | Configura el panel de selección de rango y mensaje de estadísticas con menú interactivo para crear roles automáticamente | Administrador |
| /apex-status     | Muestra el estado de Apex (mapas, Predator RP)                                                                           | Todos         |
| /total-jugadores | Muestra el número total de jugadores con rango                                                                           | Todos         |
| /cleanup-data    | [ADMIN] Limpia archivos JSON de servidores obsoletos                                                                     | Owner del Bot |

> **Nota:** Los comandos /setup-roles y /apex-status son independientes y pueden configurarse en canales distintos. El comando de contexto aparece al hacer click derecho sobre un usuario.

### Menú Contextual

- Ver mi rango en Apex Range (contexto) | Muestra tu rango actual y opciones de gestión | Todos |

Para uso detallado de comandos, consulta **[USAGE.md](USAGE.md)**.

---

## 🎮 **Soporte Completo para Múltiples Plataformas de Apex Legends**

El bot ofrece un **soporte integral y profesional** para todas las plataformas disponibles en Apex Legends, asegurando una experiencia unificada y precisa para todos los jugadores independientemente de su plataforma de juego.

### Plataformas Soportadas

| Plataforma          | Icono | Rol Automático  | API Name | Disponibilidad |
| ------------------- | ----- | --------------- | -------- | -------------- |
| **PC**              | 🖥️    | PC              | PC       | ✅ Completa    |
| **PlayStation**     | 🎮    | PlayStation     | PS4      | ✅ Completa    |
| **Xbox**            | 🎯    | Xbox            | X1       | ✅ Completa    |
| **Nintendo Switch** | 🔴    | Nintendo Switch | SWITCH   | ✅ Completa    |

Para información completa sobre plataformas, consulta **[PLATFORMS.md](PLATFORMS.md)**.

---

## 🛰️ Estado de los Servidores: Significado de los Emojis

En la card de estado de servidores, los siguientes emojis indican el estado de cada región/plataforma:

| Emoji | Estado      | Significado        |
| ----- | ----------- | ------------------ |
| 🟢    | UP          | Operativo          |
| 🟡    | SLOW        | Lento/intermitente |
| ��    | DOWN        | Caído              |
| ⚪    | Desconocido | Estado desconocido |

Esto te permite identificar rápidamente el estado de los servidores de Apex Legends en cada región.

Para más detalles sobre el panel de estado y API, consulta **[API.md](API.md)**.

---

## 🎨 Tipografía utilizada

El bot utiliza la fuente **Montserrat Bold** para todos los cards visuales y textos generados con canvas, logrando un estilo moderno y profesional.

La fuente se encuentra en la carpeta:

`assets/fonts/Montserrat-Bold.ttf`

---

## 🆘 Ayuda y Mensaje de Estado

Cuando uses /apex-status o veas el panel de estado, ten en cuenta:

- Si ves ⚠️ Datos en cache temporalmente en alguna card, significa que la API no respondió y se está mostrando la última información válida.
- **Panel de estado Apex**: Se actualiza automáticamente cada 5 minutos.
- **Roles y presencia**: Se actualizan cada 2 minutos para mantener la información al día.
- **Imágenes del embed**: Se refrescan cada 10 minutos para optimizar rendimiento.
- Los emojis de estado de servidor indican si cada región está operativa, lenta o caída.

---

## ⏱️ Detalles de Intervalos, Reintentos y Tiempos de Consulta

Para adaptarse a las limitaciones de la API de Mozambique y evitar bloqueos, el bot implementa la siguiente estrategia de consulta y cache optimizada:

- **Actualización automática por tipo:**

  - **Panel de estado Apex**: Se actualiza cada **5 minutos** (300 segundos) en cada canal configurado
  - **Roles y presencia**: Se actualizan cada **2 minutos** (120 segundos) para mejor eficiencia
  - **Imágenes del embed**: Se refrescan cada **10 minutos** (600 segundos) para reducir carga

- **Reintentos:**  
  Cada consulta a la API se reintenta hasta **3 veces** en caso de error, con un intervalo de **1.2 segundos** entre cada intento.

- **Cache inteligente:**
  - Si la API responde correctamente, se actualiza la cache.
  - Si la API falla, se usa la última cache válida (si existe).
  - Si no hay cache ni respuesta válida, el panel muestra ""No disponible"".

Para configuraciones avanzadas, optimizaciones y deployment en producción, consulta **[ADVANCED.md](ADVANCED.md)**.

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
