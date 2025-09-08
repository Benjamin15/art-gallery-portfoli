# Multi-stage build for frontend + server
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci
COPY . .
# Build frontend
ENV VITE_BASE_PATH=/
RUN npm run build

FROM node:20-alpine AS server
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY .env.example ./.env.example
EXPOSE 8787
CMD ["node", "server/index.mjs"]
