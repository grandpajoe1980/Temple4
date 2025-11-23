import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting clean database seed...');

  const adminPassword = await bcrypt.hash('password', 10);
  await prisma.user.upsert({
    where: { email: 'admin@temple.com' },
    update: {},
    create: {
      email: 'admin@temple.com',
      password: adminPassword,
      isSuperAdmin: true,
      profile: { create: { displayName: 'Platform Administrator' } },
    },
  });

  console.log('✅ Platform Administrator ensured: admin@temple.com (password: password)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
