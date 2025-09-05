import { Collection, Client } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Asynchronously loads slash commands from the 'commands' directory and attaches them to the client.
 *
 * This function reads the files in the 'commands' directory, filtering for '.ts' and '.js' files.
 * For each valid command file, it dynamically imports the command module.
 * It verifies that the imported module has 'data' and 'execute' properties, which are required for a valid command.
 * Valid commands are stored in a Discord.js Collection and then attached to the client object.
 *
 * @param {Client} client The Discord client instance to which the commands will be attached.
 */
export async function loadCommands(client: Client) {
  const commands = new Collection<string, any>();
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = await fs.readdir(commandsPath);

  for (const file of commandFiles) {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const filePath = path.join(commandsPath, file);
      try {
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
          commands.set(command.data.name, command);
        } else {
          console.log(
            `[ADVERTENCIA] Al comando en ${filePath} le falta una propiedad "data" o "execute" requerida.`
          );
        }
      } catch (error) {
        console.error(`Error al cargar el comando en ${filePath}:`, error);
      }
    }
  }
  (client as any).commands = commands;
}
