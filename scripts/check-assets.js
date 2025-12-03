const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all tenant settings
  const settings = await prisma.tenantSettings.findMany({
    select: { tenantId: true, enableAssetManagement: true }
  });
  console.log('TenantSettings enableAssetManagement values:');
  console.log(JSON.stringify(settings, null, 2));

  // For each tenant, check what the API would see
  for (const s of settings) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: s.tenantId },
      include: { settings: true },
    });
    console.log(`\nTenant ${s.tenantId}:`);
    console.log('  settings object:', tenant?.settings ? 'exists' : 'null');
    console.log('  enableAssetManagement:', tenant?.settings?.enableAssetManagement);
    
    // Check Asset count
    const assetCount = await prisma.asset.count({ where: { tenantId: s.tenantId } });
    console.log('  Asset count:', assetCount);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
