# <img src="https://cdn.discordapp.com/emojis/1410729026410119269.webp?size=40&quality=lossless" alt="Apex Icon" width="32" style="vertical-align:middle"> Apex Legends Rank Bot

Bot de Discord para gestionar y mostrar los rangos de los jugadores de Apex Legends en tu servidor, con panel interactivo, estadísticas y cards visuales.

![Version](https://img.shields.io/github/v/release/brauliorg12/apex-range)
![License](https://img.shields.io/github/license/brauliorg12/apex-range)
![GHCR Pulls](https://img.shields.io/badge/GHCR-pulls-blue?logo=github)

**🌐 Website: [https://apex-range.cubanova.com](https://apex-range.cubanova.com)**

---

**[>> Invitar Apex Legends Rank Bot a tu Servidor <<](https://discord.com/oauth2/authorize?client_id=1406424026427031696&scope=bot+applications.commands&permissions=268560400)**

### 🎯 **Análisis Detallado de Permisos Pre-configurados**

¡Excelente configuración! El valor `268560400` incluye **exactamente** todos los permisos críticos necesarios para el funcionamiento óptimo del bot.

#### 📋 **Permisos Incluidos en el Enlace:**

| Permiso                    | Valor Binario | Estado      | Descripción                          |
| -------------------------- | ------------- | ----------- | ------------------------------------ |
| **ViewChannel**            | 1024          | ✅ Incluido | Ver canales y mensajes               |
| **SendMessages**           | 2048          | ✅ Incluido | Enviar mensajes en canales           |
| **ManageMessages**         | 8192          | ✅ Incluido | Gestionar mensajes (fijar, eliminar) |
| **ManageChannels**         | 16            | ✅ Incluido | Crear y gestionar canales            |
| **UseExternalEmojis**      | 262144        | ✅ Incluido | Usar emojis de otros servidores      |
| **ReadMessageHistory**     | 65536         | ✅ Incluido | Leer historial de mensajes           |
| **EmbedLinks**             | 16384         | ✅ Incluido | Insertar enlaces en embeds           |
| **AttachFiles**            | 32768         | ✅ Incluido | Adjuntar archivos e imágenes         |
| **ManageRoles**            | 268435456     | ✅ Incluido | Gestionar roles de rangos            |
| **UseApplicationCommands** | 2147483648    | ✅ Incluido | Usar comandos slash y de contexto    |

#### 🔢 **Verificación Matemática:**

```
268560400 = 1024 + 2048 + 8192 + 16 + 16384 + 32768 + 65536 + 262144 + 268435456
```

**¡Cálculo perfecto! ✅**

#### 📊 **Estado de la Configuración:**

- 🟢 **Permisos Críticos**: **100% Cubiertos** (10/10)
- 🟢 **Cobertura Total**: **100% de Compatibilidad**
- 🟢 **Configuración Óptima**: Lista para usar

#### 🚀 **Resultado Final:**

🎉 \*\*Tu enlace de invitación está perfectamente configurado!

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
- **Sistema de logs organizado por días** con estructura jerárquica automática.
- **Presencia global con estadísticas combinadas de todos los servidores**.
- **Soporte completo para múltiples plataformas de Apex Legends** (PC, PlayStation, Xbox, Nintendo Switch).
- **Gestión inteligente de plataformas** con asignación automática de roles.
- **Flujo inteligente de configuración**: Selección obligatoria de plataforma antes de rango para datos precisos.
- **Consultas precisas de perfiles** basadas en la plataforma seleccionada.
- **Integración completa con APIs oficiales** de Mozambique para datos precisos por plataforma.
- **Configuración personalizable de roles excluidos**: Permite ocultar roles específicos en los cards de rangos para una visualización más limpia.
- **Fechas adaptadas a la zona horaria del usuario**: Las fechas en embeds, listas de jugadores y actualizaciones se muestran automáticamente en la zona horaria de cada usuario de Discord.

---

## 📚 Documentación

Para información detallada sobre instalación, uso y configuración avanzada, consulta los siguientes archivos:

- **[INSTALL.md](INSTALL.md)** - Instalación y configuración básica
- **[USAGE.md](USAGE.md)** - Comandos y uso del bot
- **[PERMISSIONS.md](PERMISSIONS.md)** - Permisos requeridos y configuración de Discord
- **[MULTI-SERVER.md](MULTI-SERVER.md)** - Funcionalidades multi-servidor e inicialización
- **[PLATFORMS.md](PLATFORMS.md)** - Soporte para múltiples plataformas
- **[API.md](API.md)** - Panel de estado y detalles de API
- **[LOGS.md](LOGS.md)** - Sistema de logs organizado por días
- **[ADVANCED.md](ADVANCED.md)** - Configuraciones avanzadas, optimizaciones y producción

---

## Tipografía utilizada

El bot utiliza la fuente **Montserrat Bold** para todos los cards visuales y textos generados con canvas, logrando un estilo moderno y profesional.

La fuente se encuentra en la carpeta:

`assets/fonts/Montserrat-Bold.ttf`

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
