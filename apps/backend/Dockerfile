FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @astroimg/shared build
RUN pnpm --filter @astroimg/backend build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --filter @astroimg/backend --prod --frozen-lockfile

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PORT=4000
RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=prod-deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --chown=node:node --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --chown=node:node --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --chown=node:node --from=build /app/apps/backend/nest-cli.json ./apps/backend/nest-cli.json
COPY --chown=node:node --from=build /app/apps/backend/tsconfig.build.json ./apps/backend/tsconfig.build.json
COPY --chown=node:node --from=build /app/apps/backend/src/migrations ./apps/backend/src/migrations
COPY --chown=node:node --from=build /app/apps/backend/src/data-source.ts ./apps/backend/src/data-source.ts
COPY --chown=node:node --from=build /app/apps/backend/src/config ./apps/backend/src/config
COPY --chown=node:node --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --chown=node:node --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --chown=node:node --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --chown=node:node --from=build /app/package.json ./package.json

WORKDIR /app/apps/backend
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT || 4000}/health/ready`).then((res) => { if (!res.ok) process.exit(1); }).catch(() => process.exit(1))"]
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
