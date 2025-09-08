// filepath: /e:/Proyectos/discord-apex/scripts/check-version.js
const { execSync } = require('child_process');
const fs = require('fs');

// Lee la versión actual
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = pkg.version;

// Obtiene la última versión en git
let lastVersionValue = '';
try {
  const lastVersion = execSync('git show HEAD:package.json').toString();
  const lastPkg = JSON.parse(lastVersion);
  lastVersionValue = lastPkg.version;
} catch (e) {
  // Si no hay commits previos, permite el push
  process.exit(0);
}

if (currentVersion === lastVersionValue) {
  console.error(
    '\n[ERROR] Debes actualizar la versión en package.json antes de hacer push.\n'
  );
  process.exit(1);
}
