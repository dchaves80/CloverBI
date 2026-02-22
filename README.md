# 📊 CloverBI

**"Preguntá, no programes"**

Plataforma de Business Intelligence con lenguaje natural. Conectá tu base de datos, hacé preguntas en español, obtené dashboards automáticamente.

> 🍀 Construido sobre [Clovers Platform](../Clovers/)

---

## ✨ Demo

```
Usuario: "Ventas por sucursal del último mes"
    ↓
🌿 Ivy analiza, consulta la DB, genera dashboard
    ↓
📊 KPIs + Gráficos + Informe con insights
```

---

## 📚 Documentación

| Doc | Descripción |
|-----|-------------|
| [01-Visión](docs/01-vision.md) | Problema, solución, diferencial |
| [02-Arquitectura](docs/02-arquitectura.md) | Flujos Training vs Dashboard, API Routes |
| [03-Frontend](docs/03-frontend.md) | Páginas, estados, WebSocket protocol |
| [04-MVP](docs/04-mvp.md) | Scope y timeline |
| [05-Roadmap](docs/05-roadmap.md) | Fases y pricing |
| [10-Workspaces](docs/10-workspaces.md) | Workspaces, dashboards y cards (requerimiento esencial) |
| [11-Estructura Navegación](docs/11-estructura-navegacion.md) | Sidebar, secciones y flujos de UI |
| [06-Deployment Backend](docs/06-deployment-backend.md) | Deploy del backend (Fastify) |
| [07-Deployment Frontend](docs/07-deployment-frontend.md) | Deploy del frontend (Next.js) |
| [08-Stack](docs/08-stack.md) | Tecnologías, versiones, hot reload |
| [09-Known Issues](docs/09-known-issues.md) | Issues conocidos y propuestas |

---

## 🚀 Estado

- [x] Documentación
- [x] Frontend (Next.js 15 + Tailwind v4)
- [x] Backend (Fastify 5 + TypeScript)
- [x] Ivy Agent (clovers/base:v4 con SQL tools)
- [x] Flujo Training funcionando
- [x] Flujo Dashboard funcionando
- [x] API Routes (proxy interno)
- [ ] Auth de usuarios
- [ ] Deploy producción
- [ ] Beta pública

---

## 💻 Desarrollo Local

### Requisitos
- Node.js 22+
- Ivy corriendo (o usar clover.neosolutions.com.ar)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar CLOVER_URL y CLOVER_TOKEN
npm run dev
```

Servidor en http://localhost:3002

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App en http://localhost:3000

---

## 🐳 Docker (Producción)

### 1. Crear red

```bash
docker network create cloverbi-net
```

### 2. Backend

```bash
cd backend
docker build -t cloverbi/backend:latest .

docker run -d \
  --name cloverbi-backend \
  --network cloverbi-net \
  --restart unless-stopped \
  -p 127.0.0.1:3002:3002 \
  -e PORT=3002 \
  -e CLOVER_URL=wss://clover.neosolutions.com.ar/ \
  -e CLOVER_TOKEN=tu-token \
  cloverbi/backend:latest
```

### 3. Frontend

```bash
cd frontend
docker build -t cloverbi/frontend:latest .

docker run -d \
  --name cloverbi-frontend \
  --network cloverbi-net \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -e BACKEND_URL=http://cloverbi-backend:3002 \
  cloverbi/frontend:latest
```

Ver guías completas:
- [06-deployment-backend.md](docs/06-deployment-backend.md)
- [07-deployment-frontend.md](docs/07-deployment-frontend.md)

---

## 📁 Estructura

```
CloverBI/
├── docs/               # Documentación
│   ├── 01-vision.md
│   ├── 02-arquitectura.md
│   ├── 03-frontend.md
│   ├── 04-mvp.md
│   ├── 05-roadmap.md
│   ├── 06-deployment-backend.md
│   ├── 07-deployment-frontend.md
│   └── 08-stack.md
├── frontend/           # Next.js 15 + Tailwind v4
│   ├── src/app/
│   │   ├── page.tsx           # Dashboard
│   │   ├── training/page.tsx  # Training
│   │   └── api/               # API Routes (proxy)
│   └── Dockerfile
├── backend/            # Fastify 5 + TypeScript
│   ├── src/
│   └── Dockerfile
└── README.md
```

---

## 🌐 URLs de Producción

| Servicio | URL | Puerto Interno |
|----------|-----|----------------|
| Frontend | https://cloverbi.neosolutions.com.ar | 3000 |
| Backend | (interno) | 3002 |
| Ivy Agent | https://clover.neosolutions.com.ar | 19002 |

---

## 🤝 Equipo

- **David Chaves** - Arquitectura, Infra, Backend
- **Cloe Cloverfield** - Documentación, Frontend, QA 💜
- **Ivy Cloverfield** - El agente BI 🌿

---

*CloverBI - Digital Flow*
*Iniciado: San Valentín 2026 💚*
