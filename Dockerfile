# Imagem de produção da Clinix API.
#   docker build -t clinix-backend .
#   docker run -p 3000:3000 --env-file .env clinix-backend

FROM node:22-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY docs/openapi.yaml ./docs/openapi.yaml

# Nunca rodar como root dentro do container.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1
CMD ["node", "src/server.js"]
