# Backend Release Checklist

Use this checklist for every backend production release. Fill in the release
values first, then execute each section in order.

## Release values

```bash
export RELEASE_VERSION="backend-$(date +%Y%m%d%H%M)"
export BACKEND_URL="https://api.example.com"
export DOCKER_IMAGE="registry.example.com/astroimg/backend:${RELEASE_VERSION}"
export PREVIOUS_DOCKER_IMAGE="registry.example.com/astroimg/backend:<previous-version>"
```

- Release owner:
- Release window:
- Git commit SHA:
- Sentry release: `${RELEASE_VERSION}`
- Database backup path:
- MinIO backup path:
- Apifox project:

## 1. Pre-release checks

- [ ] Confirm the release branch contains only intended backend changes.
- [ ] Confirm production secrets are present in the deployment secret manager,
      not committed files.
- [ ] Confirm `DB_SYNC=false` in production.
- [ ] Confirm `DB_RUN_MIGRATIONS=true` only if the runtime should apply pending
      migrations on startup. If migrations are applied manually, keep it false
      during normal boot.
- [ ] Confirm `CORS_ALLOWED_ORIGINS`, `COOKIE_SECURE`, `JWT_SECRET`, MySQL,
      Redis, MinIO, and Sentry env values are production values.
- [ ] Confirm the rollback target image is known and still available.
- [ ] Confirm the release has a database backup and MinIO backup plan. See
      [BACKUP_RECOVERY.md](./BACKUP_RECOVERY.md).

Run local quality gates from the repository root:

```bash
pnpm --filter @astroimg/backend typecheck
pnpm --filter @astroimg/backend lint
pnpm --filter @astroimg/backend test
pnpm --filter @astroimg/backend test:e2e
pnpm --filter @astroimg/backend build
```

Check pending migrations:

```bash
pnpm --filter @astroimg/backend migration:show
```

Review every pending migration before release:

- [ ] `up()` is forward-compatible with the currently deployed app where
      possible.
- [ ] `down()` is present and tested for emergency rollback.
- [ ] Risky table rewrites, destructive drops, or long locks have a maintenance
      window.
- [ ] Required data backfills are documented.

## 2. Backup before migration

Create backups before applying migrations:

```bash
mkdir -p backups

docker exec astroimg-mysql sh -c \
  'mysqldump -u"$MYSQL_USER" -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' \
  > "backups/mysql-${RELEASE_VERSION}.sql"
```

For MinIO, use `mc` from a trusted operator machine:

```bash
mc alias set astroimg-prod "$MINIO_PUBLIC_URL" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
mc mirror "astroimg-prod/$MINIO_BUCKET" "backups/minio-${RELEASE_VERSION}/"
```

Verify backups exist and are readable:

```bash
test -s "backups/mysql-${RELEASE_VERSION}.sql"
test -d "backups/minio-${RELEASE_VERSION}"
```

## 3. Docker image

Build and tag the backend image from the repository root:

```bash
docker build -f apps/backend/Dockerfile -t "$DOCKER_IMAGE" .
```

Smoke test the image locally with production-like env:

```bash
docker run --rm --env-file apps/backend/.env.production -p 4000:4000 "$DOCKER_IMAGE"
```

In another terminal:

```bash
curl -fsS http://127.0.0.1:4000/health/live
curl -fsS http://127.0.0.1:4000/health/ready
curl -fsS http://127.0.0.1:4000/docs-json >/tmp/astroimg-openapi.json
```

Push the image:

```bash
docker push "$DOCKER_IMAGE"
```

Build the dedicated migration runner image:

```bash
docker build -f apps/backend/Dockerfile --target migration-runner -t "${DOCKER_IMAGE}-migrations" .
```

## 4. Sentry release

Set the backend Sentry env before deployment:

```env
SENTRY_ENABLED=true
SENTRY_RELEASE=backend-YYYYMMDDHHMM
SENTRY_TRACES_SAMPLE_RATE=0.1
```

If the project uses `sentry-cli`, register the release:

```bash
sentry-cli releases new "$RELEASE_VERSION"
sentry-cli releases set-commits "$RELEASE_VERSION" --auto
sentry-cli releases finalize "$RELEASE_VERSION"
```

After deployment, confirm new backend errors and traces are tagged with the
same release value.

## 5. Migration

Prefer applying migrations as an explicit deployment step so failures are easy
to identify. Use the dedicated migration runner image or a release checkout
that has backend dependencies installed and network access to production MySQL.
Do not assume the production runtime image can run TypeORM CLI commands; that
image is optimized for `node dist/main.js`.

Show pending migrations:

```bash
pnpm --filter @astroimg/backend migration:show
```

Apply migrations:

```bash
docker run --rm --env-file apps/backend/.env.production "${DOCKER_IMAGE}-migrations"
```

Immediately check migration state:

```bash
docker run --rm --env-file apps/backend/.env.production "${DOCKER_IMAGE}-migrations" pnpm --filter @astroimg/backend migration:show
```

Post-migration checks:

- [ ] `migration:show` has no unexpected pending migrations.
- [ ] App startup succeeds with `DB_SYNC=false`.
- [ ] `/health/ready` returns success.
- [ ] No new MySQL lock waits or slow queries are sustained.

## 6. Deploy

For this repository's Docker Compose deployment, rebuild and recreate the
backend from the current release checkout:

```bash
docker compose --env-file .env.docker.local up -d --build backend
```

For image-based platforms, update the backend service image to
`${DOCKER_IMAGE}` and roll the service using the platform's deployment command.

Watch startup:

```bash
docker logs -f astroimg-backend
```

## 7. Health checks

Run these checks from outside the cluster or host:

```bash
curl -fsS "$BACKEND_URL/health/live"
curl -fsS "$BACKEND_URL/health/ready"
curl -fsS "$BACKEND_URL/health"
curl -fsS -H "Authorization: Bearer $METRICS_TOKEN" "$BACKEND_URL/metrics" | head
curl -fsS "$BACKEND_URL/docs-json" >/tmp/astroimg-openapi.json
```

Expected:

- [ ] `/health/live` returns HTTP 200.
- [ ] `/health/ready` returns HTTP 200 and dependencies are healthy.
- [ ] `/metrics` returns Prometheus text.
- [ ] No sustained 5xx spike in logs, metrics, or Sentry.
- [ ] Login, refresh, upload signing, feed listing, like/comment, and message
      flows pass a quick smoke test.

## 8. Apifox documentation sync

The backend exposes OpenAPI after startup:

- Swagger UI: `${BACKEND_URL}/docs`
- OpenAPI JSON: `${BACKEND_URL}/docs-json`
- OpenAPI YAML: `${BACKEND_URL}/docs-yaml`

Sync Apifox:

- [ ] Import or refresh from `${BACKEND_URL}/docs-json`.
- [ ] Confirm auth cookie/JWT settings still match the environment.
- [ ] Confirm new or changed DTO examples are readable.
- [ ] Confirm removed endpoints are intentionally removed from Apifox.
- [ ] Publish or share the updated Apifox version with the frontend/client
      consumers.

Optional local export check:

```bash
curl -fsS "$BACKEND_URL/docs-json" -o "/tmp/astroimg-openapi-${RELEASE_VERSION}.json"
```

## 9. Rollback

Use rollback when the release causes user-impacting errors and a quick forward
fix is riskier than reverting.

Rollback service image:

```bash
# Image-based platform:
# set the backend service image to "$PREVIOUS_DOCKER_IMAGE" and roll the service.
```

For this repository's Docker Compose deployment, check out the previous release
commit or tag, then rebuild and recreate the backend:

```bash
docker compose --env-file .env.docker.local up -d --build backend
```

If the migration must also be reverted, run one migration rollback at a time:

```bash
docker run --rm --env-file apps/backend/.env.production "${DOCKER_IMAGE}-migrations" pnpm --filter @astroimg/backend migration:revert
docker run --rm --env-file apps/backend/.env.production "${DOCKER_IMAGE}-migrations" pnpm --filter @astroimg/backend migration:show
```

Repeat `migration:revert` only after confirming the next pending rollback is
safe. For data-destructive migrations, prefer restoring from backup instead of
assuming `down()` can reconstruct lost data.

Rollback checks:

- [ ] Previous image is running.
- [ ] `/health/ready` returns HTTP 200.
- [ ] Sentry 5xx rate returns to baseline.
- [ ] Data integrity is verified for affected tables and uploaded objects.
- [ ] Apifox points at the currently deployed API shape.

## 10. Post-release

- [ ] Record release version, image digest, migration list, backup paths, and
      deploy time.
- [ ] Record any manual migration or recovery commands that were run.
- [ ] Keep monitoring Sentry, logs, `/metrics`, MySQL, Redis, and MinIO for at
      least 30 minutes.
- [ ] Open follow-up issues for any warnings, slow migrations, flaky health
      checks, or missing docs found during release.
