# Flujo de trabajo

## Ramas

- `main`: rama estable. Solo recibe merges.
- Ramas de trabajo: `feat/...`, `fix/...`, `docs/...`.
- Un PR hacia `main` solo valida: `npm ci` + `npm run build`.
- Un merge/push a `main` dispara el release automático.

## Commits

Usar Conventional Commits:

- `feat: ...` -> sube versión minor.
- `fix: ...` -> sube versión patch.
- `BREAKING CHANGE` -> sube versión major.
- `docs: ...` / `chore: ...` -> no fuerzan un cambio de versión por sí solos.

No usar `[skip ci]` en cambios normales. Solo para cambios de CI que no deban generar un release.

## Release automático

En cada push/merge a `main`, el workflow:

1. Instala dependencias y compila.
2. Ejecuta `standard-version`:
   - actualiza `package.json`, `package-lock.json` y `CHANGELOG.md`;
   - crea el commit `chore(release): X.Y.Z [skip ci]`;
   - crea el tag `vX.Y.Z`.
3. Pushea el commit y el tag.
4. Publica la imagen en GHCR con los tags:
   - `latest`
   - `vX.Y.Z`
   - `sha-<commit>`
5. Crea el GitHub Release `Version X.Y.Z`.
6. Si están configuradas las variables de Portainer, actualiza el stack.

El commit de release incluye `[skip ci]`, así que no vuelve a disparar el workflow.

## No hacer a mano

- No ejecutar `npm version`.
- No crear tags manualmente.
- No pushear tags manualmente.
- No editar la versión de `package.json` a mano.
- No usar `[skip ci]` en un cambio de aplicación.

La versión, el tag, el changelog y la imagen los genera el CI.

## Rollback

Para volver a una versión anterior, fijar en el stack de Portainer:

```yaml
image: ghcr.io/brauliorg12/apex-range:vX.Y.Z
```

o:

```yaml
image: ghcr.io/brauliorg12/apex-range:sha-<commit>
```

Después, **Update the stack** con **Re-pull image**.
