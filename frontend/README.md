# 🍀 Clover BI - Frontend

## Setup

```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:3000

## Stack

- Next.js 15 (App Router + Turbopack)
- React 19
- Tailwind CSS v4
- TypeScript 5.4

## Estructura

```
src/
├── app/
│   ├── globals.css    # Tailwind + theme
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Home (Chat BI)
├── components/        # (TODO)
└── lib/               # (TODO)
```

## Scripts

- `npm run dev` - Desarrollo con hot reload (Turbopack)
- `npm run build` - Build producción
- `npm run start` - Correr build
- `npm run lint` - ESLint
