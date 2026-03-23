# Deploy

## What is ready

- Next.js web app builds cleanly
- Fastify API builds cleanly
- local runtime verified on `http://localhost:3000` and `http://localhost:4000`
- auth demo flow works with access token + refresh cookie
- room creation, join, chat, and playback state are wired together

## What still needs external accounts

- Vercel account for the web app
- Render or Railway account for the API and PostgreSQL
- optional Redis, S3, and TURN services for a fuller production setup

## Recommended deployment split

- `apps/web` -> Vercel
- `apps/api` -> Render or Railway
- PostgreSQL -> Render Postgres or Railway Postgres

## Vercel

Create a Vercel project from the repo and use these settings:

- Root directory: repository root
- Install command: `corepack pnpm install`
- Build command: `corepack pnpm --filter @syncwatch/web build`
- Output: Next.js default

Environment variables:

- `NEXT_PUBLIC_APP_URL=https://your-web-domain`
- `NEXT_PUBLIC_API_URL=https://your-api-domain`
- `NEXT_PUBLIC_SOCKET_URL=https://your-api-domain`

## Render

This repo includes [render.yaml](./render.yaml). It is intended for the API + PostgreSQL part of the stack.

After creation, set:

- `WEB_URL=https://your-web-domain`
- `API_URL=https://your-api-domain`

## Railway

If you prefer Railway:

- deploy one service for `apps/api`
- add PostgreSQL
- point `DATABASE_URL` to the provisioned database
- set `WEB_URL` to the final Vercel domain

Suggested commands:

- build: `corepack pnpm --filter @syncwatch/api build`
- start: `corepack pnpm --filter @syncwatch/api start`

## Production notes

- current auth persistence is still demo-grade and memory-backed
- Prisma schema is present, but the API is not yet fully migrated to PostgreSQL-backed repositories
- for true production voice quality, replace raw peer signaling with LiveKit or another SFU
- for uploads, connect the placeholder route to S3-compatible storage
