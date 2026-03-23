FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --filter @syncwatch/api... --frozen-lockfile=false

FROM deps AS builder
COPY . .
RUN pnpm --filter @syncwatch/api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 4000
CMD ["pnpm", "--filter", "@syncwatch/api", "start"]

