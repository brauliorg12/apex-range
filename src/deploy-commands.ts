import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  throw new Error(
    'DISCORD_TOKEN y CLIENT_ID deben estar definidos en el archivo .env'
  );
}

import { data as setupRolesCommand } from './commands/setup-roles';
import { data as totalJugadoresCommand } from './commands/total-players';
import { data as showMyRankCommand } from './commands/show-my-rank';
import { data as apiStatusCommand } from './commands/api-status';
import { data as apexStatusCommand } from './commands/apex-status';
import { data as cleanupStateCommand } from './commands/cleanup-state';
import { data as cleanupDataCommand } from './commands/cleanup-data';
import { logApp } from './utils/logger';

const commands = [
  setupRolesCommand.toJSON(),
  totalJugadoresCommand.toJSON(),
  showMyRankCommand.toJSON(),
  apiStatusCommand.toJSON(),
  apexStatusCommand.toJSON(),
  cleanupStateCommand.toJSON(),
  cleanupDataCommand.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    logApp('Empezando a registrar los comandos de aplicación (/).');

    // El método put se usa para refrescar todos los comandos en el servidor con el set actual
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    logApp('¡Comandos de aplicación (/) registrados exitosamente!.');
  } catch (error) {
    logApp(`Error al registrar comandos: ${error}`);
  }
})();
