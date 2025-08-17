export interface ApexRank {
    id: string;
    label: string;
    roleName: string;
    icon: string;
}

export const APEX_RANKS: ApexRank[] = [
    { id: 'rank_bronze', label: 'Bronce', roleName: 'Bronce', icon: '🥉' },
    { id: 'rank_silver', label: 'Plata', roleName: 'Plata', icon: '🥈' },
    { id: 'rank_gold', label: 'Oro', roleName: 'Oro', icon: '🥇' },
    { id: 'rank_platinum', label: 'Platino', roleName: 'Platino', icon: '💎' },
    { id: 'rank_diamond', label: 'Diamante', roleName: 'Diamante', icon: '💠' },
    { id: 'rank_master', label: 'Maestro', roleName: 'Maestro', icon: '👑' },
    { id: 'rank_predator', label: 'Apex Predator', roleName: 'Apex Predator', icon: '🐐' },
];
