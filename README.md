# Astroimg Monorepo

Astro community project with:
- Frontend: Next.js (App Router) + React + TS + Tailwind + shadcn/ui + tiptap + TanStack Query + Zustand
- Backend: NestJS + TypeORM + MySQL + Redis + JWT

Structure:
- apps/backend
- apps/web
- packages/shared

## Full Local Stack

Start the full application stack from the repository root:

```bash
docker compose --env-file .env.docker.local up --build
```

This compose file now starts:
- `web`
- `backend`
- `mysql`
- `redis`
- `minio`

Default local URLs:
- Web: `http://localhost:3000`
- Backend: `http://localhost:4000`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

The compose file reads secrets and local credentials from:
- [`.env.docker.local`](/Users/chengjiaxiang/Desktop/zwo/workspace/astroimg/.env.docker.local)

That file is gitignored so passwords do not need to live in `docker-compose.yml`.

## Sentry

Sentry is now wired for both apps.

- Backend uses `BACKEND_SENTRY_*` variables in [`.env.docker.local`](/Users/chengjiaxiang/Desktop/zwo/workspace/astroimg/.env.docker.local) or `apps/backend/.env.*`
- Web uses `WEB_SENTRY_*` variables in [`.env.docker.local`](/Users/chengjiaxiang/Desktop/zwo/workspace/astroimg/.env.docker.local) and `NEXT_PUBLIC_SENTRY_*` in `apps/web/.env.local`

Recommended first step:

```env
BACKEND_SENTRY_ENABLED=true
BACKEND_SENTRY_DSN=your-backend-dsn
WEB_SENTRY_ENABLED=true
WEB_SENTRY_DSN=your-web-dsn
```

For readable frontend stack traces, also configure source map upload during `next build`:

```env
WEB_SENTRY_AUTH_TOKEN=your-sentry-auth-token
WEB_SENTRY_ORG=your-org-slug
WEB_SENTRY_PROJECT=your-web-project-slug
```

For local non-Docker builds, set the same values in `apps/web/.env.local` as `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`.
