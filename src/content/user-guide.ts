import { EmbedBuilder } from 'discord.js';
import type { ApexPlatform } from '../interfaces/apex-platform';
import type { ApexRank } from '../interfaces/apex-rank';

/** Datos del guild necesarios para generar la guía pública. */
export interface UserGuideContext {
  /** Rangos activos del servidor, con sus nombres reales. */
  ranks: readonly ApexRank[];
  /** Plataformas configuradas en el servidor. */
  platforms: readonly ApexPlatform[];
}

/**
 * Formatea una lista de etiquetas para mostrarla en un solo renglón.
 *
 * @param values - Etiquetas a unir.
 * @returns Texto separado por flechas o un aviso si la lista está vacía.
 */
function formatRankList(values: readonly string[]): string {
  return values.length > 0 ? values.join(' → ') : 'Sin rangos configurados';
}

/**
 * Formatea las plataformas disponibles.
 *
 * @param values - Etiquetas de plataformas.
 * @returns Texto separado por puntos o un aviso si no hay plataformas.
 */
function formatPlatformList(values: readonly string[]): string {
  return values.length > 0 ? values.join(' • ') : 'Sin plataformas configuradas';
}

/**
 * Construye la guía pública del bot.
 *
 * No incluye comandos de administración. Los textos se generan con los rangos
 * y plataformas reales del guild para no desincronizarse de su configuración.
 *
 * @param context - Rangos y plataformas del guild.
 * @returns Embeds de la guía pública.
 */
export function buildPublicHelpEmbeds(
  context: UserGuideContext
): EmbedBuilder[] {
  const ranks = context.ranks.map((rank) => rank.label);
  const platforms = context.platforms.map((platform) => platform.label);

  const start = new EmbedBuilder()
    .setColor('#f39c12')
    .setTitle('📖 Guía rápida de Apex Range')
    .setDescription(
      [
        '**1️⃣ Elegí tu rango**',
        '• Usá **Gestionar mi Rango** y seleccioná el rango con el que jugás.',
        '• El bot te asigna el rol y te muestra en el panel.',
        '• Podés cambiarlo cuando subas o bajes de rango. 🔄',
        '',
        `**🏆 Rangos disponibles:** ${formatRankList(ranks)}`,
        '',
        '**2️⃣ Elegí tu plataforma**',
        '• Usá **Gestionar mi Plataforma** para que tus datos se consulten en la plataforma correcta.',
        `**🎮 Plataformas:** ${formatPlatformList(platforms)}`,
        '',
        '**3️⃣ Aparecé en las listas**',
        '• Con rango y plataforma configurados, tu perfil se actualiza automáticamente. ✅',
        '• Si no aparecés, revisá que el bot tenga permisos para gestionar roles.',
      ].join('\n')
    );

  const actions = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('🎮 Qué podés hacer')
    .setDescription(
      [
        '**🏆 Gestionar mi Rango** — cambia el rango que te representa.',
        '**🎮 Gestionar mi Plataforma** — PC, PlayStation, Xbox o Switch.',
        '**🔎 Buscar Jugador** — encontrá a alguien por nombre.',
        '**👥 Ver todos los jugadores** — lista completa agrupada por rango.',
        '**🟢 Filtrar jugadores en línea** — mostrá solo a quienes están conectados.',
        '**📊 Ver perfil Apex Global** — consultá nivel, kills, rango y estado actual.',
        '',
        '💡 También podés tocar la mención de un jugador para abrir su perfil de Discord.',
      ].join('\n')
    );

  const reading = new EmbedBuilder()
    .setColor('#2ecc71')
    .setTitle('🧭 Cómo leer los paneles')
    .setDescription(
      [
        '**🏆 Panel de rangos**',
        '• Cada card corresponde a un rango.',
        '• 🟢 El icono antes del nombre muestra el estado de conexión.',
        '• 🎮 El icono de plataforma indica dónde juega.',
        '• 📅 La fecha es la última actualización de su rango.',
        '• ➡️ **Ver más** abre la lista completa de ese rango.',
        '',
        '**🗺️ Panel de mapas**',
        '• Muestra el mapa actual, el próximo y el tiempo restante. ⏱️',
        '• Incluye Battle Royale, Ranked y Mixtape.',
        '• El estado de los servidores se actualiza cada 5 minutos. 🔄',
        '• ⚠️ Si aparece **datos en cache**, la API no respondió y se muestra la última lectura disponible.',
      ].join('\n')
    );

  return [start, actions, reading];
}

/**
 * Construye la guía para staff.
 *
 * Solo debe mostrarse a miembros con permisos de administración.
 *
 * @returns Embed con comandos y tareas de configuración.
 */
export function buildStaffHelpEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#e74c3c')
    .setTitle('⚙️ Guía para staff')
    .setDescription(
      [
        '**🛠️ Configuración**',
        '• `/setup-roles` — crea o actualiza roles, panel de rangos y mensajes de estadísticas.',
        '• `/apex-status` — publica o reemplaza el panel de mapas en el canal actual.',
        '',
        '**🧹 Mantenimiento**',
        '• `/cleanup-state` — limpia referencias inválidas del panel.',
        '• `/cleanup-data` — limpieza de datos; solo para el owner configurado.',
        '',
        '🔒 Estos comandos no se muestran en la ayuda pública.',
      ].join('\n')
    );
}

/**
 * Construye la guía específica del panel de mapas.
 *
 * @returns Embed con la explicación del panel de estado de Apex.
 */
export function buildMapHelpEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#5865f2')
    .setTitle('🗺️ Guía del panel de mapas')
    .setDescription(
      [
        '**🗺️ Rotación de mapas**',
        '• **Battle Royale:** mapa actual y próximo del modo normal.',
        '• **Ranked:** rotación competitiva.',
        '• **Mixtape:** modos temporales y mapa actual.',
        '• ⏱️ El tiempo restante indica cuándo cambia la rotación.',
        '',
        '**🏆 Predator RP**',
        '• Muestra el RP mínimo para entrar en Predator según la plataforma.',
        '• El valor cambia durante la temporada.',
        '',
        '**🛰️ Estado de servidores**',
        '• 🟢 Verde: operativo.',
        '• 🟡 Amarillo: funcionando con demoras.',
        '• 🔴 Rojo: no disponible.',
        '• ⚪ Gris: sin datos recientes.',
        '',
        '**🔄 Actualización**',
        '• El panel se actualiza cada 5 minutos.',
        '• ⚠️ Si la API falla, se conserva la última información y se indica que está en cache.',
        '',
        '**🎯 Acciones disponibles**',
        '• Consultar el estado antes de jugar.',
        '• Abrir tu perfil Apex Global desde el botón del panel.',
      ].join('\n')
    );
}
