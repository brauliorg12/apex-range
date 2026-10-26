import { ApexRank } from '../interfaces/apex-rank';
import { ApexPlatform } from '../interfaces/apex-platform';

// Parámetro global de aura para los canvas / pulse de los rangos
export const COMMON_AURA_SIZE = 40;

/**
 * Umbral único para considerar lento un render o una actualización de canvas.
 * Solo los casos que lo superan se registran como advertencia.
 */
export const SLOW_CANVAS_MS = 250;

// Parámetro global para controlar el máximo de jugadores por card en panel principal rankeds
export const MAX_PLAYERS_PER_CARD = 5;
// Parámetro global para controlar el máximo de jugadores por página en "Ver más" y paginación de "Ver todos"
export const MAX_PLAYERS_PER_PAGE = 25;

/**
 * Nombre por defecto para el canal de control
 */
export const DEFAULT_CONTROL_CHANNEL_NAME = 'apex-range-admin';

/**
 * Nombre por defecto para el canal del panel
 */
export const DEFAULT_PANEL_CHANNEL_NAME = 'apex-rangos';

// Límite máximo de archivos adjuntos por mensaje (Discord y Canvas)
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

// Nombre común del rol de Apex Legends
export const COMMON_APEX_ROLE_NAME = 'Apex';

// Logo de Apex
export const APEX_LOGO_EMOJI = '<:apex_logo:1412989316426367086>';

// Logos
export const LOGO_APP_EMOGI = '<:apexrange:1410729026410119269>';

export const GAME_PLATFORMS_EMOGI = '<:games_platforms:1418626376751382768>';
export const PC_ONLY_EMOGI = '<:pc_only:1418643798430453881>';
export const PLAYSTATION_EMOGI = '<:playstation:1418625871475900416>';
export const XBOX_EMOGI = '<:xbox:1418625889750483155>';
export const NINTENDO_SWITCH_EMOGI = '<:nintendo_switch:1418625902685720737>';

export const STATS_LOGO_EMOGI = '<:stats_bars:1418626722852765898>';
export const SEARCH_EMOGI = '<:search:1418628214049472606>';
export const FILTER_LIST_EMOGI = '<:filter:1430656194590019754>';
export const HELP_EMOGI = '<:help:1418628581822566400>';
export const ALL_PLAYERS_EMOGI = '<:all_players:1418628948165791964>';
export const NEW_EMOGI = '<:new:1418629366581166232>';
export const REFRESH_EMOGI = '<:refresh:1418648294611226654>';
export const TIMER_EMOGI = '<:timer:1418645242827243702>';

export const SELECT_EMOGI = '<:select:1418630526100836456>';
export const SELECT_DOWN_EMOGI = '<:select_down:1418630564684234853>';
export const SETTINGS_ALL_EMOGI = '<:settings_all:1418632423989838005>';

// Lista de rangos de Apex Legends ordenada por tier (Hierro=1, Predator=10)
export const APEX_RANKS: ApexRank[] = [
  {
    id: '<:Ranked_Tier0_Rookie:1417884499554996244>',
    shortId: 'rookie',
    tier: 1,
    label: 'Hierro',
    roleName: 'Hierro',
    icon: '⚙️',
    color: '#8A8F98',
    apiName: 'Iron',
  },
  {
    id: '<:Ranked_Tier1_Bronze:1406723914633052296>',
    shortId: 'bronze',
    tier: 2,
    label: 'Bronce',
    roleName: 'Bronce',
    icon: '🥉',
    color: '#cd7f32',
    apiName: 'Bronze',
  },
  {
    id: '<:Ranked_Tier2_Silver:1406723933608083599>',
    shortId: 'silver',
    tier: 3,
    label: 'Plata',
    roleName: 'Plata',
    icon: '🥈',
    color: '#bfc1c2',
    apiName: 'Silver',
  },
  {
    id: '<:Ranked_Tier3_Gold:1406723943787925546>',
    shortId: 'gold',
    tier: 4,
    label: 'Oro',
    roleName: 'Oro',
    icon: '🥇',
    color: '#ffd700',
    apiName: 'Gold',
  },
  {
    id: '<:Ranked_Tier4_Platinum:1406723955682705418>',
    shortId: 'platinum',
    tier: 5,
    label: 'Platino',
    roleName: 'Platino',
    icon: '💠',
    color: '#43e6e1',
    apiName: 'Platinum',
  },
  {
    id: '<:Ranked_Tier4_5_Emerald:1562712340108021810>',
    shortId: 'emerald',
    tier: 6,
    label: 'Esmeralda',
    roleName: 'Esmeralda',
    icon: '💚',
    color: '#50C878',
    apiName: 'Emerald',
  },
  {
    id: '<:Ranked_Tier5_Diamond:1406723964981612596>',
    shortId: 'diamond',
    tier: 7,
    label: 'Diamante',
    roleName: 'Diamante',
    icon: '💎',
    color: '#7289da',
    apiName: 'Diamond',
  },
  {
    id: '<:Ranked_Tier6_Master:1406723974313934968>',
    shortId: 'master',
    tier: 8,
    label: 'Maestro',
    roleName: 'Maestro',
    icon: '🔮',
    color: '#a259e6',
    apiName: 'Master',
  },
  {
    id: '<:Ranked_Tier7_Apex_Predator:1406723982887223416>',
    shortId: 'grandmaster',
    tier: 9,
    label: 'Gran maestro',
    roleName: 'Gran maestro',
    icon: '👑',
    color: '#C0392B',
    apiName: 'Grandmaster',
  },
  {
    id: '<:Ranked_Tier7_Apex_Predator:1406723982887223416>',
    shortId: 'predator',
    tier: 10,
    label: 'Apex Predator',
    roleName: 'Apex Predator',
    icon: '👹',
    color: '#e74c3c',
    apiName: 'Apex Predator',
  },
];

/**
 * Valida que los tiers del catálogo sean únicos, contiguos y estén ordenados.
 *
 * @param ranks - Catálogo de rangos a validar.
 * @throws {Error} Si un tier falta, se repite o el catálogo no está ordenado.
 */
function assertRankTiers(ranks: readonly ApexRank[]): void {
  ranks.forEach((rank, index) => {
    if (rank.tier !== index + 1) {
      throw new Error(
        `APEX_RANKS debe estar ordenado por tier contiguo desde 1; ` +
          `se esperaba ${index + 1} y se encontró ${rank.tier} ` +
          `en "${rank.shortId}".`
      );
    }
  });
}

assertRankTiers(APEX_RANKS);

/**
 * Lista de plataformas soportadas por Apex Legends
 */
export const APEX_PLATFORMS: ApexPlatform[] = [
  {
    id: PC_ONLY_EMOGI, // Usar un emoji existente o placeholder
    shortId: 'pc',
    label: 'PC',
    roleName: 'PC',
    icon: '🖥️',
    color: '#0078d4',
    apiName: 'PC',
  },
  {
    id: PLAYSTATION_EMOGI, // Placeholder, ajustar con emoji real
    shortId: 'ps4',
    label: 'PlayStation',
    roleName: 'PlayStation',
    icon: '🎮',
    color: '#003087',
    apiName: 'PS4',
  },
  {
    id: XBOX_EMOGI, // Placeholder
    shortId: 'xbox',
    label: 'Xbox',
    roleName: 'Xbox',
    icon: '🎯',
    color: '#107c10',
    apiName: 'X1',
  },
  {
    id: NINTENDO_SWITCH_EMOGI, // Placeholder
    shortId: 'switch',
    label: 'Nintendo Switch',
    roleName: 'Nintendo Switch',
    icon: '🔴',
    color: '#e60012',
    apiName: 'SWITCH',
  },
];
