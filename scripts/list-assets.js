const { PrismaClient } = require('@prisma/client');
const tenantId = process.argv[2];
(async ()=>{
  if(!tenantId){
    console.error('Usage: node scripts/list-assets.js <tenantId>');
    process.exit(1);
  }
  const client = new PrismaClient();
  try{
    const assets = await client.asset.findMany({ where:{ tenantId, deletedAt: null }, take: 50 });
    console.log('Assets:', assets);
  }catch(e){
    console.error('ERROR', e);
    process.exitCode = 1;
  }finally{
    await client.$disconnect();
  }
})();
