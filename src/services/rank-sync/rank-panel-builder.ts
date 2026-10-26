import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  Guild,
} from 'discord.js';
import { ApexRank } from '../../interfaces/apex-rank';
import {
  APEX_LOGO_EMOJI,
  MAX_PLAYERS_PER_CARD,
  SETTINGS_ALL_EMOGI,
} from '../../models/constants';
import { buildAllOnlineEmbeds } from '../../utils/build-all-online-embed';
import { createManagementButtons } from '../../utils/button-helper';
import { RankPanelPayload } from './rank-panel-types';

/**
 * Construye el embed de encabezado del panel.
 *
 * @returns El embed de encabezado.
 */
function buildHeader(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#bdc3c7')
    .setDescription(
      `${APEX_LOGO_EMOJI} **Jugadores por Rango**\n` +
        '> Haz clic en los nombres para interactuar con perfiles'
    );
}

/**
 * Construye el embed y los botones del panel de gestión.
 *
 * @returns El embed y las filas de botones del panel de gestión.
 */
function buildManagement(): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
} {
  return {
    embed: new EmbedBuilder()
      .setColor('#34495e')
      .setDescription(
        SETTINGS_ALL_EMOGI +
          ' **Panel de Gestión**\n' +
          '> *Estadísticas • Rangos • Plataformas • Búsqueda • Ayuda*'
      ),
    components: createManagementButtons(),
  };
}

/**
 * Construye el panel completo en memoria, ordenado por el `tier` de cada rango.
 *
 * @param guild - El servidor de Discord.
 * @param playerDataSnapshot - Snapshot de jugadores ya validado. Si se omite,
 *   el builder lee los datos desde disco.
 * @param expectedRanks - Lista de rangos ya inspeccionada. Si se omite, se
 *   resuelve el catálogo y se conserva el flujo del setup.
 * @returns El panel completo en memoria.
 * @throws {Error} Si `expectedRanks` está definido y falta el rol de un rango.
 */
export async function buildRankPanel(
  guild: Guild,
  playerDataSnapshot?: unknown[],
  expectedRanks?: readonly ApexRank[]
): Promise<RankPanelPayload> {
  const { embeds, files, componentsList, ranks } =
    await buildAllOnlineEmbeds(
      guild,
      MAX_PLAYERS_PER_CARD,
      playerDataSnapshot,
      expectedRanks
    );

  const cards = ranks.map((rank, index) => ({
    rank,
    embed: embeds[index],
    file: files[index] ?? null,
    components: componentsList[index] ?? [],
  }));

  return {
    header: buildHeader(),
    cards,
    management: buildManagement(),
  };
}
