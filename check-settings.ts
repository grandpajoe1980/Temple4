import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({
    include: { settings: true }
  });
  console.log(JSON.stringify(tenant?.settings, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
