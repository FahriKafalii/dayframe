# Dayframe

Personal productivity backend — tasks, journaling, and calendar aggregation.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL 16 (Docker)
- **ORM:** Sequelize 6
- **Migrations:** sequelize-cli
- **Package manager:** pnpm
- **Runtime:** Node 22

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
docker compose up -d

# 3. Copy env and configure
cp .env.example .env
# Edit .env — set DATABASE_URL and SESSION_SECRET

# 4. Run migrations
pnpm db:status   # verify connection
pnpm db:migrate  # apply migrations

# 5. Start dev server
pnpm dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | HMAC key for session cookies (64+ char hex recommended) |
| `NODE_ENV` | No | `development` (default) or `production` |

## API Endpoints

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

## Architecture

```
src/
├── lib/          # env, errors, http, validation, auth utilities
├── db/           # Sequelize singleton + health ping
├── models/       # Explicit Sequelize model definitions (TS)
├── repositories/ # Data access layer (user-scoped queries)
├── services/     # Business logic
└── app/api/      # Next.js route handlers (thin — validate + delegate)
```

All database access flows through repositories. Route handlers never touch the ORM directly.
Session auth uses stateless HMAC-SHA256 signed cookies (no external session store).
