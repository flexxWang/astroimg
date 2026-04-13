# Astroimg Web

Next.js frontend for the Astroimg project.

## Run

Start the development server:

```bash
pnpm --filter @astroimg/web dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment

- `.env.local`: local development
- `.env.production`: production deployment if you choose file-based envs

## Docker image

Build the production image from the repository root:

```bash
docker build -f apps/web/Dockerfile -t astroimg-web .
```

Run it:

```bash
docker run --env-file apps/web/.env.local -p 3000:3000 astroimg-web
```

## Notes

- This Dockerfile uses Next.js standalone output for a smaller runtime image.
- For production, prefer real platform env vars over committing `.env.production`.
