import * as http from 'http';

const PORT = process.env.HEALTH_PORT ? parseInt(process.env.HEALTH_PORT) : 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

export function startHealthServer() {
  server.listen(PORT, () => {
    console.log(`[HEALTH] Servidor de salud escuchando en http://localhost:${PORT}/health`);
  });
}
