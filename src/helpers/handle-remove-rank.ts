import { ButtonInteraction } from 'discord.js';
import { confirmRemoveRank } from './confirm-remove-rank';

/**
 * Elimina todos los roles de rango de Apex del usuario.
 * Delega la lógica de confirmación y eliminación a confirmRemoveRank.
 * @param interaction Interacción del botón recibida desde Discord.
 */
export async function handleRemoveRank(interaction: ButtonInteraction) {
  await confirmRemoveRank(interaction);
}
