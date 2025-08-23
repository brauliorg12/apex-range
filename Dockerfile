# Etapa 1: Build (compilación)
FROM node:18-alpine AS build

WORKDIR /app

# Instala dependencias (incluye devDependencies para compilar)
COPY package*.json ./
RUN npm ci

# Copia el resto del código fuente
COPY . .

# Compila TypeScript a JavaScript
RUN npm run build

# Etapa 2: Producción (solo dependencias necesarias y código compilado)
FROM node:18-alpine

WORKDIR /app

# Solo instala dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el código compilado desde la etapa de build
COPY --from=build /app/dist ./dist

# Copia cualquier otro archivo necesario en producción (opcional)
# COPY --from=build /app/assets ./assets

# Comando de inicio
CMD ["node", "dist/index.js"]
