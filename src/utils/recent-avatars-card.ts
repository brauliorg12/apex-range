import { AttachmentBuilder, EmbedBuilder, Guild } from 'discord.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { getPlayerData } from './player-data-manager';
import { APEX_RANKS } from '../constants';
import { getRankEmoji } from './emoji-helper';
import { performance } from 'node:perf_hooks'; // <-- NUEVO

export async function buildRecentAvatarsCard(guild: Guild) {
  const tStart = performance.now(); // <-- NUEVO
  console.log('[Canvas] Iniciando generación de card (últimos 5 registrados)');

  const playerData = await getPlayerData();
  if (playerData.length < 5) {
    console.log('[Canvas] No hay suficientes registros para generar el card (min: 5).');
    return null;
  }

  const recent = [...playerData]
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    .slice(0, 5);

  const size = 128;
  const pad = 16;
  const width = pad + 5 * (size + pad);
  const height = size + pad * 2;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo transparente
  ctx.clearRect(0, 0, width, height);

  // Helper: fetch con timeout y métricas
  const fetchWithTimeout = async (url: string, ms = 5000) => {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), ms);
    const start = performance.now();
    try {
      const res = await fetch(url, { signal: controller.signal });
      const elapsed = Math.round(performance.now() - start);
      if (!res.ok) {
        console.warn(`[Canvas] Fetch avatar fallo HTTP ${res.status} en ${elapsed}ms – ${url}`);
        return { ok: false as const, buffer: null as Buffer | null, elapsed, size: 0 };
      }
      const ab = await res.arrayBuffer();
      const buffer = Buffer.from(ab);
      const size =
        Number(res.headers.get('content-length')) || buffer.byteLength || 0;
      console.log(`[Canvas] Avatar OK ${size}B en ${elapsed}ms – ${url}`);
      return { ok: true as const, buffer, elapsed, size };
    } catch (e: any) {
      const elapsed = Math.round(performance.now() - start);
      if (e?.name === 'AbortError') {
        console.warn(`[Canvas] Timeout (${ms}ms) al obtener avatar – ${url}`);
      } else {
        console.warn(`[Canvas] Error al obtener avatar en ${elapsed}ms – ${url}:`, e?.message || e);
      }
      return { ok: false as const, buffer: null as Buffer | null, elapsed, size: 0 };
    } finally {
      clearTimeout(to);
    }
  };

  // Prepara datos y avatares
  let okCount = 0; // <-- NUEVO
  let failCount = 0; // <-- NUEVO
  const descriptions: string[] = [];
  const images = await Promise.all(
    recent.map(async (r, i) => {
      const ts = Math.floor(new Date(r.assignedAt).getTime() / 1000);
      let avatarUrl: string | null = null;
      const mention = `<@${r.userId}>`;
      let emoji = '';

      try {
        const member =
          guild.members.cache.get(r.userId) || (await guild.members.fetch(r.userId).catch(() => null));
        if (member) {
          const user = member.user;
          avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
          // Detecta rango por rol y obtiene solo el emoji
          const rankRoleNames = new Set(APEX_RANKS.map((rk) => rk.roleName));
          const rankRole = member.roles.cache.find((role) => rankRoleNames.has(role.name));
          if (rankRole) {
            const rank = APEX_RANKS.find((rk) => rk.roleName === rankRole.name);
            if (rank) {
              emoji = getRankEmoji(guild.client, rank) || rank.icon;
            }
          }
        } else {
          // Fallback al usuario global si no es miembro en cache
          const user = await guild.client.users.fetch(r.userId).catch(() => null);
          if (user) avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
        }
      } catch {
        // Ignorar errores por usuario no disponible
      }

      // Solo ícono de rango (si existe)
      const parts = [`${i + 1}. ${mention}`];
      if (emoji) parts.push(emoji);
      parts.push(`<t:${ts}:R>`);
      descriptions.push(parts.join(' — '));

      if (!avatarUrl) {
        failCount++;
        console.warn('[Canvas] No se encontró URL de avatar, se usará placeholder.');
        return null;
      }

      // Medimos fetch + loadImage
      const ft = performance.now();
      const fetched = await fetchWithTimeout(avatarUrl, 5000);
      if (!fetched.ok || !fetched.buffer) {
        failCount++;
        return null;
      }

      try {
        const img = await loadImage(fetched.buffer);
        const loadMs = Math.round(performance.now() - ft);
        console.log(`[Canvas] Imagen decodificada en ${loadMs}ms`);
        okCount++;
        return img;
      } catch (e) {
        failCount++;
        console.warn('[Canvas] Error al decodificar imagen:', (e as any)?.message || e);
        return null;
      }
    })
  );

  // Dibuja avatares en círculos
  images.forEach((img, idx) => {
    const x = pad + idx * (size + pad);
    const y = pad;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (img) {
      ctx.drawImage(img, x, y, size, size);
    } else {
      // Placeholder si no hay imagen
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#ecf0f1';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + size / 2, y + size / 2);
    }
    ctx.restore();
  });

  const tEncodeStart = performance.now(); // <-- NUEVO
  const pngBuffer = await canvas.encode('png');
  const encodeMs = Math.round(performance.now() - tEncodeStart); // <-- NUEVO
  const attachment = new AttachmentBuilder(pngBuffer, { name: 'recent-avatars.png' });

  const embed = new EmbedBuilder()
    .setColor('#2ecc71')
    .setTitle('🆕 Últimos 5 registrados')
    .setDescription(descriptions.join('\n'))
    .setImage('attachment://recent-avatars.png');

  const totalMs = Math.round(performance.now() - tStart); // <-- NUEVO
  console.log(
    `[Canvas] Card generado: ok=${okCount} error=${failCount} | encode=${encodeMs}ms | total=${totalMs}ms`
  );

  return { embed, files: [attachment] };
}
