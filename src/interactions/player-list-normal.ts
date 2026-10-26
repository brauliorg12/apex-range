import { Client, EmbedBuilder, GuildMember } from 'discord.js';
import { getRankEmoji } from '../utils/emoji-helper';
import { logApp } from '../utils/logger';
import type { ApexRank } from '../interfaces/apex-rank';

/** Datos necesarios para construir los embeds del modo normal. */
export interface NormalRankEmbedsParams {
  /** Cliente de Discord para resolver emojis de rango. */
  client: Client;
  /** Rangos filtrados a mostrar. */
  ranks: readonly ApexRank[];
  /** Miembros agrupados por nombre de rol de rango. */
  playersByRank: Record<string, GuildMember[]>;
  /** Fechas de asignación por userId. */
  playerDateById: Map<string, string>;
  /** Si solo se muestran jugadores en línea. */
  onlyOnline: boolean;
  /** Título base del listado. */
  baseTitle: string;
}

/**
 * Construye los embeds del modo normal para servidores pequeños.
 *
 * Agrupa los jugadores por rango, respeta el límite de descripción y divide el
 * listado en partes cuando es necesario. No edita mensajes ni modifica datos.
 *
 * @param params - Rangos, miembros agrupados y opciones de visualización.
 * @returns Los embeds listos para enviar.
 */
export async function buildNormalRankEmbeds(
  params: NormalRankEmbedsParams
): Promise<EmbedBuilder[]> {
  const {
    client,
    ranks,
    playersByRank,
    playerDateById,
    onlyOnline,
    baseTitle,
  } = params;
  const embeds: EmbedBuilder[] = [];
  const MAX_DESCRIPTION_LENGTH = 3900;
  let currentDescription = '';
  let currentEmbed = new EmbedBuilder().setColor('#3498db').setTimestamp();

  for (const rank of ranks) {
    const membersInRank = playersByRank[rank.roleName];
    const emoji = getRankEmoji(client, rank);

    let rankSection = `\n**${emoji} ${rank.label} (${membersInRank.length})**\n`;

    if (membersInRank.length > 0) {
      const membersList = membersInRank
        .map((member, index) => {
          const assignedAt = playerDateById.get(member.id);
          const dateString = assignedAt
            ? ` - _<t:${Math.floor(
                new Date(assignedAt).getTime() / 1000
              )}:D>_`
            : '';
          const displayName = member.displayName || 'Usuario';
          return `${index + 1}. \`${displayName}\` <@${member.id}>${dateString}`;
        })
        .join('\n');
      rankSection += membersList;
    } else {
      rankSection += onlyOnline
        ? `_...No hay jugadores registrados en línea en este rango._`
        : `_...No hay jugadores registrados en este rango._`;
    }
    rankSection += '\n';

    if (
      currentDescription.length + rankSection.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      currentEmbed.setDescription(
        currentDescription.trim().length > 0
          ? currentDescription
          : 'No se encontraron jugadores.'
      );
      embeds.push(currentEmbed);

      currentEmbed = new EmbedBuilder().setColor('#3498db').setTimestamp();
      currentDescription = rankSection;
    } else {
      currentDescription += rankSection;
    }
  }

  if (currentDescription.trim().length > 0) {
    currentEmbed.setDescription(currentDescription);
    embeds.push(currentEmbed);
  }

  if (embeds.length === 0) {
    embeds.push(
      new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(baseTitle)
        .setDescription(
          onlyOnline
            ? 'No se encontraron jugadores registrados en línea.'
            : 'No se encontraron jugadores registrados.'
        )
        .setTimestamp()
    );
  }

  if (embeds.length > 1) {
    embeds.forEach((embed, index) => {
      embed.setTitle(`${baseTitle} - Parte ${index + 1}/${embeds.length}`);
    });
  } else {
    embeds[0].setTitle(baseTitle);
  }

  if (embeds.length > 10) {
    await logApp(
      `[handleShowAllPlayersMenu] ADVERTENCIA: Se generaron ${embeds.length} embeds, enviando solo los primeros 10`
    );
    embeds.splice(10);
    embeds[9].setFooter({
      text: '⚠️ Lista truncada por límites de Discord. Usa los filtros por rango para ver más.',
    });
  }

  return embeds;
}
