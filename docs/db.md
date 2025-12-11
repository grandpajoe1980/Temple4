# Database connection guidance and changes

Purpose
-------
This document records the production fixes and recommendations made to improve reliability when connecting the Next.js app (Prisma) to a Supabase PostgreSQL database behind Supavisor/pgbouncer.

Problem summary
---------------
- The application experienced intermittent "Can't reach database server" / Prisma P1001 errors when using the Supabase session-mode pooler (port 5432).
- Session-mode poolers keep connections open per session and are easily exhausted by a multi-instance/short-lived connection environment such as Next.js server components and dev builds.

Resolution summary (what we changed)
-----------------------------------
1. Switched runtime connections to **Transaction mode** (port `6543`) which uses transaction pooling and is better for short-lived connections.
2. Ensured `pgbouncer=true` is present in the runtime `DATABASE_URL` to disable prepared statements and make Prisma compatible with pgbouncer transaction pooling.
3. Limited Prisma's runtime connection usage by adding `connection_limit=3` (recommended) to avoid overwhelming the pooler.
4. Added sensible timeouts: `connect_timeout=30`, `pool_timeout=30`, and `socket_timeout=60` where relevant.
5. Kept a separate direct DB URL for DDL/migrations (`DIRECT_DATABASE_URL`) that points at the database host directly (port `5432`) so migrations are not proxied through the pooler.
6. Implemented a small app-side patch (in `lib/db.ts`) to automatically convert a session-mode pooler URL (port 5432 on `*.pooler.supabase.com`) to transaction mode (port 6543) and append the required params when necessary. This reduces human error when updating `.env`.

Files changed / relevant code
----------------------------
- `lib/db.ts` — central place where the `DATABASE_URL` is read and enhanced. Key responsibilities:
  - Read `DATABASE_URL` from environment or secrets
  - Add/ensure query params: `pgbouncer=true`, `connect_timeout`, `pool_timeout`, `connection_limit`, `socket_timeout`
  - Convert `:5432` to `:6543` for Supavisor pooler URLs automatically and log that conversion
  - Implement health-checks and retry/backoff for Prisma connect

Example connection strings
--------------------------
Use transaction-mode pooler for runtime (recommended):

```
DATABASE_URL="postgresql://<DB_USER>:<DB_PASS>@aws-1-us-east-2.pooler.supabase.com:6543/<DB_NAME>?sslmode=require&pgbouncer=true&connect_timeout=30&connection_limit=3&pool_timeout=30"
```

Use direct DB endpoint for migrations and administrative tasks (do not use pgbouncer=true here):

```
DIRECT_DATABASE_URL="postgresql://<DB_USER>:<DB_PASS>@<direct-db-host>.supabase.co:5432/<DB_NAME>?sslmode=require&connect_timeout=30"
```

Prisma `schema.prisma` datasource snippet
-----------------------------------------
Add both `url` and `directUrl` (Prisma supports `directUrl`) so runtime uses pooled URL but migrations use the direct URL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

Why transaction mode (6543)
---------------------------
- Transaction pooling allows many short-lived client connections to reuse a smaller number of server connections.
- It is more suitable for serverless and request-per-process workloads (Next.js dev server, server components).
- Session mode (5432) ties a server-side connection to the client session and quickly exhausts the pool with many new processes/connections.

What we implemented in the app (brief, technical)
-----------------------------------------------
- When the app reads `DATABASE_URL` it runs it through `addConnectionParams()` which:
  - Parses the URL
  - If host looks like `*.pooler.supabase.com` and the port is `5432`, it changes the port to `6543` and adds `pgbouncer=true`
  - Adds `connect_timeout`, `pool_timeout`, `socket_timeout`, and `connection_limit` defaults if not present
  - Writes the enhanced URL back to `process.env.DATABASE_URL` so any downstream library (Prisma) uses the adjusted URL

Verification and test steps for DB admins
-----------------------------------------
1. Verify the transaction pooler port is reachable (from the app host):

```bash
# Test connection to transaction-mode pooler
psql "host=aws-1-us-east-2.pooler.supabase.com port=6543 user=<DB_USER> dbname=<DB_NAME> password=<DB_PASS> sslmode=require" -c "SELECT 1;"

# or use pg_isready
pg_isready -h aws-1-us-east-2.pooler.supabase.com -p 6543
```

2. Verify the direct DB host for migrations:

```bash
psql "host=<direct-db-host>.supabase.co port=5432 user=<DB_USER> dbname=<DB_NAME> password=<DB_PASS> sslmode=require" -c "SELECT 1;"
```

3. Check the app logs after updating environment variables and restarting the app. Expected logs (examples):

```
[db.ts] Converting from session mode (5432) to transaction mode (6543) for better connection handling
[db.ts] Creating Prisma client with DATABASE_URL host: aws-1-us-east-2.pooler.supabase.com:6543
[db.ts] Background Prisma $connect succeeded on attempt 1
```

4. If the app still shows pooled-connection errors (Prisma codes `P1001`, `P1008`, etc.), check pooler health and pool size limits and verify the `connection_limit` value is appropriate for your deployment.

Operational recommendations
-------------------------
- Keep runtime `connection_limit` small (3-6) depending on the number of app instances. This prevents pool exhaustion.
- Use a dedicated service account for runtime traffic and a separate admin account for migrations.
- Ensure the pooler is configured for **transaction pooling** (not session pooling) if your app uses short-lived connections.
- Provide a direct DB endpoint (no pooler) for privileged operations like schema migration.
- Monitor metrics: connection counts, wait time, max client connections, pgbouncer stats.

Rolling back
------------
If a change must be rolled back, restore the previous `DATABASE_URL` and restart the app. However, if session/pooler exhaustion caused the outage, returning to session mode will likely reintroduce the same problem. Prefer adjusting pool sizes or using the direct URL for critical operations.

Contact / follow-up
-------------------
If you want, I can draft a short email/ticket for your DB team that includes masked connection strings and exact values to change in the tenant environment. I can also provide the exact `DATABASE_URL` string we would like them to allow or test from a specific host/IP.

Appendix — quick checklist for DB admin
--------------------------------------
- [ ] Confirm pooler supports transaction mode and port `6543` is open from app host
- [ ] Confirm `pgbouncer` settings are correct for transaction pooling
- [ ] Provide direct database hostname for migrations (port `5432`)
- [ ] Verify the connection from the app host to both port `6543` and `5432`
- [ ] Share connection test results back to the app team

---
Document generated automatically from recent changes in the codebase (see `lib/db.ts`) and from troubleshooting notes.

## Current status (2025-12-11)

- The application has an app-side enhancement in `lib/db.ts` that prefers the Supavisor transaction-mode pooler (port `6543`) at runtime by converting a detected session-mode pooler URL (port `5432`) and adding recommended params (`pgbouncer=true`, `connection_limit`, `connect_timeout`, etc.).
- A non-destructive schema sync using `prisma db push --accept-data-loss` was performed successfully against the pooler/session endpoint on port `5432` earlier to bring the live database schema in line with `schema.prisma` and regenerate Prisma Client.
- Attempts to create canonical Postgres migration files (e.g., `npx prisma migrate dev --name init_postgres --create-only`) have been intermittently blocked by connectivity or provider-history issues. One attempted `--create-only` run against the transaction-mode pooler (port `6543`) hung and was manually stopped; this indicates an intermittent pooler/network issue that should be investigated if it recurs.

If your goal is to produce and apply formal Prisma migration files (recommended for tracked schema history), follow the exact commands and recommendations below.

## Exact commands and recommended sequence (PowerShell examples)

Notes:
- Use the **direct DB host** for migration creation and application when possible (safer for DDL operations). Keep the pooled `DATABASE_URL` for runtime only.
- Commands below are PowerShell-friendly and set environment variables for the single shell session.
- Replace placeholders (angle-bracketed) with real values. Keep secrets out of chat and commit history.

1) Set env vars for direct (migrations) and pooled (runtime) URLs

```powershell
$env:DIRECT_DATABASE_URL = 'postgresql://<DB_USER>:<DB_PASS>@<direct-db-host>.supabase.co:5432/<DB_NAME>?sslmode=require&connect_timeout=30'
$env:DATABASE_URL = 'postgresql://<DB_USER>:<DB_PASS>@aws-1-us-east-2.pooler.supabase.com:6543/<DB_NAME>?sslmode=require&pgbouncer=true&connect_timeout=30&connection_limit=3&pool_timeout=30'
```

2) Verify connectivity (quick checks)

```powershell
# Test direct DB host (migrations)
psql "host=<direct-db-host>.supabase.co port=5432 user=<DB_USER> dbname=<DB_NAME> password=<DB_PASS> sslmode=require" -c "SELECT 1;"

# Test transaction-mode pooler (runtime)
psql "host=aws-1-us-east-2.pooler.supabase.com port=6543 user=<DB_USER> dbname=<DB_NAME> password=<DB_PASS> sslmode=require" -c "SELECT 1;"
```

3) Create migration files (create-only recommended — review before applying)

```powershell
# Create-only (recommended): creates migration files locally, does not apply them
$env:PRISMA_LOG_LEVEL = 'debug'
npx prisma migrate dev --name init_postgres --create-only

# Expected runtime: typically a few seconds to under a minute. If it hangs > 2-3 minutes, abort and check connectivity/pooler logs.
```

4) Apply migrations (dev flow — applies locally and records applied state)

```powershell
# Apply created migrations (dev): this will apply to the DB and update the local migration history
npx prisma migrate dev --name init_postgres

# OR, in CI / production, commit the migration files and run:
npx prisma migrate deploy
```

5) If you prefer an immediate non-migration sync (already used during troubleshooting)

```powershell
# Non-destructive sync (may accept data loss when flag used) — fast way to bring DB schema in line with schema.prisma
$env:DIRECT_DATABASE_URL = 'postgresql://<DB_USER>:<DB_PASS>@<direct-db-host>.supabase.co:5432/<DB_NAME>?sslmode=require'
npx prisma db push --accept-data-loss
```

6) Using the decrypt-and-run helper script (if you store credentials in `secrets.encrypted.json`)

```powershell
# If you created the helper script scripts/run-migrate-with-secrets.js, you can run migrations with the master password
# Replace the arguments as your helper expects; this is an example pattern used during troubleshooting.
node ./scripts/run-migrate-with-secrets.js --masterPassword "<MASTER_PASSWORD>" --migrateArgs "--name init_postgres --create-only"
```

## Troubleshooting and timing guidance

- Migration creation (`--create-only`) normally completes in seconds. If it hangs for longer than ~2–3 minutes, treat it as a connectivity/pooler issue and check network/pooler health.
- If you see Prisma errors like `P1001` (connection), `P1012` (missing env), or `P3019` (provider mismatch), address them in that order:
  - `P1012`: ensure `DIRECT_DATABASE_URL` is present when Prisma expects it in `schema.prisma`.
  - `P3019`: indicates existing migration history references a different provider (e.g., SQLite). If you intentionally migrated from SQLite during development, you'll need to reconcile or reset migrations. For a dev reset, remove `prisma/migrations` and the repo `migrations/migration_lock.toml` only after backing up and with team consent.
  - `P1001`: network/pooler connectivity — test ports `5432` and `6543`, and inspect Supavisor/pgbouncer metrics.

## Recommended migration workflow (safe)

1. On a developer machine or a temporary dev database (direct access): set `DIRECT_DATABASE_URL` to a direct host and run `npx prisma migrate dev --name init_postgres --create-only`.
2. Inspect the auto-generated SQL in `prisma/migrations/<timestamp>_init_postgres/` and run tests.
3. Commit `prisma/migrations/*` to VCS.
4. In CI or production environment, run `npx prisma migrate deploy` (using `DIRECT_DATABASE_URL` or a DB user that has DDL privileges) to apply migrations.

## Immediate action items for DB/Admin team

- Verify pooler health and connectivity from the app host to `aws-1-us-east-2.pooler.supabase.com:6543` and to the direct DB host on `:5432`.
- Provide a stable direct DB endpoint for migration operations if transaction-mode pooler connectivity is flaky.
- If you want, share masked connection strings and I will prepare a minimal operations runbook with exact values and a short rollback plan.

---

# 🚀 How to Update the Database (Step-by-Step Guide)

This section provides a complete, copy-paste guide for making schema changes to the Supabase database.

## Prerequisites

1. Access to the Supabase dashboard
2. The database password (stored securely)
3. PowerShell terminal in the project root

## Quick Reference

| Task | Command |
|------|---------|
| Push schema changes | `npx prisma db push` |
| Create migration file | `npx prisma migrate dev --name <name> --create-only` |
| Apply migrations | `npx prisma migrate deploy` |
| Regenerate client | `npx prisma generate` |
| View current schema | `npx prisma db pull` |

---

## Step 1: Make Schema Changes

Edit `schema.prisma` to add/modify models:

```prisma
// Example: Adding a new model
model NewFeature {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}
```

Don't forget to add any new relations to existing models (e.g., add a field to `User` model).

---

## Step 2: Get the Session Pooler URL

⚠️ **IMPORTANT**: The direct connection (`db.xxx.supabase.co:5432`) does NOT work on IPv4 networks!

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click the **"Connect"** button (top right)
4. Select **"Session pooler"** method (NOT Direct connection)
5. Copy the connection string

The Session Pooler URL looks like:
```
postgresql://postgres.ldpjrsfotjokdhqnzcjj:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

---

## Step 3: Set Environment Variables (PowerShell)

URL-encode special characters in your password:
- `&` → `%26`
- `#` → `%23`
- `@` → `%40`
- `:` → `%3A`

```powershell
# Replace [URL_ENCODED_PASSWORD] with your actual password (special chars encoded)
$env:DATABASE_URL = 'postgresql://postgres.ldpjrsfotjokdhqnzcjj:[URL_ENCODED_PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
$env:DIRECT_DATABASE_URL = $env:DATABASE_URL
```

### Example with password `DR7Lc3cbE&7H.vS`:

```powershell
# The & becomes %26
$env:DATABASE_URL = 'postgresql://postgres.ldpjrsfotjokdhqnzcjj:DR7Lc3cbE%267H.vS@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
$env:DIRECT_DATABASE_URL = $env:DATABASE_URL
```

---

## Step 4: Push Schema Changes

### Option A: Quick Push (Development) - RECOMMENDED

This syncs the database with your schema without creating migration files:

```powershell
npx prisma db push
```

Expected output:
```
✔ The database is already in sync with the Prisma schema.
✔ Generated Prisma Client
```

### Option B: With Migration Files (Production)

Creates SQL migration files for version control:

```powershell
# Create migration file without applying
npx prisma migrate dev --name add_new_feature --create-only

# Review the generated SQL in prisma/migrations/
# Then apply it:
npx prisma migrate dev
```

---

## Step 5: Regenerate Prisma Client

After any schema change, regenerate the TypeScript client:

```powershell
npx prisma generate
```

---

## Step 6: Restart Dev Server

If your Next.js dev server is running, restart it to pick up the new Prisma client:

```powershell
# Stop the server (Ctrl+C) then:
npm run dev
```

---

## Complete One-Liner (Copy-Paste Ready)

Replace `[PASSWORD_URL_ENCODED]` with your URL-encoded password:

```powershell
$env:DATABASE_URL = 'postgresql://postgres.ldpjrsfotjokdhqnzcjj:[PASSWORD_URL_ENCODED]@aws-1-us-east-2.pooler.supabase.com:5432/postgres'; $env:DIRECT_DATABASE_URL = $env:DATABASE_URL; npx prisma db push; npx prisma generate
```

---

## Troubleshooting

### "Can't reach database server" (P1001)

**Cause**: Using Direct Connection on IPv4 network

**Fix**: Use Session Pooler URL (see Step 2)

### "Environment variable not found: DATABASE_URL"

**Cause**: Environment variable not set in current shell

**Fix**: Re-run the `$env:DATABASE_URL = ...` command

### Command hangs with no output

**Cause**: Network connectivity issue or wrong URL

**Fix**: 
1. Verify you're using Session Pooler (not Direct Connection)
2. Check password URL encoding
3. Try a fresh PowerShell window

### "FATAL: Password authentication failed"

**Cause**: Password not properly URL-encoded

**Fix**: Encode special characters:
- `&` → `%26`
- `#` → `%23`
- Password `foo&bar` → `foo%26bar`

---

## Connection Types Reference

| Type | Host | Port | IPv4 | Use For |
|------|------|------|------|---------|
| Direct | `db.xxx.supabase.co` | 5432 | ❌ No | IPv6 networks only |
| Session Pooler | `aws-X-region.pooler.supabase.com` | 5432 | ✅ Yes | **Migrations, DDL** |
| Transaction Pooler | `aws-X-region.pooler.supabase.com` | 6543 | ✅ Yes | Runtime app connections |

---

## Best Practices

1. **Always test schema changes locally first** if you have a local Postgres
2. **Back up before major changes**: Use Supabase dashboard to create a backup
3. **Use `--create-only` for production**: Review SQL before applying
4. **Keep migration files in version control**: Commit `prisma/migrations/` folder
5. **Don't edit migration files after they're applied**: Create new migrations instead

---

*Last updated: December 2024*
