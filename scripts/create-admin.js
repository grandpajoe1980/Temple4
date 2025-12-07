const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('T3mple.com', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@asembli.com' },
    update: { password: hash, isSuperAdmin: true },
    create: {
      email: 'admin@asembli.com',
      password: hash,
      isSuperAdmin: true,
      profile: { create: { displayName: 'Platform Admin' } }
    }
  });
  
  console.log('Admin created/updated:', user.email, user.id);
  await prisma.$disconnect();
}

run().catch(console.error);
