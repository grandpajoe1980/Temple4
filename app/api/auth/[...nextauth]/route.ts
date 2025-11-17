import NextAuth, { AuthOptions, SessionStrategy } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (user && user.password && await bcrypt.compare(credentials.password, user.password)) {
          // Return user object without password
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        } else {
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as SessionStrategy,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.isSuperAdmin = (user as any).isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
        if (session.user) {
            (session.user as any).id = token.id;
            (session.user as any).isSuperAdmin = token.isSuperAdmin;
        }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login', // This will be the login page
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
