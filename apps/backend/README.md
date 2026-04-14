# Astroimg Backend

NestJS backend for the astro community project.

## Setup

```bash
pnpm install
```

## Run

```bash
pnpm run start:dev
```

Backend env files now follow this convention:

- `.env.local`: local development
- `.env.test`: test environment
- `.env.production`: production deployment

`NODE_ENV` decides which file is loaded. When present, legacy `.env` is only used as a fallback.

## Sentry

Backend Sentry is controlled by these env vars:

```env
SENTRY_ENABLED=false
SENTRY_DSN=
SENTRY_RELEASE=
SENTRY_TRACES_SAMPLE_RATE=0
```

When enabled, 5xx exceptions are reported with `requestId`, `traceId`, and authenticated `userId`.

## Local infra with Docker Compose

Start MySQL, Redis and MinIO:

```bash
docker compose up -d
```

Stop them:

```bash
docker compose down
```

Then start the backend locally:

```bash
pnpm --filter @astroimg/backend start:dev
```

Run the basic quality checks before pushing:

```bash
pnpm --filter @astroimg/backend typecheck
pnpm --filter @astroimg/backend lint
```

If this is a fresh database, run migrations once:

```bash
pnpm --filter @astroimg/backend migration:run
```

## Production baseline

- Configure `CORS_ALLOWED_ORIGINS` explicitly before production deployment.
- Replace `JWT_SECRET` with a real secret before production deployment.
- Set `COOKIE_SECURE=true` behind HTTPS.
- Health endpoints:
  - `GET /health/live`
  - `GET /health/ready`
  - `GET /health`

## MinIO (local)

```bash
MINIO_ROOT_USER=minioadmin \
MINIO_ROOT_PASSWORD=minioadmin \
minio server ~/minio-data --console-address ":9001"
```

Console: `http://127.0.0.1:9001`

## Database migrations

The project now supports TypeORM migrations and should move away from `DB_SYNC=true`.

### Fresh database

1. Create an empty database.
2. Set in the active env file:
   Development uses `apps/backend/.env.local`
   Production uses `apps/backend/.env.production`

```env
DB_SYNC=false
DB_RUN_MIGRATIONS=true
```

3. Run:

```bash
pnpm run migration:run
```

### Existing local database (already created by synchronize)

If your current database already has all tables, do **not** run the initial migration directly.
Baseline it first:

```bash
pnpm run migration:baseline-existing
```

Then switch to:

```env
DB_SYNC=false
DB_RUN_MIGRATIONS=true
```

After that, normal startup or `migration:run` will only apply future migrations.

### Useful commands

```bash
pnpm run typecheck
pnpm run lint
pnpm run lint:fix
pnpm run migration:show
pnpm run migration:run
pnpm run migration:revert
pnpm run migration:create
pnpm run migration:generate
```

## Notes

- `DB_SYNC=true` should only be treated as a temporary development escape hatch.
- New schema changes should be added through explicit migrations.
- Environment variables are validated on startup.
- Prefer editing `apps/backend/.env.local`, `apps/backend/.env.test`, or `apps/backend/.env.production` instead of a shared `.env`.
- CI now validates backend `test`, `test:e2e` and `build` in GitHub Actions.

## Docker image

Build the production image from the repository root:

```bash
docker build -f apps/backend/Dockerfile -t astroimg-backend .
```

Run it with your environment file:

```bash
docker run --env-file apps/backend/.env -p 4000:4000 astroimg-backend
```
