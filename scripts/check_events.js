const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentEvents() {
    console.log('--- Checking Recent Events ---');
    try {
        const events = await prisma.event.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                startDateTime: true,
                recurrenceRule: true,
                recurrenceGroupId: true,
                createdAt: true
            }
        });

        console.log(`Found ${events.length} recent events:`);
        events.forEach(e => {
            console.log(`ID: ${e.id}`);
            console.log(`  Title: ${e.title}`);
            console.log(`  Start: ${e.startDateTime.toISOString()}`);
            console.log(`  RRule: ${e.recurrenceRule}`);
            console.log(`  GroupID: ${e.recurrenceGroupId}`);
            console.log(`  Created: ${e.createdAt.toISOString()}`);
            console.log('---');
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentEvents();
