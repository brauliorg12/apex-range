import express from 'express';
import { getGlobalApiStatus } from './utils/global-api-status';

export function startHealthServer() {
  const app = express();

  app.get('/health', (req, res) => {
    res.send('OK');
  });

  app.get('/api-status', (req, res) => {
    const status = getGlobalApiStatus();
    res.json({
      ok: status.ok,
      lastChecked: status.lastChecked ? status.lastChecked.toISOString() : null,
    });
  });

  const port = process.env.HEALTH_PORT || 3001;
  app.listen(port, () => {
    console.log(`[HealthServer] Escuchando en el puerto ${port}`);
  });
}
