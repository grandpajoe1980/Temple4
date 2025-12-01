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

  // Ensure there are 4 photos available for the tenant photos page.
  // Attach to the first tenant found; if none exists, create a lightweight tenant.
  console.log('Ensuring 4 seeded photos are present...');
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Local Seed Tenant',
        slug: 'local-seed-tenant',
        description: 'Auto-created tenant for seeded photos',
        creed: '',
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        contactEmail: 'contact@local-seed-tenant.example',
        branding: { create: { logoUrl: '', bannerImageUrl: '' } },
        settings: { create: { donationSettings: {} as any, liveStreamSettings: {} as any, visitorVisibility: {} as any } },
      },
    });
  }

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@temple.com' } });
  if (!adminUser) {
    console.warn('Admin user not found; seeded photos will use a placeholder author.');
  }

  for (let i = 1; i <= 4; i++) {
    const title = `Seed Photo ${i}`;
    const exists = await prisma.mediaItem.findFirst({ where: { tenantId: tenant.id, title } });
    if (!exists) {
      await prisma.mediaItem.create({ data: {
        tenantId: tenant.id,
        authorUserId: adminUser ? adminUser.id : (adminUser as any)?.id || '',
        type: 'PHOTO',
        title,
        description: `Seeded photo ${i}`,
        embedUrl: `/seed/photos/${tenant.slug}/photo-${i}.png`,
        storageKey: `seed/photos/${tenant.slug}/photo-${i}.png`,
        mimeType: 'image/png',
        fileSize: 0,
      } as any });
    }
  }

  console.log(`✅ Ensured 4 photos for tenant: ${tenant.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
