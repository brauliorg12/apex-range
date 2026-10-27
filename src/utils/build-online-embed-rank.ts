import {
  ColorResolvable,
  EmbedBuilder,
  Guild,
  GuildMember,
  PresenceStatus,
} from 'discord.js';
import { PC_ONLY_EMOGI } from '../models/constants';
import { getRankEmoji } from './emoji-helper';
import { getStatusIcon } from '../interfaces/status-icon';
import { filterAllowedRoles } from './role-filter';
import { getCountryFlag } from './country-flag';
import {
  buildPlayerLookup,
  getPlayerData,
} from './player-data-manager';
import type { PlayerLookup } from './player-data-manager';
import { buildPlatformIconByApiName } from '../helpers/get-apex-platforms-for-guild';
import { ApexRank } from '../interfaces/apex-rank';

/**
 * Construye un embed visual para mostrar la lista de jugadores de un rango específico en Apex Legends.
 *
 * Esta función genera un embed de Discord que incluye información sobre los jugadores en línea de un rango determinado,
 * con íconos de estado de presencia, menciones clickeables, roles/banderas de países y paginación opcional.
 * Se utiliza principalmente en los paneles interactivos de rangos para mostrar listas de jugadores por rango.
 * Usa roles mapeados del servidor para soportar roles personalizados.
 *
 * @param guild - El servidor de Discord (Guild) donde se mostrarán los jugadores.
 * @param rank - El objeto de rango (ApexRank) que define el rango a mostrar (incluye color, emoji, etc.).
 * @param members - Array de miembros (GuildMember[]) del rango que se mostrarán en esta página o vista.
 * @param cardUrl - (Opcional) URL de la imagen a adjuntar al embed (por ejemplo, un gráfico de estadísticas).
 * @param totalCount - (Opcional) Número total de jugadores en el rango (usado para footers de paginación).
 * @param pageNum - (Opcional) Número de página actual para la paginación (empieza en 1).
 * @param maxPerCard - (Opcional) Máximo número de jugadores por página (usado para calcular índices).
 * @param showNumbers - (Opcional) Si es true, numera los jugadores en la lista (ej: 1., 2.).
 * @param allRankMembers - (Opcional) Array completo de todos los miembros del rango (usado para contar en línea totales).
 * @param lookup - (Opcional) Mapas precomputados de plataforma e íconos. Si se omite, se construye un lookup con la lectura cacheada.
 * @returns Un objeto EmbedBuilder listo para enviar en Discord, con descripción, color y posibles imagen/footer.
 */
export async function buildOnlineEmbedForRank(
  guild: Guild,
  rank: ApexRank,
  members: GuildMember[],
  cardUrl?: string,
  totalCount?: number,
  pageNum?: number,
  maxPerCard?: number,
  showNumbers?: boolean,
  allRankMembers?: GuildMember[], // <-- Todos los del rango
  lookup?: PlayerLookup
) {
  const count = members.length;
  const resolvedLookup =
    lookup ?? buildPlayerLookup(await getPlayerData(guild));
  const platformIconByApiName =
    resolvedLookup.platformIconByApiName ??
    buildPlatformIconByApiName(guild.id, guild);

  // Obtiene el emoji del rango
  const rankEmoji = getRankEmoji(guild.client, rank);

  const onlineMembers = members.filter(
    (member) => member.presence && member.presence.status === 'online'
  );

  // onlineCount: Cuenta cuántos miembros están en línea.
  const onlineCount = (allRankMembers ?? onlineMembers).filter(
    (member) => member.presence && member.presence.status === 'online'
  ).length;

  // jugadoresLabel: Usa singular o plural según la cantidad en línea.
  const jugadoresLabel = onlineCount === 1 ? '_jugador_' : '_jugadores_';

  // totalLabel: Muestra el total de jugadores del rango, por ejemplo "de 10".
  // Se utiliza para indicar cuántos jugadores hay en total, además de los que están en línea.
  const totalLabel =
    typeof totalCount === 'number' ? `de **${totalCount}**` : '';

  // Calcula el índice inicial para la numeración en la página actual
  const startIdx = pageNum && maxPerCard ? (pageNum - 1) * maxPerCard + 1 : 1;

  // Encabezado con cantidad de jugadores y emoji de rango
  let description = '';
  if (onlineCount > 0) {
    description = `> ${rankEmoji} **${onlineCount}** ${jugadoresLabel} en línea ${totalLabel}`;
  } else {
    description = `> ${rankEmoji} ${onlineCount} jugadores en línea ${totalLabel}`;
  }

  if (count > 0) {
    // 🔥 Intentar hacer fetch de miembros no en caché para resolver menciones
    const fetchPromises = members.map(async (member: any) => {
      if (!guild.members.cache.has(member.id)) {
        try {
          await guild.members.fetch(member.id);
        } catch {
          // Ignorar errores (miembro pudo haberse ido del servidor)
        }
      }
    });
    await Promise.all(fetchPromises);

    // Genera la lista de jugadores con numeración, estado, plataforma y roles/banderas
    const memberLines = await Promise.all(
      members.map(async (member: any, idx: number) => {
        const numero = startIdx + idx;
        const status: PresenceStatus =
          (member.presence?.status as PresenceStatus) || 'offline';
        const icon = getStatusIcon(status);

        // Obtener ícono de plataforma desde el mapa precomputado
        const platform =
          resolvedLookup.platformByUserId.get(member.id) ?? '';
        // Siendo id el icono en la constante // TODO mejorar
        const platformIcon =
          platformIconByApiName.get(platform) || PC_ONLY_EMOGI;

        // Verificar si el miembro está en caché después del fetch
        const cachedMember = guild.members.cache.get(member.id);
        const displayName =
          cachedMember?.displayName || member.displayName || 'Usuario';

        // Filtrar roles permitidos y mostrar banderas o nombres
        const allowedRoles = member.roles?.cache
          ? filterAllowedRoles(
              member.roles.cache.map((role: any) => role),
              guild
            )
          : [];
        const rolesDisplay = allowedRoles.length
          ? ` (${allowedRoles
              .map((role) => {
                const flag = getCountryFlag(role.name);
                const capitalized =
                  role.name.charAt(0).toUpperCase() +
                  role.name.slice(1).toLowerCase();
                return flag !== role.name
                  ? `${flag} _${capitalized}_`
                  : `_${capitalized}_`;
              })
              .join(', ')})`
          : '';

        // Mostrar AMBOS (nombre copiable + mención) para comparar
        const userDisplay = cachedMember
          ? `\`${displayName}\` <@${member.id}>` // Nombre copiable + mención
          : `\`${displayName}\``; // Solo nombre copiable (fallback)

        // Solo numerar si showNumbers es true
        return showNumbers
          ? `${numero}. ${icon} ${platformIcon} ${userDisplay}${rolesDisplay}`
          : `${icon} ${platformIcon} ${userDisplay}${rolesDisplay}`;
      })
    );

    description += '\n\n' + memberLines.join('\n');
  }

  // Crea el embed visual con color y descripción
  const embed = new EmbedBuilder()
    .setColor(rank.color as ColorResolvable)
    .setDescription(description);

  // Agrega imagen si corresponde
  if (cardUrl) {
    embed.setImage(cardUrl);
  }

  // Footer dinámico: solo si hay más jugadores que el máximo permitido
  if (typeof totalCount === 'number' && count < totalCount) {
    embed.setFooter({
      text: `👥 Mostrando ${count} jugadores de ${totalCount}. Usa "Ver más" para ver todos.`,
    });
  }

  return embed;
}
