export type Img = any;

/**
 * Representa los datos visuales de cada usuario en el card de avatares.
 */
export interface AvatarCardItem {
  avatar: Img | null; // Imagen del avatar del usuario
  badgeImg?: Img | null; // Imagen del badge de rango (si es emoji personalizado)
  badgeText?: string | null; // Texto del badge de rango (si no hay imagen)
  label: string; // Nombre visible del usuario
}

/**
 * Opciones de renderizado para el card de avatares.
 */
export interface AvatarCardOptions {
  size?: number; // Tamaño de cada avatar
  pad?: number; // Espaciado entre avatares
  labelHeight?: number; // Altura del área de nombre debajo del avatar
  auraSize?: number; // Tamaño del aura detrás del avatar
}
