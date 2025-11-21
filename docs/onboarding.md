# Onboarding — Developer Quick Start

This file contains minimal steps to get Temple running locally and a simple smoke test.

Prerequisites
- Node.js 18+ installed
- pnpm or npm available
- Git

Quick start

1. Install dependencies

```powershell
pnpm install
```

2. Copy environment

Create a `.env` file (see `.env.example` if present) and set:

- `DATABASE_URL` (defaults to SQLite `file:./dev.db`)
- `NEXTAUTH_URL` (e.g. `http://localhost:3000`)
- Optional: `EMAIL_PROVIDER=mock` for local development

3. Migrate database and seed

```powershell
npx prisma migrate dev --name init
node prisma/seed.ts
```

4. Start dev server

```powershell
pnpm dev
```

5. Smoke test

Open `http://localhost:3000` and verify the homepage loads. For an automated smoke test (lightweight):

```powershell
# Basic HTTP health check
curl -I http://localhost:3000
```

If you want, run the included seed to create a test tenant and user (`prisma/seed.ts`).

Notes
- For email testing use `EMAIL_PROVIDER=mock` to avoid sending external emails.
- If you need a Postgres dev environment, update `DATABASE_URL` to point to a local Postgres instance and run the same migrate/seed steps.

If you'd like, I can add a one-click PowerShell script to run the above steps.
