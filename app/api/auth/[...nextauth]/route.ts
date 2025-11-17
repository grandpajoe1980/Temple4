import NextAuth, { AuthOptions, SessionStrategy } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
          include: {
            profile: true,
          },
        });

        if (user && user.password && await bcrypt.compare(credentials.password, user.password)) {
          // Return user object with required fields for NextAuth
          return {
            id: user.id,
            email: user.email,
            name: user.profile?.displayName || user.email,
            isSuperAdmin: user.isSuperAdmin,
          };
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
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.isSuperAdmin = (user as any).isSuperAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
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
