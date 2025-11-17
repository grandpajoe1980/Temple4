import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'springfield-church' },
    include: { settings: true }
  });
  
  console.log('Tenant ID:', tenant?.id);
  console.log('Tenant Settings:', JSON.stringify(tenant?.settings, null, 2));
}

main().then(() => prisma.$disconnect());
