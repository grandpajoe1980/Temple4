const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEV_BCRYPT_ROUNDS = 6;

const users = [
  { email: 'ned@flanders.com', password: 'okily-dokily', name: 'Ned Flanders' },
  { email: 'homer@simpson.com', password: 'doh123', name: 'Homer J. Simpson' },
  { email: 'marge@simpson.com', password: 'bluebeehive', name: 'Marge Simpson' },
];

async function hashPassword(password) {
  return bcrypt.hash(password, DEV_BCRYPT_ROUNDS);
}

async function upsert() {
  for (const u of users) {
    const pwHash = await hashPassword(u.password);
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      await prisma.user.update({ where: { email: u.email }, data: { password: pwHash } });
      console.log('Updated password for', u.email);
    } else {
      await prisma.user.create({ data: { email: u.email, password: pwHash, profile: { create: { displayName: u.name } } } });
      console.log('Created user', u.email);
    }
  }
}

upsert()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
