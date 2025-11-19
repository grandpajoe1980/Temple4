# Temple Platform - Code Review (2025-11-19)

## Findings

1. **Test suite runner was Windows-only**
   - `npm run test:all` invoked a `.bat` script that does not exist on Linux/macOS, so the test suite could not start outside Windows. 【F:package.json†L16-L27】
   - Added a cross-platform Node-based runner (`test-suite/run-tests-with-server.js`) that starts the dev server when needed and then launches the existing TypeScript suite. 【F:test-suite/run-tests-with-server.js†L1-L88】

2. **Member directory blocks public access even when enabled**
   - The members endpoint immediately returns `401` for anonymous users, so the directory cannot be viewed by visitors even if `tenant.settings.enableMemberDirectory` is true. 【F:app/api/tenants/[tenantId]/members/route.ts†L13-L52】
   - **Suggested fix:** allow read-only access when `enableMemberDirectory` (or visitor visibility) is enabled, while keeping authenticated checks for private tenants.

3. **Event list date filtering can throw on invalid inputs**
   - The events query builds `new Date(from)` and `new Date(to)` without validation; malformed dates will bubble up as Prisma errors. It also ignores single-bound filters (`from` *or* `to`) instead of allowing open-ended windows. 【F:app/api/tenants/[tenantId]/events/route.ts†L13-L60】
   - **Suggested fix:** validate `from`/`to` with `Date.parse`, return `400` on invalid input, and support single-bound filters for better UX.

4. **Database not provisioned in local test run**
   - Running `npm run test:all` failed with multiple Prisma `P2021` errors because the SQLite schema was missing; feature and API suites were skipped or failed. 【d5e804†L1-L55】
   - **Suggested fix:** ensure local setup instructions run `prisma migrate dev` and `npm run db:seed` before executing the suite (tracked in ticket 0004).
