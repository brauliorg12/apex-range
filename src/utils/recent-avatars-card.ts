import { AttachmentBuilder, EmbedBuilder, Guild, Role } from 'discord.js';
import { loadImage } from '@napi-rs/canvas';
import { getPlayerData } from './player-data-manager';
import { APEX_RANKS } from '../models/constants';
import { getRankEmoji } from './emoji-helper';
import { performance } from 'node:perf_hooks';
import { renderRecentAvatarsCanvas } from './recent-avatars-canvas';
import { logCanvas } from './logger';

/**
 * Genera un card visual mostrando los avatares y rangos de los últimos 5 usuarios registrados.
 * - Descarga los avatares y badges de rango (emoji personalizado si aplica).
 * - Renderiza una imagen con los avatares, badges y nombres.
 * - Construye un embed con la descripción y adjunta la imagen generada.
 * @param guild Instancia del servidor Discord.
 * @returns { embed, files } para enviar en Discord.
 */
export async function buildRecentAvatarsCard(guild: Guild) {
  const tStart = performance.now();
  logCanvas('Iniciando generación de card (últimos 5 registrados)');

  // Obtiene los datos de jugadores registrados en el servidor
  const playerData = await getPlayerData(guild);
  if (playerData.length < 5) {
    logCanvas(
      'No hay suficientes registros para generar el card (min: 5).'
    );
    return null;
  }

  // Ordena y selecciona los 5 registros más recientes
  const recent = [...playerData]
    .sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    )
    .slice(0, 5);

  const size = 128;
  const pad = 16;
  const labelHeight = 36;

  // Helper para descargar imágenes con timeout y métricas
  const fetchWithTimeout = async (url: string, ms = 5000) => {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), ms);
    const start = performance.now();
    try {
      const res = await fetch(url, { signal: controller.signal });
      const elapsed = Math.round(performance.now() - start);
      if (!res.ok) {
        logCanvas(
          `Fetch avatar fallo HTTP ${res.status} en ${elapsed}ms – ${url}`
        );
        return {
          ok: false as const,
          buffer: null as Buffer | null,
          elapsed,
          size: 0,
        };
      }
      const ab = await res.arrayBuffer();
      const buffer = Buffer.from(ab);
      const size =
        Number(res.headers.get('content-length')) || buffer.byteLength || 0;
      logCanvas(`Avatar OK ${size}B en ${elapsed}ms – ${url}`);
      return { ok: true as const, buffer, elapsed, size };
    } catch (e: any) {
      const elapsed = Math.round(performance.now() - start);
      if (e?.name === 'AbortError') {
        logCanvas(`Timeout (${ms}ms) al obtener avatar – ${url}`);
      } else {
        logCanvas(
          'Error al obtener avatar en ' +
          `${elapsed}ms – ${url}: ${e?.message || e}`
        );
      }
      return {
        ok: false as const,
        buffer: null as Buffer | null,
        elapsed,
        size: 0,
      };
    } finally {
      clearTimeout(to);
    }
  };

  // Helper para convertir emoji personalizado a URL de imagen PNG
  const emojiToCdnPng = (emoji: string): string | null => {
    // Formatos: <:name:id> o <a:name:id>
    const m = emoji.match(/^<a?:\w+:(\d+)>$/);
    if (!m) return null;
    const id = m[1];
    // usar PNG estático (para animados también)
    return `https://cdn.discordapp.com/emojis/${id}.png?size=64`;
  };

  // Prepara los datos de cada usuario (avatar, badge, nombre)
  let okCount = 0;
  let failCount = 0;
  const descriptions: string[] = [];
  const items = await Promise.all(
    recent.map(async (r, i) => {
      const ts = Math.floor(new Date(r.assignedAt).getTime() / 1000);
      let avatarUrl: string | null = null;
      const mention = `<@${r.userId}>`;
      let emoji = '';
      let displayName = '';
      let member: any = null; // <-- Declaración aquí

      try {
        member =
          guild.members.cache.get(r.userId) ||
          (await guild.members.fetch(r.userId).catch(() => null));
        if (member) {
          const user = member.user;
          avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
          displayName = member.displayName || user.username;
          // Detecta rango por rol y obtiene solo el emoji
          const rankRoleNames = new Set(APEX_RANKS.map((rk) => rk.roleName));
          const rankRole = member.roles.cache.find((role: Role) =>
            rankRoleNames.has(role.name)
          );
          if (rankRole) {
            const rank = APEX_RANKS.find((rk) => rk.roleName === rankRole.name);
            if (rank) {
              emoji = getRankEmoji(guild.client, rank) || rank.icon;
            }
          }
        } else {
          // Fallback al usuario global si no es miembro en cache
          const user = await guild.client.users
            .fetch(r.userId)
            .catch(() => null);
          if (user) {
            avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
            displayName = user.username;
          }
        }
      } catch {
        // Ignorar errores por usuario no disponible
      }

      // Solo ícono de rango (si existe)
      const parts = [`${i + 1}. ${mention}`];
      if (emoji) parts.push(emoji);
      parts.push(`<t:${ts}:R>`);
      descriptions.push(parts.join(' — '));

      // Avatar
      let img: any = null;
      if (!avatarUrl) {
        failCount++;
        logCanvas(
          'No se encontró URL de avatar, se usará placeholder.'
        );
      } else {
        const ft = performance.now();
        const fetched = await fetchWithTimeout(avatarUrl, 5000);
        if (!fetched.ok || !fetched.buffer) {
          failCount++;
        } else {
          try {
            img = await loadImage(fetched.buffer);
            const loadMs = Math.round(performance.now() - ft);
            logCanvas(`Imagen decodificada en ${loadMs}ms`);
            okCount++;
          } catch (e) {
            failCount++;
            logCanvas(
              'Error al decodificar imagen: ' +
              ((e as any)?.message || e)
            );
          }
        }
      }

      // Badge del rango (imagen desde CDN si es emoji custom; si no, texto)
      let badgeImg: any | null = null;
      let badgeText: string | null = null;
      let badgeColor: string | undefined = undefined;

      if (emoji && member && member.roles?.cache) {
        const rankRoleNames = new Set(APEX_RANKS.map((rk) => rk.roleName));
        const rankRole = member.roles.cache.find((role: Role) =>
          rankRoleNames.has(role.name)
        );
        if (rankRole) {
          const rank = APEX_RANKS.find((rk) => rk.roleName === rankRole.name);
          badgeColor = rank?.color || '#2ecc71';
        }
        const cdn = emojiToCdnPng(emoji);
        if (cdn) {
          const ef = await fetchWithTimeout(cdn, 5000);
          if (ef.ok && ef.buffer) {
            try {
              badgeImg = await loadImage(ef.buffer);
            } catch {
              badgeImg = null;
            }
          }
        } else {
          badgeText = emoji;
        }
      }

      return {
        avatar: img,
        badgeImg,
        badgeText,
        label: displayName || 'Usuario',
        badgeColor,
      };
    })
  );

  // Renderiza la imagen con los avatares y badges usando renderer externo
  const { buffer: pngBuffer, encodeMs } = await renderRecentAvatarsCanvas(
    items,
    {
      size,
      pad,
      labelHeight,
      auraSize: 40, // <-- Aura
      // TODO pasar a una variable global / parametrizable para reutilizar la misma
    }
  );

  // Adjunta la imagen generada al embed
  const attachment = new AttachmentBuilder(pngBuffer, {
    name: 'recent-avatars.png',
  });

  // Construye el embed con la descripción de los usuarios
  const embed = new EmbedBuilder()
    .setColor('#2ecc71')
    .setTitle('🆕 Últimos 5 registrados')
    .setDescription(descriptions.join('\n'))
    .setImage('attachment://recent-avatars.png');

  const totalMs = Math.round(performance.now() - tStart);
  logCanvas(
    `Card generado: ok=${okCount} error=${failCount} | encode=${encodeMs}ms | total=${totalMs}ms`
  );

  // Retorna el embed y el archivo PNG para enviar en Discord
  return { embed, files: [attachment] };
}
