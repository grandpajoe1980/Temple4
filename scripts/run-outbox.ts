import { startOutboxWorker } from '../lib/outbox';

console.log('Starting Outbox worker...');
const stop = startOutboxWorker({ intervalMs: 3000 });

process.on('SIGINT', () => {
  console.log('Stopping Outbox worker...');
  stop();
  process.exit(0);
});
