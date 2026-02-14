# 🍀 CloverBI - Backend

API REST que conecta el frontend con Ivy (agente BI).

---

## Stack

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Node.js | 22 LTS | Runtime |
| Fastify | 5 | Framework HTTP |
| TypeScript | 5.4 | Tipado |
| WebSocket (ws) | 8.x | Conexión con Ivy |

---

## Desarrollo Local

### Requisitos
- Node.js 22+
- npm 10+

### Setup

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores
npm run dev
```

Servidor en http://localhost:3001

### Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo con hot reload (tsx watch) |
| `npm run build` | Compilar TypeScript a dist/ |
| `npm start` | Producción (requiere build previo) |

---

## Variables de Entorno

```bash
# Puerto del servidor
PORT=3001

# Ivy/Clover Agent WebSocket URL
CLOVER_URL=wss://clover.neosolutions.com.ar/

# Ivy/Clover Agent Gateway Token
# Obtener con: docker exec [IVY_CONTAINER] cat /home/node/.openclaw/openclaw.json | grep token
CLOVER_TOKEN=
```

---

## API Endpoints

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-14T18:00:00.000Z"
}
```

### Config (para Frontend)

```http
GET /api/config
```

Response:
```json
{
  "gatewayUrl": "wss://clover.neosolutions.com.ar/",
  "gatewayToken": "b7de372ef0d3a2e..."
}
```

El frontend usa estos valores para conectar a Ivy en modo Training.

### Query (Dashboard)

```http
POST /api/query
Content-Type: application/json

{
  "prompt": "Ventas por sucursal",
  "darkMode": true
}
```

Response:
```json
{
  "html": "<!DOCTYPE html>...",
  "mode": "ivy"
}
```

---

## Docker

### Build

```bash
docker build -t cloverbi/backend:latest .
```

### Run

```bash
docker run -d \
  --name cloverbi-backend \
  --restart unless-stopped \
  -p 3001:3001 \
  -e PORT=3001 \
  -e CLOVER_URL=wss://clover.neosolutions.com.ar/ \
  -e CLOVER_TOKEN=tu-token \
  cloverbi/backend:latest
```

### Health Check

```bash
curl http://localhost:3001/health
```

---

## Arquitectura

```
                    ┌─────────────────────────┐
                    │        Frontend         │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
    GET /api/config     POST /api/query      GET /health
            │                   │
            │                   ▼
            │           ┌─────────────┐
            │           │ CloverClient│
            │           └──────┬──────┘
            │                  │ WebSocket
            ▼                  ▼
    Frontend usa ──────► Ivy/Clover Agent
    token para              │
    Training                ▼
                        Base de Datos
```

**Flujos:**
- **Dashboard:** Frontend → POST /api/query → Backend → Ivy
- **Training:** Frontend → GET /api/config → Frontend → Ivy (directo)

---

## Estructura

```
backend/
├── src/
│   ├── index.ts              # Entry point + rutas
│   └── services/
│       └── clover-client.ts  # WebSocket a Ivy
├── dist/                     # Código compilado
├── Dockerfile                # Build de producción
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Deploy

Ver [docs/06-deployment-backend.md](../docs/06-deployment-backend.md) para guía completa de producción.

---

*CloverBI - Digital Flow*
