import { REST, Routes } from 'discord.js';
import '../config/env';

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

const commands = [
  setupRolesCommand.toJSON(),
  totalJugadoresCommand.toJSON(),
  showMyRankCommand.toJSON(),
  apiStatusCommand.toJSON(),
  apexStatusCommand.toJSON(),
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Empezando a registrar los comandos de aplicación (/).');

    // El método put se usa para refrescar todos los comandos en el servidor con el set actual
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('¡Comandos de aplicación (/) registrados exitosamente!.');
  } catch (error) {
    console.error(error);
  }
})();
