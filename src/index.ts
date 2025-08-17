import {
  Client,
  GatewayIntentBits,
  Events,
  Interaction,
  Collection,
  Guild,
} from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { updateRoleCountMessage } from './utils/update-status-message';
import { readState } from './utils/state-manager';
import { handleButtonInteraction } from './button-interactions';
import { updateBotPresence } from './utils/presence-helper';

dotenv.config();

class CustomClient extends Client {
  commands = new Collection<string, any>();
}

const client = new CustomClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildExpressions,
  ],
});

async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = await fs.readdir(commandsPath);

  for (const file of commandFiles) {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const filePath = path.join(commandsPath, file);
      try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        } else {
          console.log(
            `[ADVERTENCIA] Al comando en ${filePath} le falta una propiedad \"data\" o \"execute\" requerida.`
          );
        }
      } catch (error) {
        console.error(`Error al cargar el comando en ${filePath}:`, error);
      }
    }
  }
}

const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
};

const debouncedUpdate = debounce((guild: Guild) => {
  updateRoleCountMessage(guild);
  updateBotPresence(client, guild);
}, 5000);

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`¡Listo! Logueado como ${readyClient.user.tag}`);
  await loadCommands();

  try {
    const state = await readState();
    if (state.guildId) {
      const guild = await readyClient.guilds.fetch(state.guildId);
      await updateRoleCountMessage(guild);
      await updateBotPresence(readyClient, guild); // Presencia inicial

      // Actualizar presencia periódicamente
      setInterval(
        () => updateBotPresence(readyClient, guild),
        60000 // cada 60 segundos
      );
    }
  } catch (error) {
    console.error('Error durante la inicialización del bot:', error);
  }
});

client.on(Events.GuildMemberAdd, (member) => {
  debouncedUpdate(member.guild);
});

client.on(Events.GuildMemberRemove, (member) => {
  debouncedUpdate(member.guild);
});

client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
  if (newPresence.guild) {
    debouncedUpdate(newPresence.guild);
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
    await handleButtonInteraction(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);