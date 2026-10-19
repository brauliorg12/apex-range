# Sitio web - Apex Range

Contenido estatico de `https://apex-range.cubanova.com`, servido con **nginx**.

## Archivos

| Archivo | Uso |
| ------- | --- |
| `index.html`, `privacy.html`, `terms.html` | Paginas del sitio. |
| `assets/imgs/init.png` | Imagen usada por el sitio y por el bot. |
| `nginx.conf` | Config de nginx: fallback, cache, gzip y headers. |
| `Dockerfile` | Imagen nginx con el sitio adentro. |
| `.dockerignore` | Excluye `website.zip` del contexto de build. |

`website.zip` es un empaquetado local: no se versiona y no entra en la imagen.

## Imagen

Se publica en GHCR como:

```text
ghcr.io/brauliorg12/apex-range-web:latest
ghcr.io/brauliorg12/apex-range-web:sha-<sha-largo>
```

El workflow que la construye es `.github/workflows/web.yml`. Es independiente
del bot: no modifica `ci-cd.yml`, `main.yml` ni el `Dockerfile` del bot.

## Build y prueba local

Desde la raiz del repo:

```bash
docker build -t apex-range-web:local ./website
docker run --rm -p 8080:80 apex-range-web:local
```

Probar:

```bash
curl -I http://127.0.0.1:8080/
curl -I http://127.0.0.1:8080/terms.html
curl -I http://127.0.0.1:8080/privacy.html
curl -I http://127.0.0.1:8080/ruta/profunda
curl -I http://127.0.0.1:8080/assets/imgs/init.png
curl -I http://127.0.0.1:8080/no-existe.png
curl -I http://127.0.0.1:8080/healthz
```

Esperado: 200 en las rutas validas, `image/png` en la imagen, 404 en
`/no-existe.png` y 200 `text/plain` en `/healthz`.

## Publicacion

- Push a `main` que toque `website/**` o `.github/workflows/web.yml`.
- Tambien se puede correr manualmente con `workflow_dispatch`.
- El workflow publica `latest` + `sha-<largo>`.

## Despliegue

El stack de Portainer, NPM, DNS y rollback se documentan en:

```text
cubanova-manager/stacks/projects/apex-range-web/README.md
```
