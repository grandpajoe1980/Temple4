const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main(){
  const slug = 'springfield';
  const tenant = await prisma.tenant.findUnique({ where: { slug }, include: { settings: true } });
  if(!tenant){
    console.log('Tenant not found:', slug);
    process.exit(1);
  }
  console.log('Seeding channels for tenant:', tenant.name);

  // find approved members
  const memberships = await prisma.userTenantMembership.findMany({ where: { tenantId: tenant.id, status: 'APPROVED' }, include: { user: true } });
  const userIds = memberships.map(m => m.userId);
  if(userIds.length === 0){
    console.log('No approved members found to add as participants. Aborting.');
    process.exit(1);
  }

  const channels = [
    { name: 'general', participantCount: Math.min(8, userIds.length) },
    { name: 'announcements', participantCount: Math.min(6, userIds.length) },
    { name: 'youth-group', participantCount: Math.min(6, userIds.length) },
    { name: 'staff-room', participantCount: Math.min(4, userIds.length) },
  ];

  for(const ch of channels){
    const convo = await prisma.conversation.create({ data: { tenantId: tenant.id, name: ch.name, kind: 'CHANNEL', scope: 'TENANT' } });
    console.log('Created channel', convo.id, ch.name);

    // pick first N users deterministically
    const participants = userIds.slice(0, ch.participantCount);
    for(const uid of participants){
      try {
        await prisma.conversationParticipant.create({ data: { conversationId: convo.id, userId: uid } });
      } catch (e) {
        // ignore unique constraint errors
      }
    }

    // post a few messages
    const sampleMsgs = [
      `Welcome to the ${ch.name} channel!`,
      `This is a seeded message for channel ${ch.name}.`,
      `Say hi 👋 to everyone in ${ch.name}!`
    ];

    for(let i=0;i<sampleMsgs.length;i++){
      const author = participants[i % participants.length];
      await prisma.chatMessage.create({ data: { conversationId: convo.id, userId: author, text: sampleMsgs[i] } });
    }

  }

  console.log('Seeding channels complete.');
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>process.exit(0));
