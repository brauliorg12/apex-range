/**
 * Aliases conocidos para búsqueda flexible de roles
 */
export const RANK_ALIASES: Record<string, string[]> = {
  predator: [
    'Apex Predator',
    'ApexPredator',
    'Predator',
    'Pred',
    'apex predator',
  ],
  master: ['Maestro', 'Master'],
  diamond: ['Diamante', 'Diamond'],
  platinum: ['Platino', 'Platinum'],
  gold: ['Oro', 'Gold'],
  silver: ['Plata', 'Silver'],
  bronze: ['Bronce', 'Bronze', 'bronce'],
  rookie: ['Rookie'],
};

/**
 * Diccionario de alias conocidos para plataformas.
 * Mapea shortId de plataforma a una lista de posibles nombres alternativos.
 */
export const PLATFORM_ALIASES: Record<string, string[]> = {
  switch: ['Nintendo Switch', 'NintendoSwitch', 'Switch', 'Nintendo'],
  ps4: ['PlayStation', 'PS', 'PS4', 'PS5', 'PSN'],
  pc: ['PC', 'Origin', 'Steam', 'EA'],
  xbox: ['Xbox', 'X1', 'XboxOne', 'Xbox One'],
};

/**
 * Aliases conocidos para roles específicos
 * Permite mapear variantes comunes de nombres de roles
 */
export const ROLE_ALIASES: Record<string, string[]> = {
  // Rangos
  predator: ['apex predator', 'apexpredator', 'pred'],
  master: ['maestro'],

  // Plataformas
  switch: ['nintendo switch', 'nintendoswitch', 'nintendo'],
  ps4: ['playstation', 'ps', 'ps4', 'ps5', 'psn'],
  pc: ['origin', 'steam', 'ea'],
  xbox: ['x1', 'xboxone', 'xbox one', 'xb1'],
};
