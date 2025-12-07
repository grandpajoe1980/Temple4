const { PrismaClient } = require('@prisma/client');

(async () => {
  const url = process.env.DATABASE_URL;
  console.log('Using DATABASE_URL:', url ? '[present]' : '[missing]');
  const client = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await client.$queryRawUnsafe('SELECT 1');
    console.log('OK', res);
    process.exitCode = 0;
  } catch (e) {
    console.error('TEST ERROR', e);
    process.exitCode = 1;
  } finally {
    await client.$disconnect();
  }
})();
