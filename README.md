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
