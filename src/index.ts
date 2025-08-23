import { Client, GatewayIntentBits } from 'discord.js';
import * as dotenv from 'dotenv';
import { loadCommands } from './command-loader';
import { registerInteractionHandler } from './interaction-handler';
import { initBot } from './init-bot';
import { startHealthServer } from './health-server';

dotenv.config();
startHealthServer();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildExpressions,
  ],
});

(async () => {
  await loadCommands(client);
  registerInteractionHandler(client);
  await initBot(client);
  client.login(process.env.DISCORD_TOKEN);
})();
