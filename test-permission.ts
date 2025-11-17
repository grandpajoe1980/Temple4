import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPermission() {
  const userId = null; // Testing as non-authenticated user
  const tenantId = 'cmi37u3nv0014v7hczfrcrleo';
  const contentType = 'posts';

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true }
    });

    console.log('Tenant:', tenant ? 'FOUND' : 'NOT FOUND');
    console.log('Settings:', tenant?.settings ? 'FOUND' : 'NOT FOUND');

    if (!tenant || !tenant.settings) {
      console.log('Early return: no tenant or settings');
      return false;
    }

    const settings = tenant.settings as any;
    
    // Check if the entire feature is disabled
    const featureFlag = `enable${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
    console.log('Feature flag:', featureFlag, '=', settings[featureFlag]);
    
    if (!settings[featureFlag]) {
      console.log('Feature disabled');
      return false;
    }

    // No membership for non-authenticated user
    const membership = null;

    // If user is not a member, check public visibility settings
    if (!membership) {
      console.log('No membership, checking visitor visibility');
      console.log('visitorVisibility:', settings.visitorVisibility);
      console.log('Content type:', contentType);
      
      if (!settings.visitorVisibility || typeof settings.visitorVisibility !== 'object') {
        console.log('No visitor visibility settings');
        return false;
      }
      
      const result = settings.visitorVisibility[contentType] === true;
      console.log('Result:', result);
      return result;
    }

    return true;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

testPermission()
  .then(result => console.log('\nFinal result:', result))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
