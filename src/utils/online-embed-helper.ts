import {
  Guild,
  ActionRowBuilder,
  ButtonBuilder,
} from 'discord.js';
import type { ColorResolvable } from 'discord.js';
import { createCloseButtonRow } from './button-helper';
import { buildOnlineEmbedForRank } from './build-online-embed-rank';
import { createPlayerPaginationEmbed } from './player-pagination-helper';
import { logApp } from './logger';
import { createPaginationButtons } from './online-embed-buttons';
import { loadRankPageData } from './online-embed-members';

export { createSeeMoreButtonRow } from './online-embed-buttons';
export { createPaginationButtons };

/**
 * Genera el embed, archivos y botones para una página específica de jugadores por rango.
 * Solo retorna un embed por card, respetando el máximo por parámetro.
 *
 * - Servidores pequeños (<1000 jugadores): Usa caché de Discord para verificar roles reales
 * - Servidores grandes (>=1000 jugadores): Usa playerData con proxies para mejor rendimiento
 *
 * @param guild - Servidor de Discord.
 * @param rankId - shortId del rango.
 * @param page - Página solicitada.
 * @param maxPerCard - Máximo de jugadores por card.
 * @param showNumbers - Si se numera cada jugador.
 * @returns El embed, archivos, componentes y metadatos de la página, o `null`.
 */
export async function getRankPageEmbed(
  guild: Guild,
  rankId: string,
  page: number,
  maxPerCard: number,
  showNumbers: boolean = true
) {
  const data = await loadRankPageData(guild, rankId, page, maxPerCard);
  if (!data) return null;

  const {
    rank,
    isLargeServer,
    allMembers,
    sortedMembers,
    pageMembers,
    pageNum,
    totalPages,
    files,
    cardUrl,
  } = data;

  // =============================================
  // SERVIDORES PEQUEÑOS: Método original (buildOnlineEmbedForRank)
  // =============================================
  if (!isLargeServer) {
    await logApp(
      `[getRankPageEmbed] Usando método SIMPLE para servidor pequeño`
    );

    const embed = await buildOnlineEmbedForRank(
      guild,
      rank,
      pageMembers,
      cardUrl,
      sortedMembers.length,
      pageNum,
      maxPerCard,
      showNumbers,
      allMembers
    );

    const totalCount = sortedMembers.length;
    const startIdx = (pageNum - 1) * maxPerCard + 1;
    const endIdx = startIdx + pageMembers.length - 1;

    let footerText = `📄 Página ${pageNum} de ${totalPages} | 👥 Mostrando jugadores ${startIdx}-${endIdx} de ${totalCount}`;
    if (totalPages > 1) {
      footerText += '\n👉 Usa los botones para navegar';
    }
    embed.setFooter({ text: footerText });

    const componentsBtns: ActionRowBuilder<ButtonBuilder>[] =
      totalPages > 1
        ? createPaginationButtons(rank.shortId, pageNum, totalPages)
        : [createCloseButtonRow()];

    await logApp(
      `[getRankPageEmbed] ✅ Embed original creado: ${pageMembers.length} jugadores en página ${pageNum}/${totalPages}`
    );

    return {
      embed,
      files,
      components: componentsBtns,
      page: pageNum,
      totalPages,
    };
  }

  // =============================================
  // SERVIDORES GRANDES: Método con paginación avanzada
  // =============================================
  await logApp(
    `[getRankPageEmbed] 🔥 Usando método AVANZADO con emojis para servidor grande`
  );

  await logApp(
    `[getRankPageEmbed] 🔄 Haciendo fetch de ${pageMembers.length} miembros para resolver menciones...`
  );
  try {
    const fetchPromises = pageMembers.map(async (m) => {
      if (!guild.members.cache.has(m.id)) {
        try {
          await guild.members.fetch(m.id);
        } catch {
          // Ignorar errores individuales (usuario pudo haberse ido del servidor)
        }
      }
    });
    await Promise.all(fetchPromises);
    await logApp(
      `[getRankPageEmbed] ✅ Fetch completado. Menciones deberían resolverse correctamente.`
    );
  } catch (fetchError) {
    await logApp(
      `[getRankPageEmbed] ⚠️ Error al hacer fetch de miembros: ${fetchError}`
    );
  }

  const paginationResult = await createPlayerPaginationEmbed(guild, {
    members: sortedMembers,
    page: pageNum,
    playersPerPage: maxPerCard,
    buttonIdPrefix: `rank_${rank.shortId}`,
    color: rank.color as ColorResolvable,
    title: '',
    rank: rank,
    imageUrl: cardUrl,
    showNumbers: showNumbers,
    showPresence: true,
    showPlatform: true,
    showRoles: true,
  });

  return {
    embed: paginationResult.embed,
    files,
    components: paginationResult.components,
    page: paginationResult.page,
    totalPages: paginationResult.totalPages,
  };
}
