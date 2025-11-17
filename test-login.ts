import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  const email = 'admin@temple.com';
  const password = 'password';

  console.log('Testing login for:', email);
  
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      profile: true,
    },
  });

  if (!user) {
    console.error('❌ User not found!');
    return;
  }

  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    isSuperAdmin: user.isSuperAdmin,
    hasPassword: !!user.password,
  });

  if (user.password) {
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid ? '✅ YES' : '❌ NO');
    
    // Also test with the password directly
    const testHash = await bcrypt.hash(password, 10);
    console.log('Test hash created successfully');
  } else {
    console.error('❌ User has no password set!');
  }

  await prisma.$disconnect();
}

testLogin().catch(console.error);
