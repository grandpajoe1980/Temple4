const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const u = await prisma.user.findUnique({ where: { email: 'homer@simpson.com' } });
    console.log('user=', u ? { id: u.id, email: u.email, hasPassword: !!u.password } : null);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
