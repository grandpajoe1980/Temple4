const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  const slug = 'springfield';
  const tenant = await prisma.tenant.findUnique({ where: { slug }, include: { settings: true } });
  if(!tenant){
    console.log('Tenant not found:', slug);
    process.exit(0);
  }
  console.log('Tenant:', tenant.name, 'slug:', tenant.slug);
  console.log('membershipApprovalMode:', tenant.settings?.membershipApprovalMode);

  const pendings = await prisma.userTenantMembership.findMany({ where: { tenantId: tenant.id, status: 'PENDING' }, include: { user: { include: { profile: true } } } });
  console.log('Pending memberships count:', pendings.length);
  for(const p of pendings){
    console.log('-', p.id, p.userId, p.user?.email, p.user?.profile?.displayName || '(no name)');
  }

  if (tenant.settings?.membershipApprovalMode === 'OPEN' && pendings.length > 0) {
    console.log('Auto-approving pending memberships because tenant is OPEN...');
    await prisma.userTenantMembership.updateMany({ where: { tenantId: tenant.id, status: 'PENDING' }, data: { status: 'APPROVED' } });
    const after = await prisma.userTenantMembership.findMany({ where: { tenantId: tenant.id, status: 'PENDING' } });
    console.log('Pending memberships after sweep:', after.length);
  }

  const approved = await prisma.userTenantMembership.findMany({ where: { tenantId: tenant.id, status: 'APPROVED' }, include: { user: { include: { profile: true } } } });
  console.log('Approved memberships count:', approved.length);
}

main().catch(e=>{ console.error(e); process.exit(1);} ).finally(()=>process.exit(0));
