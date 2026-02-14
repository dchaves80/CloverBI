# ============================================
# CloverBI Backend - Dockerfile
# ============================================
# Multi-stage build for production
# Node 22 LTS + TypeScript
# ============================================

# ---------- Stage 1: Build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias (incluyendo dev para build)
RUN npm ci

# Copiar código fuente
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:22-alpine AS production

WORKDIR /app

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S clover &&     adduser -S clover -u 1001

# Copiar package files
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Cambiar ownership
RUN chown -R clover:clover /app

USER clover

# Puerto default
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3   CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Variables de entorno con defaults
ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicio
CMD ["node", "dist/index.js"]
