/**
 * Convierte un código ISO de país a emoji Unicode de bandera.
 */
function isoToFlagEmoji(isoCode: string): string {
  return isoCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

/**
 * Mapea nombre de país (MAYÚSCULAS) a código ISO.
 */
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  ARGENTINA: 'AR',
  BRASIL: 'BR',
  BOLIVIA: 'BO',
  CUBA: 'CU',
  CHILE: 'CL',
  COLOMBIA: 'CO',
  HONDURAS: 'HN',
  DOMINICANA: 'DO',
  ESPAÑA: 'ES',
  MEXICO: 'MX',
  PARAGUAY: 'PY',
  PORTUGAL: 'PT',
  'PUERTO RICO': 'PR',
  URUGUAY: 'UY',
  USA: 'US',
  VENEZUELA: 'VE',
};

/**
 * Devuelve el emoji de bandera para un rol de país (en mayúsculas).
 * Si no es un país conocido, retorna el nombre original.
 */
export function getCountryFlag(roleName: string): string {
  const iso = COUNTRY_NAME_TO_ISO[roleName.toUpperCase()];
  return iso ? isoToFlagEmoji(iso) : roleName;
}
