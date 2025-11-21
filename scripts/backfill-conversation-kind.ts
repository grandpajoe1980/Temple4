import { PrismaClient, ConversationKind, ConversationScope } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillBatch(skip: number, take: number) {
  const convs = await prisma.conversation.findMany({
    skip,
    take,
    include: { _count: { select: { participants: true } } },
    orderBy: { id: 'asc' },
  });

  if (convs.length === 0) return 0;

  for (const conv of convs) {
    try {
      let scope: ConversationScope = conv.tenantId ? 'TENANT' : 'GLOBAL';
      // Determine kind
      let kind: ConversationKind = 'GROUP';

      if (conv.isDirectMessage) {
        kind = 'DM';
      } else if (scope === 'TENANT') {
        // Prefer CHANNEL for tenant conversations with a name
        if (conv.name && conv.name.trim().length > 0) kind = 'CHANNEL';
        else kind = 'GROUP';
      } else {
        // GLOBAL: if 2 participants, consider DM
        const count = conv._count?.participants ?? 0;
        if (count === 2) kind = 'DM';
        else kind = 'GROUP';
      }

      await prisma.conversation.update({
        where: { id: conv.id },
        data: { scope, kind },
      });
    } catch (err) {
      console.error('Failed to update conversation', conv.id, err);
    }
  }

  return convs.length;
}

async function run() {
  console.log('Starting backfill of conversation.scope and conversation.kind');
  const batchSize = 200;
  let skip = 0;
  while (true) {
    const processed = await backfillBatch(skip, batchSize);
    if (!processed) break;
    console.log(`Processed ${processed} rows (skip=${skip})`);
    skip += processed;
  }

  // finished
  console.log('Backfill completed. Disconnecting.');
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
