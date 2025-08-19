import { Guild } from 'discord.js';

type UpdateFn = (guild: Guild) => Promise<void>;

export function createUpdateThrottler(waitMs: number, updateFn: UpdateFn) {
  let lastRun = 0;
  let timer: NodeJS.Timeout | null = null;
  let pending = false;
  let pendingGuild: Guild | null = null;

  const run = async (guild: Guild) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pending = false;
    pendingGuild = null;
    lastRun = Date.now();
    try {
      await updateFn(guild);
    } catch (e) {
      console.error('[UpdateThrottler] Error en updateFn:', e);
    }
  };

  const requestUpdate = (guild: Guild) => {
    pendingGuild = guild;
    const now = Date.now();
    const since = now - lastRun;

    if (since >= waitMs) {
      void run(guild);
      return;
    }

    if (!pending) {
      pending = true;
      const delay = waitMs - since;
      timer = setTimeout(() => {
        if (pendingGuild) void run(pendingGuild);
      }, delay);
    }
  };

  const flush = async () => {
    if (pendingGuild) await run(pendingGuild);
  };

  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = false;
    pendingGuild = null;
  };

  return { requestUpdate, flush, cancel };
}
