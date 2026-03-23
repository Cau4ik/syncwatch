# SyncWatch

SyncWatch is a watch-party web app for lawful video sources. The repo is a monorepo with a Next.js frontend, a Fastify API, shared types, Prisma schema, Docker setup, and a cinematic room UI inspired by streaming and community products without copying Rave branding.

## Stack

- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS
- `apps/api`: Fastify, Socket.IO, TypeScript, Zod
- `packages/shared`: cross-app types and constants
- `prisma`: PostgreSQL schema and seed
- Docker Compose: web, api, postgres, redis

## MVP scope

- email auth flow, refresh cookie scaffolding, and guest join
- room creation and join-by-link
- sync-ready playback state model
- text chat and voice signaling
- YouTube / uploaded video / HLS source abstraction
- modern responsive room UI
- legal pages and moderation primitives

## Local setup

1. Install Node.js 20+ and pnpm.
2. Copy `.env.example` to `.env`.
3. Run `pnpm install`.
4. Run `docker compose up -d postgres redis`.
5. Run `pnpm prisma:generate`.
6. Run `pnpm prisma:migrate`.
7. Run `pnpm prisma:seed`.
8. Run `pnpm dev`.

Web should start on `http://localhost:3000`.
API should start on `http://localhost:4000`.

## Useful scripts

- `pnpm dev`
- `pnpm dev:web`
- `pnpm dev:api`
- `pnpm build`
- `pnpm test`

## Project layout

```text
apps/
  api/
  web/
packages/
  shared/
prisma/
```

## Runtime status

- local web verified on `http://localhost:3000`
- local api verified on `http://localhost:4000`
- `build`, `lint`, and `test` pass in the workspace
- room creation, room join, auth endpoints, and socket chat were verified locally

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Vercel + Render/Railway setup.

## Notes

- The API currently ships with an in-memory MVP room store and demo auth persistence so the realtime flow can run end-to-end before wiring every repository to PostgreSQL.
- Prisma schema is included for the production data model and deployment planning.
- Voice is scaffolded as WebRTC signaling over Socket.IO; for larger rooms move to LiveKit or another SFU.
- Only lawful/authorized content sources should be supported.
