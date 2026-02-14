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
| [02-Arquitectura](docs/02-arquitectura.md) | Flujos Training vs Dashboard |
| [03-Stack](docs/03-stack.md) | Tecnologías (Next.js 15, Fastify 5) |
| [04-MVP](docs/04-mvp.md) | Scope y timeline |
| [05-Roadmap](docs/05-roadmap.md) | Fases y pricing |
| [06-Deployment Backend](docs/06-deployment-backend.md) | Deploy del backend |

---

## 🚀 Estado

- [x] Documentación
- [x] Frontend (Next.js 15 + Tailwind v4)
- [x] Backend (Fastify 5 + TypeScript)
- [x] Ivy Agent (clovers/base:v4 con SQL tools)
- [x] Flujo Training funcionando
- [x] Flujo Dashboard funcionando
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

Servidor en http://localhost:3001

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App en http://localhost:3000

---

## 🐳 Docker (Producción)

### Backend

```bash
cd backend
docker build -t cloverbi/backend:latest .

docker run -d \
  --name cloverbi-backend \
  -p 3001:3001 \
  -e CLOVER_URL=wss://clover.neosolutions.com.ar/ \
  -e CLOVER_TOKEN=tu-token \
  cloverbi/backend:latest
```

Ver [docs/06-deployment-backend.md](docs/06-deployment-backend.md) para guía completa.

---

## 📁 Estructura

```
CloverBI/
├── docs/               # Documentación
│   ├── 01-vision.md
│   ├── 02-arquitectura.md
│   ├── 03-stack.md
│   ├── 04-mvp.md
│   ├── 05-roadmap.md
│   └── 06-deployment-backend.md
├── frontend/           # Next.js 15 + Tailwind v4
│   ├── src/app/
│   ├── Dockerfile
│   └── README.md
├── backend/            # Fastify 5 + TypeScript
│   ├── src/
│   ├── Dockerfile
│   └── README.md
└── README.md
```

---

## 🌐 URLs de Producción

| Servicio | URL |
|----------|-----|
| Frontend | https://cloverbi.neosolutions.com.ar |
| Ivy Agent | https://clover.neosolutions.com.ar |

---

## 🤝 Equipo

- **David Chaves** - Arquitectura, Infra, Backend
- **Cloe Cloverfield** - Documentación, Frontend, QA 💜
- **Ivy Cloverfield** - El agente BI 🌿

---

*CloverBI - Digital Flow*
*Iniciado: San Valentín 2026 💚*
