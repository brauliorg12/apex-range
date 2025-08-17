import {
  Client,
  GatewayIntentBits,
  Events,
  GuildMember,
  Interaction,
  Collection,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { updateRoleCountMessage } from './utils/update-status-message';
import { readState } from './utils/state-manager';
import { APEX_RANKS } from './constants';

dotenv.config();

class CustomClient extends Client {
  commands = new Collection<string, any>();
}

const client = new CustomClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[ADVERTENCIA] Al comando en ${filePath} le falta una propiedad \"data\" o \"execute\" requerida.`
    );
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`¡Listo! Logueado como ${readyClient.user.tag}`);
  const state = await readState();
  if (state.guildId) {
    const guild = await readyClient.guilds
      .fetch(state.guildId)
      .catch(() => null);
    if (guild) {
      await updateRoleCountMessage(guild);
    }
  }
});

client.on(Events.GuildMemberAdd, (member) => {
  updateRoleCountMessage(member.guild);
});

client.on(Events.GuildMemberRemove, (member) => {
  updateRoleCountMessage(member.guild);
});

client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
  if (newPresence.guild) {
    updateRoleCountMessage(newPresence.guild);
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.guild) return;

  if (interaction.isChatInputCommand()) {
    const command = (interaction.client as CustomClient).commands.get(
      interaction.commandName
    );

    if (!command) {
      console.error(
        `No se encontró ningún comando que coincida con ${interaction.commandName}.`
      );
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '¡Hubo un error al ejecutar este comando!',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: '¡Hubo un error al ejecutar este comando!',
          ephemeral: true,
        });
      }
    }
  } else if (interaction.isButton()) {
    const { customId, member } = interaction;
    if (!(member instanceof GuildMember) || !interaction.guild) return;

    if (APEX_RANKS.some((rank) => rank.id === customId)) {
      // Existing button handling for role assignment
      const selectedRank = APEX_RANKS.find((rank) => rank.id === customId);
      if (!selectedRank) return;

      await interaction.deferReply({ ephemeral: true });

      try {
        const roleToAssign = interaction.guild.roles.cache.find(
          (role) => role.name === selectedRank.roleName
        );
        if (!roleToAssign) {
          await interaction.editReply({
            content: `El rol "${selectedRank.roleName}" no existe. Por favor, avisa a un administrador.`,
          });
          return;
        }

        const allRankRoleNames = APEX_RANKS.map((r) => r.roleName);
        const rolesToRemove = member.roles.cache.filter((role) =>
          allRankRoleNames.includes(role.name)
        );

        await member.roles.remove(rolesToRemove);
        await member.roles.add(roleToAssign);

        await interaction.editReply({
          content: `¡Se te ha asignado el rol de ${roleToAssign.name}!`,
        });

        await updateRoleCountMessage(interaction.guild);
      } catch (error) {
        console.error('Error al asignar el rol:', error);
        await interaction.editReply({
          content:
            'Hubo un error al intentar asignar tu rol. Asegúrate de que tengo permisos para gestionar roles.',
        });
      }
    } else if (customId === 'show_online_players_menu') {
      await interaction.deferReply({ ephemeral: true });

      const rankButtons = APEX_RANKS.map((rank) =>
        new ButtonBuilder()
          .setCustomId(`show_online_rank_${rank.id}`)
          .setLabel(rank.label)
          .setStyle(ButtonStyle.Secondary)
      );

      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let i = 0; i < rankButtons.length; i += 5) {
        rows.push(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            rankButtons.slice(i, i + 5)
          )
        );
      }

      await interaction.editReply({
        content: 'Selecciona un rango para ver los jugadores en línea:',
        components: rows,
      });
    } else if (customId.startsWith('show_online_rank_')) {
      const rankId = customId.replace('show_online_rank_', '');
      const selectedRank = APEX_RANKS.find((rank) => rank.id === rankId);

      if (!selectedRank) {
        await interaction.reply({
          content: 'Rango no encontrado.',
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        const role = interaction.guild.roles.cache.find(
          (r) => r.name === selectedRank.roleName
        );
        if (!role) {
          await interaction.editReply({
            content: `El rol "${selectedRank.roleName}" no existe.`,
          });
          return;
        }

        const onlineMembers = role.members.filter(
          (m) =>
            m.presence?.status === 'online' ||
            m.presence?.status === 'dnd' ||
            m.presence?.status === 'idle'
        );

        if (onlineMembers.size === 0) {
          await interaction.editReply({
            content: `No hay jugadores en línea en el rango ${selectedRank.label}.`,
          });
          return;
        }

        const memberList = onlineMembers
          .map((member) => {
            const allRoles = member.roles.cache
              .filter(
                (role) =>
                  role.name !== '@everyone' &&
                  !APEX_RANKS.some((rank) => rank.roleName === role.name)
              )
              .map((role) => role.name)
              .join(', ');
            const rolesDisplay = allRoles ? ` (${allRoles})` : '';
            return `- **${member.displayName}**${rolesDisplay}`;
          })
          .join('\n');
        await interaction.editReply({
          content: `**Jugadores en línea en ${selectedRank.label}:**
${memberList}

`,
        });
      } catch (error) {
        console.error('Error al obtener miembros en línea:', error);
        await interaction.editReply({
          content:
            'Hubo un error al intentar obtener la lista de jugadores en línea.',
        });
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
