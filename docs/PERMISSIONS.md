# Permisos Requeridos

Esta guía explica en detalle todos los permisos que necesita Apex Legends Rank Bot para funcionar correctamente.

## �️ Configuración Básica de Discord

### Roles requeridos

Crea estos roles en tu servidor (nombres exactos):

- Hierro o Rookie
- Bronce
- Plata
- Oro
- Platino
- Esmeralda (solo con `ENABLE_NEW_RANKS=true`)
- Diamante
- Maestro
- Gran maestro (solo con `ENABLE_NEW_RANKS=true`)
- Apex Predator

> Si el bot no tiene **Gestionar roles**, podés crear estos roles manualmente.
> Usá el nombre exacto o un alias reconocido, ubicalos debajo del rol más alto
> del bot y en orden de `tier` (Predator arriba, Hierro/Rookie abajo). El
> permiso sigue siendo necesario para que el autoservicio asigne o cambie
> rangos. El sync solo reordena los roles cuando crea al menos uno.
>
> En esta versión `ENABLE_NEW_RANKS` está fijo en `false`: el bot no crea ni
> muestra Esmeralda/Gran maestro y usa Rookie como nombre legible de `rookie`.

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
- Gestionar canales
- Enviar mensajes
- Leer historial de mensajes
- Usar emojis externos
- Gestionar mensajes
- Ver canales
- Insertar enlaces
- Adjuntar archivos
- Usar comandos de aplicación

## �🔐 Permisos Requeridos Detallados

El bot requiere permisos específicos tanto a nivel de servidor como de canal. A continuación, una explicación detallada de cada permiso, dónde se utiliza y por qué es necesario:

### **Permisos a Nivel de Servidor (Guild):**

#### **`ManageRoles`** - Gestionar Roles

- **Descripción**: Permite al bot crear, asignar y reordenar roles de rangos de Apex Legends
- **Dónde se usa**: `setup-roles-creation.ts`, `configs/handlers/create-missing-roles.ts`, `configs/handlers/proceed-create-roles.ts` y `services/rank-sync/rank-roles.ts`
- **Crítico**: Sí para la creación automática y para el autoservicio. Sin este permiso el bot muestra instrucciones para crear los roles a mano, pero no puede asignar ni cambiar rangos.
- **Por qué**: El bot crea automáticamente roles como "Bronce", "Plata", etc. cuando no existen
- **Orden**: El sync crea los roles debajo del rol más alto del bot y los ordena por `tier` cuando crea al menos uno. Los cards usan `tier`, no la posición de Discord.

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
- **Dónde se usa**: `pinSetupMessages`, `cleanup-existing-messages.ts` y
  `services/rank-sync/rank-panel-deletion.ts` (borrado de mensajes viejos).
- **Crítico**: Moderadamente - El bot funciona sin él pero no puede fijar mensajes importantes
- **Por qué**: Fija el panel de roles y estadísticas para mantenerlos visibles

#### **`UseExternalEmojis`** - Usar Emojis Externos

- **Descripción**: Permite usar emojis personalizados de Discord en botones y embeds
- **Dónde se usa**: `button-helper.ts`, embeds con emojis en handlers
- **Crítico**: No - Los emojis se muestran como texto alternativo
- **Por qué**: Mejora la apariencia visual de botones y embeds

#### **`ReadMessageHistory`** - Leer Historial de Mensajes

- **Descripción**: Permite verificar el estado del canal y limpiar mensajes existentes
- **Dónde se usa**: `cleanup-existing-messages.ts`, verificación de canal en `setup-roles.ts` y `/cleanup-state`
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
  **Crítico:** Sí para la creación automática; sin el permiso se muestran instrucciones manuales.

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

### **Notificaciones Automáticas de Errores**

El bot incluye un sistema de **notificaciones automáticas de errores** para
informar problemas críticos sin publicar tarjetas de error en canales públicos.

#### Funcionalidades del Sistema

- **Canal de control primero**: Si el servidor tiene un canal de control
  configurado (`botControl.controlChannelId`), las notificaciones se envían
  allí. Ese canal está restringido a administradores y al bot.
- **DM al owner como alternativa**: Si no hay canal de control o el envío falla,
  se intenta por mensaje privado al owner del servidor.
- **Sin canal público**: Si el canal de control y el DM fallan, solo queda el
  registro en los logs. No se envían errores al canal del panel ni a otros
  canales públicos.
- **Tipos de errores notificados**:
  - **Falta de permisos**: El bot no puede editar o crear mensajes.
  - **Mensaje o panel no encontrado**: El panel de Apex fue eliminado.
  - **Panel recreado**: El bot creó un reemplazo y registró el nuevo ID.
  - **Recuperación suspendida**: Se agotaron los intentos automáticos.
  - **Canal no encontrado**: El canal configurado ya no existe o no es
    accesible.
  - **Errores desconocidos**: Otros problemas durante la actualización.
- **Información detallada**: Cada notificación incluye descripción, canal,
  servidor e instrucciones de recuperación.
- **Frecuencia controlada**: Los errores transitorios tienen un cooldown de
  **1 hora** por tipo para limitar la frecuencia de avisos.

El rank sync usa su propia deduplicación de 30 minutos por guild y no comparte
este cooldown. Ver [RANK-SYNC.md](RANK-SYNC.md#4-notificación).

La corrupción o ilegibilidad de `.bot-state` detectada en el arranque, la
reincorporación, un evento de rol o el rank sync es una alerta de
infraestructura: va al administrador de la app (log crítico y, si está
configurado, `ADMIN_ALERT_WEBHOOK_URL`), nunca al owner ni al canal de control
del guild. Un fallo de escritura de `.bot-state` se registra y se propaga, pero
no genera esa alerta en esta versión. Ver
[RANK-SYNC.md](RANK-SYNC.md#4-notificación).

### **Permisos del comando `/apex-status`**

El comando exige **Gestionar canales** en el canal o **Gestionar servidor** a
nivel del servidor. La visibilidad y el uso pueden restringirse además en
**Discord → Integraciones → Apex Range → /apex-status**. Se recomienda
habilitarlo solo para el rol de staff y el canal del panel.

Cada ejecución exitosa intenta notificar al canal de control o, si no existe,
por DM al owner. La notificación incluye usuario, canal nuevo, canal anterior,
IDs de los mensajes y si el estado se persistió. Si ambos canales fallan, queda
el registro en logs.
