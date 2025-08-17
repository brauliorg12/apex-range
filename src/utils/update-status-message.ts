import { Guild, TextChannel, Message, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { readState } from './state-manager';
import { APEX_RANKS } from '../constants';

export async function updateRoleCountMessage(guild: Guild) {
    const state = await readState();
    if (!state.channelId || !state.roleCountMessageId || state.guildId !== guild.id) {
        return;
    }

    const channel = await guild.channels.fetch(state.channelId).catch(() => null) as TextChannel | null;
    if (!channel) return;

    let message: Message;
    try {
        message = await channel.messages.fetch(state.roleCountMessageId);
    } catch (error) {
        console.error("No se pudo encontrar el mensaje de conteo. Quizás fue borrado.");
        return;
    }
    
    await guild.members.fetch(); 

    let content = "**📊 Listado**\n\n";
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    // Add a single button to show online players menu
    const showOnlineButton = new ButtonBuilder()
        .setCustomId('show_online_players_menu')
        .setLabel('Ver jugadores en línea')
        .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(showOnlineButton);

    components.push(actionRow);

    for (let i = 0; i < APEX_RANKS.length; i++) {
        const rank = APEX_RANKS[i];
        const role = guild.roles.cache.find(r => r.name === rank.roleName);
        
        if (role) {
            const onlineMembers = role.members.filter(
                m => m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle'
            ).size;
            content += `${rank.icon} **${rank.label}:** ${role.members.size} jugadores (${onlineMembers} en línea)\n`;
        } else {
            content += `${rank.icon} **${rank.label}:** (Rol no encontrado)\n`;
        }
    }

    await message.edit({ content, components }).catch(console.error);
}
