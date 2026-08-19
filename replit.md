# Universal ZIP-to-APK Builder

Securely analyzes uploaded AI-generated projects and builds validated Android APKs through an isolated worker when supported.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `REDIS_URL`, `BUILDER_STORAGE_DIR` (see `.env.example`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle), Docker Android worker

## Where things live

- `lib/analyzer` — detector registry and compatibility analysis
- `lib/security` — ZIP validation, safe extraction, and SHA-256
- `lib/build-engine` — real Gradle/Capacitor command selection and process runner
- `worker` and `docker/android-builder` — isolated real build execution boundary
- `lib/api-spec/openapi.yaml` — API contract
- `lib/db/src/schema` — PostgreSQL schema

## Architecture decisions

- Native Android projects stay native and use their own Gradle wrapper.
- Web projects build production assets before Capacitor Android generation.
- Uploaded source is never executed on the host; the container boundary is mandatory for production.
- Build success is gated by APK validation and SHA-256, not exit codes alone.

## Product

Users can upload a ZIP, inspect detected framework and compatibility evidence, queue a real Android build, inspect real logs, and download a validated APK artifact.

## User preferences

 - Do not create mock APKs, simulated progress, or fake logs.

## Gotchas

- `pnpm --filter @workspace/api-spec run codegen` must run after OpenAPI changes.
- The local preview may analyze projects but cannot build Android without the Docker worker toolchain.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
