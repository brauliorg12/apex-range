# Permisos Requeridos

Esta guía explica en detalle todos los permisos que necesita Apex Legends Rank Bot para funcionar correctamente.

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

### **Notificaciones Automáticas de Errores**

El bot incluye un sistema avanzado de **notificaciones automáticas de errores** que informa directamente al owner del servidor cuando ocurren problemas críticos:

#### Funcionalidades del Sistema

- **Notificación por DM**: Los errores se envían directamente al owner del servidor vía mensaje privado de Discord, evitando spamear canales públicos.
- **Tipos de errores notificados**:
  - **Falta de permisos**: Cuando el bot no puede editar mensajes por falta de permisos "Gestionar Mensajes".
  - **Mensaje no encontrado**: Cuando el mensaje de Apex ha sido eliminado y no se puede actualizar.
  - **Errores desconocidos**: Cualquier otro error inesperado durante la actualización.
- **Información detallada**: Cada notificación incluye:
  - Descripción clara del problema
  - Canal afectado
  - Servidor afectado
  - Instrucciones específicas para solucionarlo
- **Fallback inteligente**: Si no se puede enviar DM (ej. DMs bloqueados), intenta enviar al canal afectado como último recurso.
- **Sin spam**: Solo se notifica cuando realmente ocurre un error, no en operaciones normales.
