# Medora

A multi-tenant clinic management platform — one app, many clinics.

## Layout

```
medora/
├─ frontend/   # Next.js 16 app (dashboard, calendar, billing, public booking)
├─ backend/    # Express 5 + Prisma + Neon (PostgreSQL)
├─ AGENTS.md   # Workspace-wide agent rules
└─ README.md   # (this file)
```

Each package is independent — install and run them in their own folders.

## Quick start

Open two terminals.

**Terminal 1 — API**

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL to your Neon connection string (postgresql://…neon.tech…)
npm install
npm run db:push        # sync Prisma schema to Neon (first time)
npm run dev            # http://localhost:4100
```

Check `GET http://localhost:4100/health` (liveness) and `GET http://localhost:4100/api/health` (includes DB ping).

**Terminal 2 — Web**

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

The frontend may use local demo data until you connect it to this API.

See [`backend/README.md`](backend/README.md) for folder layout and scripts.

## Per-package docs

- [`frontend/README.md`](frontend/README.md) — Next.js setup
- [`backend/README.md`](backend/README.md) — Express, Prisma, Neon, folder layout
