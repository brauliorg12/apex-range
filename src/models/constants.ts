import { ApexRank } from '../interfaces/apex-rank';
import { ApexPlatform } from '../interfaces/apex-platform';

// Parámetro global de aura para los canvas / pulse de los rangos
export const COMMON_AURA_SIZE = 40;

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

// Lista de rangos de Apex Legends
export const APEX_RANKS: ApexRank[] = [
  {
    id: '<:Ranked_Tier0_Rookie:1417884499554996244>',
    shortId: 'rookie',
    label: 'Rookie',
    roleName: 'Rookie',
    icon: '🐣',
    color: '#eaccae',
    apiName: 'Rookie',
  },
  {
    id: '<:Ranked_Tier1_Bronze:1406723914633052296>',
    shortId: 'bronze',
    label: 'Bronce',
    roleName: 'Bronce',
    icon: '🥉',
    color: '#cd7f32',
    apiName: 'Bronze',
  },
  {
    id: '<:Ranked_Tier2_Silver:1406723933608083599>',
    shortId: 'silver',
    label: 'Plata',
    roleName: 'Plata',
    icon: '🥈',
    color: '#bfc1c2',
    apiName: 'Silver',
  },
  {
    id: '<:Ranked_Tier3_Gold:1406723943787925546>',
    shortId: 'gold',
    label: 'Oro',
    roleName: 'Oro',
    icon: '🥇',
    color: '#ffd700',
    apiName: 'Gold',
  },
  {
    id: '<:Ranked_Tier4_Platinum:1406723955682705418>',
    shortId: 'platinum',
    label: 'Platino',
    roleName: 'Platino',
    icon: '💠',
    color: '#43e6e1',
    apiName: 'Platinum',
  },
  {
    id: '<:Ranked_Tier5_Diamond:1406723964981612596>',
    shortId: 'diamond',
    label: 'Diamante',
    roleName: 'Diamante',
    icon: '💎',
    color: '#7289da',
    apiName: 'Diamond',
  },
  {
    id: '<:Ranked_Tier6_Master:1406723974313934968>',
    shortId: 'master',
    label: 'Maestro',
    roleName: 'Maestro',
    icon: '🔮',
    color: '#a259e6',
    apiName: 'Master',
  },
  {
    id: '<:Ranked_Tier7_Apex_Predator:1406723982887223416>',
    shortId: 'predator',
    label: 'Apex Predator',
    roleName: 'Apex Predator',
    icon: '👹',
    color: '#e74c3c',
    apiName: 'Apex Predator',
  },
];

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
