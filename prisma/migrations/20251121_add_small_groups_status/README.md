This migration is a placeholder instructing the developer to run `npx prisma migrate dev --name add_small_groups_status`.

Because enums and model changes were made to `schema.prisma`, the preferred approach is to run the Prisma CLI locally to generate the correct SQL migration for your database provider.

Steps:
1. Ensure `schema.prisma` is updated and saved.
2. Run:

   ```pwsh
   npx prisma migrate dev --name add_small_groups_status
   ```

3. Commit the generated migration files and run `npx prisma generate` if needed.
