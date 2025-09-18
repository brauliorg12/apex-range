import { PermissionsBitField } from 'discord.js';

/**
 * Lista completa de permisos necesarios para el funcionamiento del bot Apex Range
 * Cada permiso incluye su descripción, alcance y detalles de uso
 */
export const REQUIRED_PERMISSIONS = [
  {
    name: 'ViewChannel',
    flag: PermissionsBitField.Flags.ViewChannel,
    description: 'Ver Canal',
    scope: 'channel',
    details: `Permite al bot ver el canal donde se ejecutan comandos y se envían mensajes. Esencial para todas las operaciones del bot.
    
    **Dónde se usa:** Todos los comandos y handlers de interacciones
    **Crítico:** Sí - Sin este permiso el bot no puede funcionar en el canal`,
  },
  {
    name: 'SendMessages',
    flag: PermissionsBitField.Flags.SendMessages,
    description: 'Enviar Mensajes',
    scope: 'channel',
    details: `Necesario para enviar mensajes de selección de roles, estadísticas, respuestas a comandos y actualizaciones automáticas.
    
    **Dónde se usa:** setup-roles.ts, apex-status.ts, handlers de botones y modales
    **Crítico:** Sí - El bot no puede comunicarse sin este permiso`,
  },
  {
    name: 'ManageMessages',
    flag: PermissionsBitField.Flags.ManageMessages,
    description: 'Gestionar Mensajes',
    scope: 'channel',
    details: `Usado para fijar mensajes importantes y limpiar mensajes antiguos durante la configuración.
    
    **Dónde se usa:** setup-roles.ts (pin messages), cleanupExistingMessages, send-online-panel.ts
    **Crítico:** Moderadamente - El bot funciona sin él pero no puede fijar mensajes importantes`,
  },
  {
    name: 'ManageRoles',
    flag: PermissionsBitField.Flags.ManageRoles,
    description: 'Gestionar Roles',
    scope: 'guild',
    details: `Crítico para crear roles de rangos de Apex Legends automáticamente cuando no existen, y asignarlos a usuarios.
    
    **Dónde se usa:** setup-roles-handlers.ts, handleMissingRoles, setup-config-handler.ts
    **Crítico:** Sí - El setup falla completamente sin este permiso`,
  },
  {
    name: 'UseExternalEmojis',
    flag: PermissionsBitField.Flags.UseExternalEmojis,
    description: 'Usar Emojis Externos',
    scope: 'channel',
    details: `Permite usar emojis personalizados de Discord en botones y embeds para una mejor experiencia visual.
    
    **Dónde se usa:** button-helper.ts, embeds con emojis en handlers
    **Crítico:** No - Los emojis se muestran como texto alternativo`,
  },
  {
    name: 'ReadMessageHistory',
    flag: PermissionsBitField.Flags.ReadMessageHistory,
    description: 'Leer Historial de Mensajes',
    scope: 'channel',
    details: `Necesario para verificar el estado del canal, limpiar mensajes existentes y procesar interacciones históricas.
    
    **Dónde se usa:** cleanupExistingMessages, verificación de canal en setup-roles.ts
    **Crítico:** Moderadamente - Afecta la limpieza automática de mensajes`,
  },
  {
    name: 'EmbedLinks',
    flag: PermissionsBitField.Flags.EmbedLinks,
    description: 'Insertar Enlaces',
    scope: 'channel',
    details: `Permite enviar embeds con enlaces a imágenes, perfiles de Apex y otros recursos externos.
    
    **Dónde se usa:** Todos los embeds enviados por el bot (rank cards, stats, etc.)
    **Crítico:** Sí - Los embeds no se muestran correctamente sin este permiso`,
  },
  {
    name: 'AttachFiles',
    flag: PermissionsBitField.Flags.AttachFiles,
    description: 'Adjuntar Archivos',
    scope: 'channel',
    details: `Esencial para adjuntar imágenes generadas como tarjetas de rango, gráficos de estadísticas y avatares.
    
    **Dónde se usa:** rank-card-canvas.ts, recent-avatars-canvas.ts, predator-badge-canvas.ts
    **Crítico:** Sí - Las imágenes no se pueden mostrar sin este permiso`,
  },
];
