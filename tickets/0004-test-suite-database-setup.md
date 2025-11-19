# 0004 - Test suite blocked by missing database schema

## Summary
Running `npm run test:all` currently fails immediately because the Prisma models are not available in the local SQLite database. The dev server returns `P2021` errors ("Table ... does not exist") for core tables like `Tenant` and `User`, preventing both the app and the automated tests from exercising any endpoints.

## Evidence
- Test runner output shows multiple `P2021` errors when fetching tenants and registering users. 【d5e804†L1-L55】

## Impact
- Comprehensive test suite cannot run locally; most feature and API suites either fail or are skipped because prerequisite data cannot be read.
- Developers get misleading failures unrelated to application logic until the schema and seed data are created.

## Proposed Fix
1. Run the migrations to create the Prisma schema: `npx prisma migrate dev` (or apply the correct migration pipeline for the environment).
2. Seed the database with the provided test data: `npm run db:seed`.
3. Re-run `npm run test:all` to confirm the suite can connect to the new tables.

## Notes
- Once the schema exists, the new cross-platform runner (`node test-suite/run-tests-with-server.js`) will start the dev server automatically before executing the suite.
