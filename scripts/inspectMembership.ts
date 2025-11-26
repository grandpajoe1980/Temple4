import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = process.argv[2];
  const userIdOrEmail = process.argv[3];

  if (!tenantId || !userIdOrEmail) {
    console.error('Usage: ts-node scripts/inspectMembership.ts <tenantId> <userIdOrEmail>');
    process.exit(1);
  }

  let user: any = null;
  if (userIdOrEmail.includes('@')) {
    user = await prisma.user.findUnique({ where: { email: userIdOrEmail } });
  } else {
    user = await prisma.user.findUnique({ where: { id: userIdOrEmail } });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  console.log('Tenant:', tenant ? { id: tenant.id, slug: tenant.slug } : null);
  console.log('Tenant.permissions:', tenant?.permissions ? JSON.stringify(tenant.permissions, null, 2) : tenant?.permissions);

  if (!user) {
    console.log('User not found for', userIdOrEmail);
    process.exit(0);
  }

  console.log('User:', { id: user.id, email: user.email, isSuperAdmin: user.isSuperAdmin });

  const membership = await prisma.userTenantMembership.findFirst({ where: { tenantId, userId: user.id }, include: { roles: true } });
  console.log('Membership:', membership || 'none');

  // Also show tenant settings
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } });
  console.log('TenantSettings:', settings ? { tenantId: settings.tenantId, isPublic: settings.isPublic } : null);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
