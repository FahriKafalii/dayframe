# Dayframe

Personal productivity backend — tasks, journaling, and calendar aggregation.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL 16 (Docker)
- **ORM:** Sequelize 6
- **Migrations:** sequelize-cli
- **Package manager:** pnpm (workspace)
- **Runtime:** Node 22

## Monorepo Layout

```
dayframe/
├── apps/
│   ├── api/      # Next.js API backend          (port 8000)
│   ├── web/      # Public/user frontend         (port 3000)
│   └── admin/    # Admin dashboard              (port 3001)
└── packages/
    ├── lib/          # env, errors, http, validation, auth cookie utils
    ├── db/           # Sequelize singleton, migrations, sequelize-cli config
    ├── models/       # Explicit Sequelize model definitions + associations
    ├── repositories/ # Data access layer (user-scoped queries)
    ├── services/     # Business logic
    └── types/        # Shared API DTOs for web/admin consumers
```

All database access flows through repositories. Route handlers are thin (validate + delegate to service).
Session auth uses stateless HMAC-SHA256 signed cookies (no external session store).

## Setup

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Copy env and configure
cp .env.example .env
# Edit .env — set DATABASE_URL, SESSION_SECRET, ALLOWED_ORIGINS

# 4. Run migrations
pnpm db:status   # verify connection / migration state
pnpm db:migrate  # apply migrations

# 5. Start dev servers
pnpm dev:api     # http://localhost:8000
pnpm dev:web     # http://localhost:3000
pnpm dev:admin   # http://localhost:3001
# or run all in parallel:
pnpm dev
```

## Environment Variables

All apps load the single root `.env` via `dotenv-cli`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | HMAC key for session cookies (64+ char hex recommended) |
| `ALLOWED_ORIGINS` | Yes | Comma-separated origins allowed for CORS credentialed requests |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Base URL of the API app (consumed by web/admin) |
| `NODE_ENV` | No | `development` (default) or `production` |

## Scripts (root)

| Script | What it does |
|---|---|
| `pnpm dev` | Run api + web + admin in parallel |
| `pnpm dev:api` | Run only the API app |
| `pnpm dev:web` | Run only the web app |
| `pnpm dev:admin` | Run only the admin app |
| `pnpm build` | Build every workspace package |
| `pnpm typecheck` | Type-check every workspace package |
| `pnpm lint` | Lint every workspace app |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:migrate:undo` | Undo last migration |
| `pnpm db:migrate:undo:all` | Undo all migrations |
| `pnpm db:status` | Show migration state |

## API Endpoints

All endpoints are served by `apps/api` at `http://localhost:8000`.

### Auth
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — authenticate, sets session cookie
- `POST /api/auth/logout` — clear session cookie
- `GET /api/auth/me` — current user (requires auth)

### Tasks (requires auth)
- `POST /api/tasks` — create task
- `GET /api/tasks?status=&from=&to=` — list tasks (filtered)
- `GET /api/tasks/[id]` — get task
- `PATCH /api/tasks/[id]` — update task
- `DELETE /api/tasks/[id]` — delete task

### Journal (requires auth)
- `PUT /api/journal/[YYYY-MM-DD]` — upsert journal entry
- `GET /api/journal/[YYYY-MM-DD]` — get journal entry

### Calendar (requires auth)
- `GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD` — calendar day view

### Stats (requires auth)
- `GET /api/stats/summary` — productivity summary

### Health
- `GET /api/health` — database health check
