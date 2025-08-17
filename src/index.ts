import {
  Client,
  GatewayIntentBits,
  Events,
  Interaction,
  Collection,
} from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { updateRoleCountMessage } from './utils/update-status-message';
import { readState } from './utils/state-manager';
import { handleButtonInteraction } from './button-interactions';

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

  // --- INICIO: CÓDIGO DE DEPURACIÓN ---
  console.log(
    `[DEPURACIÓN] Emojis en caché: ${readyClient.emojis.cache.size}`
  );
  const serverNames = readyClient.guilds.cache.map((g) => g.name);
  console.log(`[DEPURACIÓN] El bot está en los siguientes servidores: ${serverNames.join(', ')}`);
  // --- FIN: CÓDIGO DE DEPURACIÓN ---

  try {
    const state = await readState();
    if (state.guildId) {
      const guild = await readyClient.guilds.fetch(state.guildId);
      await updateRoleCountMessage(guild);
    }
  } catch (error) {
    console.error('Error durante la inicialización del bot:', error);
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
    await handleButtonInteraction(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);
