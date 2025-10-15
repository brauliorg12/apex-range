/**
 * Utilidades compartidas para formatear datos en las cards de Apex Legends.
 */

/**
 * Formatea el tiempo restante en horas, minutos y segundos.
 *
 * @param remaining - Cadena de tiempo en formato "HH:MM:SS" (opcional).
 * @returns Cadena formateada como "X hrs Y mins Z segs" o "N/A" si no hay datos.
 */
export function formatTimeLeft(remaining?: string): string {
  if (!remaining) return 'N/A';
  const [h, m, s] = remaining.split(':').map(Number);
  let parts = [];
  if (h > 0) parts.push(`${h} hrs`);
  if (m > 0) parts.push(`${m} mins`);
  if (s > 0) parts.push(`${s} segs`);
  return parts.length ? parts.join(' ') : 'N/A';
}

/**
 * Formatea la información del próximo mapa, incluyendo fecha y evento (opcional).
 *
 * @param map - Nombre del mapa (opcional).
 * @param dateStr - Cadena de fecha en formato legible (opcional).
 * @param eventName - Nombre del evento (opcional).
 * @returns Cadena formateada con el mapa, evento y fecha/hora, o "No disponible" si faltan datos.
 */
export function formatNextMap(
  map?: string,
  dateStr?: string,
  eventName?: string
): string {
  if (!map || !dateStr) return 'No disponible';
  const nextDate = new Date(dateStr.replace(' ', 'T') + 'Z');
  const timestamp = Math.floor(nextDate.getTime() / 1000);
  let eventText = eventName ? ` (${eventName})` : '';
  return ` ${map}${eventText} • <t:${timestamp}:D> <t:${timestamp}:t>`;
}

/**
 * Formatea la antigüedad de los datos en cache en minutos.
 *
 * @param ts - Timestamp en milisegundos (opcional).
 * @returns Cadena indicando hace cuánto tiempo se cargaron los datos, o cadena vacía si no hay timestamp.
 */
export function formatCacheAge(ts?: number): string {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'hace menos de 1 minuto';
  if (mins === 1) return 'hace 1 minuto';
  return `hace ${mins} minutos`;
}
