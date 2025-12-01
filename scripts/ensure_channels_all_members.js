const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  const slug = 'springfield';
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if(!tenant){
    console.log('Tenant not found:', slug);
    process.exit(1);
  }
  console.log('Ensuring all approved members are participants in tenant channels for:', tenant.name);

  const memberships = await prisma.userTenantMembership.findMany({ where: { tenantId: tenant.id, status: 'APPROVED' }, include: { user: true } });
  const userIds = memberships.map(m => m.userId);
  console.log('Approved member count:', userIds.length);

  const channels = await prisma.conversation.findMany({ where: { tenantId: tenant.id, kind: 'CHANNEL' }, include: { participants: true, messages: true } });
  if(channels.length === 0){
    console.log('No channels found for tenant.');
    process.exit(0);
  }

  for(const ch of channels){
    console.log('Processing channel:', ch.name, ch.id);
    const existing = ch.participants.map(p => p.userId);
    const toAdd = userIds.filter(u => !existing.includes(u));
    console.log(' - existing participants:', existing.length, 'to add:', toAdd.length);
    for(const u of toAdd){
      try{
        await prisma.conversationParticipant.create({ data: { conversationId: ch.id, userId: u } });
      } catch(e){ /* ignore duplicates */ }
    }

    // post a welcome message by the first approved member
    if(userIds.length > 0){
      const author = userIds[0];
      await prisma.chatMessage.create({ data: { conversationId: ch.id, userId: author, text: `Channel ${ch.name} is now open to all members!` } });
    }

    const parts = await prisma.conversationParticipant.count({ where: { conversationId: ch.id } });
    const msgs = await prisma.chatMessage.count({ where: { conversationId: ch.id } });
    console.log(` - now participants=${parts} messages=${msgs}`);
  }

  console.log('Done.');
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>process.exit(0));
