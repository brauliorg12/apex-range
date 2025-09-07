import { ApexRank } from '../interfaces/apex-rank';

// Parámetro global de aura para los canvas / pulse de los rangos
export const COMMON_AURA_SIZE = 40;

// Parámetro global para controlar el máximo de jugadores por card en panel principal rankeds
export const MAX_PLAYERS_PER_CARD = 5;

// Límite máximo de archivos adjuntos por mensaje (Discord y Canvas)
export const MAX_ATTACHMENTS_PER_MESSAGE = 10; 

// Nombre común del rol de Apex Legends
export const COMMON_APEX_ROLE_NAME = 'Apex';

// Logo de Apex
export const APEX_LOGO_EMOJI = '<:apex_logo:1412989316426367086>';

// Lista de rangos de Apex Legends
export const APEX_RANKS: ApexRank[] = [
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
