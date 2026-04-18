# Dayframe

A calm personal operating system for focused individuals — tasks, journaling, and calendar visibility on a single surface.

Self-hosted, TypeScript monorepo built with Next.js 15 and PostgreSQL.

## Features

- **Tasks** — priority, due dates, status filtering, soft delete
- **Journal** — one entry per day with mood, wins, blockers, and notes
- **Calendar** — monthly grid combining tasks and journal entries
- **Dashboard** — streaks, open/completed counts, 7-day activity
- **i18n** — English and Turkish
- **Dark mode** — with no flash-of-unstyled-content
- **Stateless auth** — HMAC-signed session cookies, no Redis

## Stack

Next.js 15 · TypeScript 5 · React 19 · Tailwind CSS v4 · PostgreSQL 16 · Sequelize 6 · Zod · pnpm workspaces · Node 22

## Structure

```
apps/
  api/      # API route handlers (port 8000)
  web/      # User frontend        (port 3000)
  admin/    # Admin panel          (port 3001)
packages/
  lib/          # env, errors, validation, auth cookies
  db/           # Sequelize singleton, migrations
  models/       # Sequelize models
  repositories/ # Data access layer
  services/     # Business logic
  types/        # Shared DTOs
```

Route handlers validate input and delegate to services. All DB access goes through repositories.

## Getting Started

Requirements: Node 22+, pnpm 9+, Docker.

```bash
git clone https://github.com/FahriKafalii/dayframe.git
cd dayframe
pnpm install

docker compose up -d          # start PostgreSQL
cp .env.example .env          # fill in values
pnpm db:migrate               # apply migrations
pnpm dev                      # run api + web + admin
```

Generate a session secret with `openssl rand -hex 64`.

## Environment

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | HMAC key for session cookies (64+ hex chars) |
| `ALLOWED_ORIGINS` | Comma-separated origins for CORS |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL for web/admin |

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Run all apps in parallel |
| `pnpm dev:api` / `dev:web` / `dev:admin` | Run a single app |
| `pnpm build` | Build all apps |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all apps |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:migrate:undo` | Revert last migration |
| `pnpm db:status` | Show migration state |

## API

All endpoints are served at `http://localhost:8000`. Authenticated routes use the session cookie set on login/register.

**Auth** · `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me`

**Tasks** · `GET /api/tasks` · `POST /api/tasks` · `GET|PATCH|DELETE /api/tasks/[id]`

**Journal** · `GET|PUT /api/journal/[YYYY-MM-DD]`

**Calendar** · `GET /api/calendar?from=&to=`

**Stats** · `GET /api/stats/summary`

**Health** · `GET /api/health`

## Conventions

- New entities use `deleted_at` + `paranoid: true`. Unique constraints use partial indexes (`WHERE deleted_at IS NULL`).
- Historical queries (reports, charts) pass `paranoid: false` explicitly.
- Translation strings are client-only to avoid hydration mismatches.
- DTOs shared between server and client live in `@dayframe/types`.

See [PROJECT_NOTES.md](PROJECT_NOTES.md) for architecture notes and [FINANCE_MODULE_PLAN.md](FINANCE_MODULE_PLAN.md) for the planned finance module.

## License

MIT — see [LICENSE](LICENSE).
