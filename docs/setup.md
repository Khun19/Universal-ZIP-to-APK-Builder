# Local setup

1. Install Node 20+, pnpm, Docker, PostgreSQL, and Redis.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `REDIS_URL`.
3. Build the Android worker:

```bash
docker build -t universal-zip-to-apk/android-builder:latest docker/android-builder
```

4. Install and check the workspace:

```bash
pnpm install
pnpm run typecheck
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/zip-to-apk-builder run dev
```

The API currently accepts a multipart `file` field and writes ZIP bytes to the configured local storage directory. For production, replace the local storage implementation with the planned S3-compatible adapter without changing project metadata or build contracts.