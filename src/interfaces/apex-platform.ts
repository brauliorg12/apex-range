/**
 * Interfaz que define la estructura de una plataforma de Apex Legends.
 * Similar a ApexRank, pero para plataformas de juego.
 */
export interface ApexPlatform {
  /** ID único de la plataforma (emoji de Discord) */
  id: string;

  /** Identificador corto de la plataforma (para uso interno) */
  shortId: string;

  /** Nombre completo de la plataforma */
  label: string;

  /** Nombre del rol de Discord para esta plataforma */
  roleName: string;

  /** Emoji representativo de la plataforma */
  icon: string;

  /** Color hexadecimal para la plataforma */
  color: string;

  /** Nombre de la plataforma en la API de Mozambique */
  apiName: string;
}
