import express from 'express';
import { getGlobalApiStatus } from './utils/global-api-status';
import { getLastAdminAlert } from './utils/admin-alert';
import { logApp } from './utils/logger';

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

  app.get('/instance', (req, res) => {
    const lastAlert = getLastAdminAlert();

    res.json({
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
      timestamp: new Date().toISOString(),
      lastAdminAlert: lastAlert
        ? {
            emittedAt: lastAlert.emittedAt,
            errorType: lastAlert.errorType,
            webhookDelivered: lastAlert.webhookDelivered,
          }
        : null,
    });
  });

  const port = process.env.HEALTH_PORT || 3001;
  app.listen(port, () => {
    logApp(`[HealthServer] Escuchando en el puerto ${port}`);
  });
}
