# Medora backend

**Express 5** + **TypeScript** + **Prisma** + **[Neon](https://neon.tech)** (PostgreSQL).

## Layout

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   ├── controllers/
│   ├── lib/
│   ├── middleware/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── app.ts
│   └── index.ts
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

1. Create a **Neon** project → copy the **connection string** (`postgresql://…?sslmode=require`).

2. Configure env:

   ```bash
   cd backend
   cp .env.example .env
   # Edit .env — DATABASE_URL, JWT_SECRET (min 16 chars; see .env.example)
   ```

3. Install and push schema (or migrate):

   ```bash
   npm install
   npm run db:push                    # sync schema
   npm run db:seed                    # demo user admin@clinic.in / adminadmin
   # npm run db:migrate               # alternative: named migrations
   ```

4. Run:

   ```bash
   npm run dev
   ```

Defaults: `PORT=4100`.

## Endpoints

| Method | Path                 | Notes |
| ------ | -------------------- | ----- |
| GET    | `/health`            | Liveness — no DB |
| GET    | `/api`               | API banner |
| GET    | `/api/health`        | App + Neon connectivity (`SELECT 1`) |
| POST   | `/api/auth/login`    | Body `{ email, password }` — sets **httpOnly** session cookie (`AUTH_COOKIE_NAME`) |
| GET    | `/api/auth/me`       | Cookie or `Authorization: Bearer` → current `{ user }` |
| POST   | `/api/auth/logout`   | Clears session cookie (`204`) |

### Session cookie (recommended)

After login, the JWT is stored in **`httpOnly`** **`medora_session`** by default (`AUTH_COOKIE_NAME`). It is **not** returned in the login JSON body (safer vs XSS).

Call protected routes from the browser with **`credentials: "include"`** (same-site or configured CORS origin). Example:

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@clinic.in", "password": "adminadmin" }
→ Set-Cookie: medora_session=…; HttpOnly; SameSite=Lax; …
→ { "user": { "id", "email", "role" }, "signedInAt": "…" }

GET /api/auth/me
Cookie: medora_session=…

→ { "user": { "id", "email", "role" } }
```

**Alternative:** send **`Authorization: Bearer \<jwt\>`** (middleware accepts cookie first, then bearer).

### Errors

Login / token: `401` + `{ "error", "code" }` (`INVALID_CREDENTIALS`, `INVALID_TOKEN`, …).

## Scripts

| Script               | Description |
| -------------------- | ----------- |
| `npm run dev`        | `tsx watch` |
| `npm run build`      | `prisma generate` + `tsc` + `tsc-alias` |
| `npm start`          | `node dist/index.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate`| Prisma Client |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:push`    | `prisma db push` |
| `npm run db:seed`    | Seed demo user (after schema sync) |
| `npm run db:studio`  | Prisma Studio |

## Neon notes

- Use the connection string from the Neon console (`postgresql://…neon.tech/…`).
- Pooler vs direct: see [Prisma × Neon](https://www.prisma.io/docs/orm/overview/databases/neon).

## Environment

See `.env.example`: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, optional **`AUTH_COOKIE_NAME`**, **`PORT`**, **`CORS_ORIGINS`** (set explicit origins in production when using credentials).

## Imports

Use **`@/…`** under `src/` (see `tsconfig.json`). Production build runs **`tsc`** then **`tsc-alias`** for Node-friendly `dist/`.
