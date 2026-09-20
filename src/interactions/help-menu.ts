import { MessageFlags, ButtonInteraction, EmbedBuilder } from 'discord.js';
import { createCloseButtonRow } from '../utils/button-helper';
import { logApp } from '../utils/logger';

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
  await logApp(
    `[Interacción] ${interaction.user.tag} ha solicitado el menú de ayuda general.`
  );

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Embed principal - Rangos y Plataformas
  const embed1 = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('📖 Ayuda General - Apex Range Bot')
    .setDescription(
      [
        '**🎮 CÓMO USAR EL BOT (Para Jugadores)**',
        '',
        '**1️⃣ Seleccionar tu Rango**',
        '• Haz clic en "Gestionar mi Rango" para elegir tu rango actual',
        '• Selecciona el botón correspondiente a tu rango (Bronce, Plata, Oro, etc.)',
        '• El bot te asignará el rol correspondiente automáticamente',
        '• Tu rango aparecerá en la lista de jugadores registrados',
        '• **Cambiar rango**: Puedes actualizar tu rango en cualquier momento',
        '',
        '**2️⃣ Seleccionar tu Plataforma**',
        '• El bot soporta múltiples plataformas: PC, PlayStation, Xbox y Switch',
        '• Haz clic en "Gestionar mi Plataforma" para elegir tu plataforma',
        '• Selecciona el botón correspondiente a tu plataforma',
        '• El bot te asignará el rol de plataforma correspondiente',
        '• Tu plataforma se usa para consultas de estadísticas y perfiles',
        '• **Cambiar plataforma**: Puedes actualizar tu plataforma en cualquier momento',
      ].join('\n')
    );

  // Embed secundario - Funcionalidades para Jugadores
  const embed2 = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('🎮 Funcionalidades Disponibles')
    .setDescription(
      [
        '**3️⃣ Ver otros Jugadores**',
        '• **"Ver todos los jugadores"** — Lista completa ordenada por rango',
        '• **"Filtrar jugadores en línea"** — Muestra solo jugadores conectados',
        '• Los rangos se muestran con emojis personalizados y colores',
        '• **Paginación automática**: Navega entre páginas si hay muchos jugadores',
        '• Información detallada: Nivel, fecha de registro y estado online',
        '',
        '**4️⃣ Funcionalidades Disponibles**',
        '• **Ver perfil Apex Global**: Consulta tu perfil completo',
        '  ▫️ Estadísticas globales: Nivel, kills, rango actual',
        '  ▫️ Rango Arenas: Posición y división',
        '  ▫️ Estado actual: Si estás en partida o no',
        '• **Ranking por Rangos**: Ve la distribución completa de jugadores',
        '• **Estadísticas Actualizadas**: Conteo automático cada 2 minutos',
        '• **Panel Persistente**: Información siempre visible y actualizada',
      ].join('\n')
    );

  // Embed tercero - Comando Apex Status
  const embed3 = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('🎯 Comando `/apex-status`')
    .setDescription(
      [
        '**Panel en tiempo real completo** con información actualizada',
        '',
        '**Funcionalidades principales:**',
        '• **Rotación de mapas**: Muestra los mapas actuales',
        '• **RP Predator**: Información específica del RP necesario',
        '• **Estado de servidores**: Visualización clara del estado',
        '• **Actualización automática**: Se refresca cada 5 minutos',
        '',
        '**Botones interactivos:**',
        '▫️ **"Ver perfil Apex Global"**: Consulta tu perfil completo',
        '▫️ **"¿Qué significan los colores?"**: Explicación detallada',
        '',
        '**Características técnicas:**',
        '• **Mensaje fijado**: Se mantiene visible en el canal',
        '• **Cache inteligente**: Si la API falla, muestra la última información',
        '• **Fuente de datos**: API oficial de Mozambique',
        '',
        '**🛰️ Estados de Servidor:**',
        '• **🟢 Verde (UP)**: Servidor operativo',
        '• **🟡 Amarillo (SLOW)**: Servidor con lentitud',
        '• **🔴 Rojo (DOWN)**: Servidor caído',
        '• **⚪ Blanco (Desconocido)**: Estado desconocido',
      ].join('\n')
    );

  // Embed cuarto - Para Administradores
  const embed4 = new EmbedBuilder()
    .setColor('#e74c3c')
    .setTitle('⚙️ PARA ADMINISTRADORES')
    .setDescription(
      [
        '**Configuración Completa del Bot**',
        '',
        '**`/setup-roles`** — Comando maestro que configura TODO:',
        '▫️ Crea roles de Apex Legends faltantes',
        '▫️ Genera panel interactivo con botones',
        '▫️ Configura mensajes de estadísticas',
        '▫️ Integra botón "Ver perfil Apex Global"',
        '▫️ Crea panel persistente',
        '▫️ Detecta automáticamente permisos y roles',
        '',
        '**Comandos Disponibles:**',
        '• **`/apex-status`** — Panel en tiempo real',
        '• **`/total-jugadores`** — Estadísticas del servidor',
        '• **`/api-status`** — Estado de conexión con APIs',
        '• **`/cleanup-data`** — Limpieza de archivos (solo owner)',
        '',
        '**Funcionalidades Avanzadas:**',
        '• **Detección Inteligente**: Identifica roles faltantes',
        '• **Creación Automática**: Crea roles con colores correctos',
        '• **Estadísticas en Tiempo Real**: Conteos automáticos',
        '• **Multi-Servidor**: Funciona en múltiples servidores',
        '• **Recuperación Automática**: Restaura configuración',
      ].join('\n')
    );

  // Embed quinto - Solución de Problemas
  const embed5 = new EmbedBuilder()
    .setColor('#2ecc71')
    .setTitle('❓ Solución de Problemas')
    .setDescription(
      [
        '**Problemas Comunes y Soluciones:**',
        '',
        '• **Setup incompleto**: Re-ejecuta `/setup-roles`',
        '• **Roles no creados**: Verifica permisos "Gestionar Roles"',
        '• **Panel no aparece**: El bot crea mensajes fijados',
        '• **Estadísticas no actualizan**: Sistema automático cada 2 minutos',
        '• **Permisos faltantes**: Mensajes detallados guían la configuración',
        '• **Bot no responde**: Verifica permisos de canal y rol',
        '• **APIs caídas**: El bot usa cache automático',
        '',
        '**💡 Consejos Importantes:**',
        '• **Setup-Roles es el comando principal**',
        '• **Actualizaciones automáticas**',
        '• **Experiencia premium** para comunidades grandes',
      ].join('\n')
    );

  await interaction.editReply({
    embeds: [embed1, embed2, embed3, embed4, embed5],
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

  await logApp(
    `[Interacción] ${interaction.user.tag} ha cerrado el menú de ayuda general.`
  );
}
