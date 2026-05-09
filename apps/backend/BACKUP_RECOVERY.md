# Backend Backup and Recovery

This runbook covers MySQL backups/restores, MinIO bucket backups/restores, and
TypeORM migration rollback for the backend.

## Scope

Production state lives mainly in:

- MySQL: relational application data and the TypeORM `migrations` table.
- MinIO: uploaded image/object data in `MINIO_BUCKET`.
- Redis: cache, presence, and transient websocket/session support. Redis is not
  treated as the source of truth in this runbook.

Always run recovery commands from a trusted operator machine or a controlled
maintenance shell with production env loaded.

## Required env

```bash
export RELEASE_VERSION="manual-$(date +%Y%m%d%H%M)"
export MYSQL_CONTAINER="astroimg-mysql"
export MYSQL_DATABASE="astroimg"
export MYSQL_USER="root"
export MYSQL_ROOT_PASSWORD="<secret>"

export MINIO_PUBLIC_URL="https://assets.example.com"
export MINIO_ACCESS_KEY="<secret>"
export MINIO_SECRET_KEY="<secret>"
export MINIO_BUCKET="astroimg"
```

For Docker Compose local or single-host deployments, `.env.docker.local`
contains the corresponding MySQL and MinIO values.

## Backup frequency

- MySQL: before every production migration and at least daily.
- MinIO: before storage-affecting releases and at least daily for production
  buckets.
- Backup verification: restore to a staging or temporary environment at least
  monthly.
- Retention: keep enough daily and weekly backups to satisfy the product's data
  recovery requirements.

## MySQL backup

Create a consistent SQL dump:

```bash
mkdir -p backups

docker exec "$MYSQL_CONTAINER" sh -c \
  'mysqldump -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' \
  > "backups/mysql-${RELEASE_VERSION}.sql"
```

Verify the dump:

```bash
test -s "backups/mysql-${RELEASE_VERSION}.sql"
head -n 20 "backups/mysql-${RELEASE_VERSION}.sql"
```

Recommended off-host copy:

```bash
gzip -9 "backups/mysql-${RELEASE_VERSION}.sql"
```

Upload the compressed dump to the approved backup storage location.

## MySQL restore drill

Do restore drills in staging or a disposable MySQL instance first. Do not point
the app at a partially restored database.

Prepare a clean target database:

```bash
docker exec "$MYSQL_CONTAINER" sh -c \
  'mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS astroimg_restore; CREATE DATABASE astroimg_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
```

Restore:

```bash
docker exec -i "$MYSQL_CONTAINER" sh -c \
  'mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" astroimg_restore' \
  < "backups/mysql-${RELEASE_VERSION}.sql"
```

Validate:

```bash
docker exec "$MYSQL_CONTAINER" sh -c \
  'mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -e "USE astroimg_restore; SHOW TABLES; SELECT COUNT(*) AS migrations_count FROM migrations;"'
```

Point a staging backend at `astroimg_restore` with `DB_SYNC=false`, then run:

```bash
curl -fsS http://127.0.0.1:4000/health/ready
pnpm --filter @astroimg/backend migration:show
```

## MySQL production restore

Use this only for real recovery after approval from the release owner.

1. Stop writes by putting the app in maintenance mode or stopping backend
   replicas.
2. Take an emergency backup of the current broken state.
3. Restore into a new database name first.
4. Validate health and data in staging or a single backend instance.
5. Switch `DB_NAME` to the restored database or rename databases during the
   maintenance window.
6. Start backend and run health checks.

Example restore into a new production database:

```bash
docker exec "$MYSQL_CONTAINER" sh -c \
  'mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE astroimg_recovered CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'

docker exec -i "$MYSQL_CONTAINER" sh -c \
  'mysql -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" astroimg_recovered' \
  < "backups/mysql-${RELEASE_VERSION}.sql"
```

After switching the backend to the restored database, verify:

```bash
curl -fsS "$BACKEND_URL/health/ready"
curl -fsS "$BACKEND_URL/metrics" | head
```

## MinIO bucket backup

Install and configure the MinIO client (`mc`) on the operator machine.

Create an alias:

```bash
mc alias set astroimg-prod "$MINIO_PUBLIC_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
```

Mirror the bucket to local backup storage:

```bash
mkdir -p "backups/minio-${RELEASE_VERSION}"
mc mirror "astroimg-prod/$MINIO_BUCKET" "backups/minio-${RELEASE_VERSION}/"
```

Verify:

```bash
find "backups/minio-${RELEASE_VERSION}" -type f | head
du -sh "backups/minio-${RELEASE_VERSION}"
```

For large buckets, prefer an approved object-storage replication policy or a
scheduled `mc mirror` job to another bucket/region.

## MinIO restore drill

Restore into a staging bucket:

```bash
export RESTORE_BUCKET="astroimg-restore-${RELEASE_VERSION}"

mc mb "astroimg-prod/$RESTORE_BUCKET"
mc mirror "backups/minio-${RELEASE_VERSION}/" "astroimg-prod/$RESTORE_BUCKET"
mc ls "astroimg-prod/$RESTORE_BUCKET" | head
```

Point staging `MINIO_BUCKET` at `$RESTORE_BUCKET`, then verify upload and read
paths through the backend:

```bash
curl -fsS http://127.0.0.1:4000/health/ready
```

## MinIO production restore

If objects were deleted or corrupted:

1. Stop upload/write traffic or put the app in maintenance mode.
2. Mirror the damaged bucket to an emergency location for investigation.
3. Restore missing objects from the backup into the production bucket or a new
   bucket.
4. If using a new bucket, update `MINIO_BUCKET` and restart backend.
5. Verify representative object URLs and upload signing.

Restore missing objects back to the active bucket:

```bash
mc mirror "backups/minio-${RELEASE_VERSION}/" "astroimg-prod/$MINIO_BUCKET"
```

Restore to a new bucket:

```bash
export RECOVERED_BUCKET="astroimg-recovered"
mc mb "astroimg-prod/$RECOVERED_BUCKET"
mc mirror "backups/minio-${RELEASE_VERSION}/" "astroimg-prod/$RECOVERED_BUCKET"
```

Then update backend env:

```env
MINIO_BUCKET=astroimg-recovered
```

## Migration rollback

TypeORM migration commands for this backend:

```bash
pnpm --filter @astroimg/backend migration:show
pnpm --filter @astroimg/backend migration:run
pnpm --filter @astroimg/backend migration:revert
```

Prefer the dedicated migration runner image:

```bash
docker build -f apps/backend/Dockerfile --target migration-runner -t astroimg-backend-migrations .
docker run --rm --env-file apps/backend/.env.production astroimg-backend-migrations pnpm --filter @astroimg/backend migration:show
docker run --rm --env-file apps/backend/.env.production astroimg-backend-migrations pnpm --filter @astroimg/backend migration:revert
```

You can also run commands from a release checkout or migration shell with
backend dependencies installed and production database env loaded. The
production runtime image is optimized for `node dist/main.js`, so use a
dedicated migration environment for rollback commands.

Before rollback:

- [ ] Identify the exact migration to revert.
- [ ] Read the migration `down()` method in `apps/backend/src/migrations`.
- [ ] Confirm whether the migration dropped or transformed data.
- [ ] Take fresh MySQL and MinIO backups.
- [ ] Stop or pause backend writes if rollback changes tables used by active
      requests.

Rollback one migration:

```bash
NODE_ENV=production pnpm --filter @astroimg/backend migration:revert
NODE_ENV=production pnpm --filter @astroimg/backend migration:show
```

Repeat only when the next rollback target has been reviewed.

After rollback:

```bash
curl -fsS "$BACKEND_URL/health/ready"
curl -fsS "$BACKEND_URL/docs-json" >/tmp/astroimg-openapi-after-rollback.json
```

Check application flows that use changed tables.

## Full recovery order

When both database and object storage are affected, recover in this order:

1. Stop backend writes.
2. Preserve the current broken MySQL database and MinIO bucket.
3. Restore MySQL to a new database and validate migration state.
4. Restore MinIO to the matching bucket state.
5. Start one backend instance with restored MySQL and MinIO.
6. Run `/health/ready`, smoke tests, and targeted data checks.
7. Roll the rest of the backend service.
8. Monitor Sentry, logs, `/metrics`, MySQL, Redis, and MinIO.

## Recovery record

For every recovery or drill, record:

- Date and operator.
- Reason for restore or drill.
- MySQL backup path and restored database name.
- MinIO backup path and restored bucket name.
- Migration commands run.
- Health check results.
- Follow-up issues.
