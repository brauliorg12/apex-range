export interface ApexRank {
  id: string;
  label: string;
  roleName: string;
  icon: string; // <-- Añadimos el icono de texto de respaldo
}

export const APEX_RANKS: ApexRank[] = [
  {
    id: '<:Ranked_Tier1_Bronze:1406723914633052296>',
    label: 'Bronce',
    roleName: 'Bronce',
    icon: '🥉',
  },
  {
    id: '<:Ranked_Tier2_Silver:1406723933608083599>',
    label: 'Plata',
    roleName: 'Plata',
    icon: '🥈',
  },
  {
    id: '<:Ranked_Tier3_Gold:1406723943787925546>',
    label: 'Oro',
    roleName: 'Oro',
    icon: '🥇',
  },
  {
    id: '<:Ranked_Tier4_Platinum:1406723955682705418>',
    label: 'Platino',
    roleName: 'Platino',
    icon: '💠',
  },
  {
    id: '<:Ranked_Tier5_Diamond:1406723964981612596>',
    label: 'Diamante',
    roleName: 'Diamante',
    icon: '💎',
  },
  {
    id: '<:Ranked_Tier6_Master:1406723974313934968>',
    label: 'Maestro',
    roleName: 'Maestro',
    icon: '🔮',
  },
  {
    id: '<:Ranked_Tier7_Apex_Predator:1406723982887223416>',
    label: 'Apex Predator',
    roleName: 'Apex Predator',
    icon: '👹',
  },
];
