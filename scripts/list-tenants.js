const { PrismaClient } = require('@prisma/client');
(async ()=>{
  const client = new PrismaClient();
  try{
    const t = await client.tenant.findMany({ take: 10 });
    console.log('Tenants:', t);
  }catch(e){
    console.error('ERROR', e);
    process.exitCode = 1;
  }finally{
    await client.$disconnect();
  }
})();
