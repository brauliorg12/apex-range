import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { createCloseButtonRow } from '../utils/button-helper';

/**
 * Maneja la interacción del botón "Ayuda General" en Discord.
 *
 * - Muestra múltiples embeds con información sobre configuración, comandos y funcionalidades del bot.
 * - Incluye guía de setup-roles, comandos disponibles, botones y resolución de problemas.
 * - El mensaje es efímero y solo visible para el usuario que solicitó la ayuda.
 * - Registra en consola quién solicitó el menú de ayuda.
 *
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function handleHelpMenu(interaction: ButtonInteraction) {
  console.log(
    `[Interacción] ${interaction.user.tag} ha solicitado el menú de ayuda general.`
  );

  await interaction.deferReply({ ephemeral: true });

  // Embed principal - Para Jugadores
  const embed1 = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('📖 Ayuda General - Apex Range Bot')
    .setDescription(
      [
        '**🎮 CÓMO USAR EL BOT (Para Jugadores)**',
        '',
        '**1️⃣ Seleccionar tu Rango**',
        '• Haz clic en "Gestionar mi Rango" para elegir tu rango actual de Apex Legends',
        '• Selecciona el botón correspondiente a tu rango (Bronce, Plata, Oro, etc.)',
        '• **¡Es obligatorio seleccionar tu rango para aparecer en los listados!**',
        '• El bot te asignará el rol correspondiente automáticamente',
        '• Tu rango aparecerá en la lista de jugadores registrados con emoji y color distintivo',
        '• **Cambiar rango**: Puedes actualizar tu rango en cualquier momento usando el mismo botón',
        '',
        '**2️⃣ Ver otros Jugadores**',
        '• **"Ver todos los jugadores"** — Lista completa ordenada por rango con fechas de registro',
        '• **"Filtrar jugadores en línea"** — Muestra solo jugadores conectados en este momento',
        '• Los rangos se muestran con emojis personalizados y colores distintivos',
        '• **Paginación automática**: Navega entre páginas si hay muchos jugadores (botones ⬅️ ➡️)',
        '• Información detallada: Nivel, fecha de registro y estado online',
        '• **Búsqueda visual**: Encuentra fácilmente jugadores por su rango y actividad',
        '',
        '**3️⃣ Funcionalidades Disponibles**',
        '• **Ver perfil Apex Global**: Consulta tu perfil completo de Apex Legends (modal interactivo)',
        '  ▫️ Estadísticas globales: Nivel, kills, rango actual',
        '  ▫️ Rango Arenas: Posición y división en modo Arenas',
        '  ▫️ Estado actual: Si estás en partida o no',
        '• **Ranking por Rangos**: Ve la distribución completa de jugadores por nivel',
        '• **Estadísticas Actualizadas**: Conteo automático cada 2 minutos',
        '• **Búsqueda por Estado**: Filtra entre todos los registrados o solo conectados',
        '• **Panel Persistente**: Información siempre visible y actualizada automáticamente',
        '• **Ayuda General**: Este menú de ayuda completo',
      ].join('\n')
    );

  // Embed secundario - Comando Apex Status
  const embed2 = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('🎯 Comando `/apex-status` - Estado del Juego')
    .setDescription(
      [
        '**Panel en tiempo real completo** con información actualizada de Apex Legends',
        '',
        '**Funcionalidades principales:**',
        '• **Rotación de mapas**: Muestra los mapas actuales de Battle Royale, Ranked y LTM',
        '• **RP Predator**: Información específica del RP necesario para alcanzar Predator en PC, PS4 y Xbox',
        '• **Estado de servidores**: Visualización clara del estado de servidores por región',
        '• **Actualización automática**: Se refresca cada 5 minutos para mantener la información al día',
        '',
        '**Botones interactivos:**',
        '▫️ **"Ver perfil Apex Global"**: Consulta tu perfil completo de estadísticas',
        '▫️ **"¿Qué significan los colores?"**: Explicación detallada de los estados de servidor',
        '',
        '**Características técnicas:**',
        '• **Mensaje fijado**: Se mantiene visible en el canal para acceso rápido',
        '• **Cache inteligente**: Si la API falla, muestra la última información válida',
        '• **Fuente de datos**: API oficial de Mozambique (apexlegendsapi.com)',
        '• **Multi-canal**: Puede configurarse en diferentes canales del servidor',
        '',
        '**🛰️ Estados de Servidor - Significado de los Colores**',
        '• **🟢 Verde (UP)**: Servidor operativo y funcionando correctamente',
        '• **🟡 Amarillo (SLOW)**: Servidor con lentitud o intermitencias temporales',
        '• **🔴 Rojo (DOWN)**: Servidor caído y no disponible',
        '• **⚪ Blanco (Desconocido)**: No se pudo determinar el estado del servidor',
      ].join('\n')
    );

  // Embed tercero - Para Administradores
  const embed3 = new EmbedBuilder()
    .setColor('#e74c3c')
    .setTitle('⚙️ PARA ADMINISTRADORES (Configuración)')
    .setDescription(
      [
        '**Configuración Completa del Bot**',
        '',
        '**`/setup-roles`** — Comando maestro que configura TODO automáticamente:',
        '▫️ Crea roles de Apex Legends faltantes (Bronce, Plata, Oro, etc.)',
        '▫️ Genera panel interactivo con botones de selección de rango',
        '▫️ Configura mensajes de estadísticas que se actualizan solos',
        '▫️ Integra botón "Ver perfil Apex Global" para consultas',
        '▫️ Crea panel persistente que se mantiene actualizado',
        '▫️ Detecta automáticamente permisos y roles faltantes',
        '▫️ Fija mensajes automáticamente para mantenerlos visibles',
        '',
        '**Comandos Disponibles:**',
        '• **`/apex-status`** — Panel en tiempo real de mapas y RP Predator',
        '• **`/total-jugadores`** — Estadísticas completas del servidor',
        '• **`/api-status`** — Estado de conexión con APIs externas',
        '• **`/cleanup-data`** — Limpieza de archivos JSON obsoletos (solo owner)',
        '',
        '**Funcionalidades Avanzadas:**',
        '• **Detección Inteligente**: Identifica roles faltantes automáticamente',
        '• **Creación Automática**: Crea roles con colores y permisos correctos',
        '• **Estadísticas en Tiempo Real**: Conteos que se actualizan solos',
        '• **Multi-Servidor**: Funciona independientemente en cada servidor',
        '• **Recuperación Automática**: Restaura configuración si el bot vuelve',
        '• **Sistema de Cola Global**: Evita sobrecargas y conflictos',
      ].join('\n')
    );

  // Embed cuarto - Solución de Problemas
  const embed4 = new EmbedBuilder()
    .setColor('#2ecc71')
    .setTitle('❓ Solución de Problemas')
    .setDescription(
      [
        '**Problemas Comunes y Soluciones:**',
        '',
        '• **Setup incompleto**: Re-ejecuta `/setup-roles` para completar configuración',
        '• **Roles no creados**: Verifica permisos "Gestionar Roles" del bot',
        '• **Panel no aparece**: El bot crea mensajes fijados automáticamente',
        '• **Estadísticas no actualizan**: Sistema automático cada 2 minutos',
        '• **Permisos faltantes**: Mensajes detallados guían la configuración',
        '• **Bot no responde**: Verifica permisos de canal y rol del bot',
        '• **APIs caídas**: El bot usa cache automático y notifica problemas',
        '',
        '**Información Técnica:**',
        '• **Actualización automática**: Cada 2 minutos para roles y presencia',
        '• **Cache inteligente**: Mantiene datos cuando APIs fallan',
        '• **Rate Limiting Inteligente**: Respeta límites de Discord y APIs',
        '• **Datos locales**: Toda información se guarda en archivos del servidor',
        '• **Mensajes efímeros**: Información sensible solo visible para ti',
        '',
        '**💡 Consejos Importantes:**',
        '• **Setup-Roles es el comando principal**: Configura todo automáticamente',
        '• **Actualizaciones automáticas**: El bot mantiene todo actualizado sin intervención',
        '• **Experiencia premium**: Diseñado para comunidades grandes con máxima confiabilidad',
      ].join('\n')
    );

  await interaction.editReply({
    embeds: [embed1, embed2, embed3, embed4],
    components: [createCloseButtonRow()],
  });
}

/**
 * Maneja la interacción del botón "Cerrar" en el menú de ayuda general.
 *
 * - Confirma la interacción con deferUpdate para evitar timeouts.
 * - Elimina el mensaje efímero del menú de ayuda general.
 * - Registra en consola quién cerró el menú para seguimiento.
 *
 * @param interaction Interacción del botón "Cerrar" recibida desde Discord.
 */
export async function handleCloseHelpMenu(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  await interaction.deleteReply();

  console.log(
    `[Interacción] ${interaction.user.tag} ha cerrado el menú de ayuda general.`
  );
}
