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

## MinIO (local)

```bash
MINIO_ROOT_USER=minioadmin \
MINIO_ROOT_PASSWORD=minioadmin \
minio server ~/minio-data --console-address ":9001"
```

## Database migrations

The project now supports TypeORM migrations and should move away from `DB_SYNC=true`.

### Fresh database

1. Create an empty database.
2. Set in `apps/backend/.env`:

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
