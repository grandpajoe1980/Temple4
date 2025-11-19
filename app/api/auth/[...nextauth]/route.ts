import NextAuth from 'next-auth/next';
import { AuthOptions, SessionStrategy } from 'next-auth';
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
        console.log('Authorize called with:', { email: credentials?.email });
        if (!credentials?.email || !credentials.password) {
          console.log('Missing credentials');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: {
              profile: true,
            },
          });

          console.log('User found:', user ? user.email : 'null');

          if (user && user.password) {
            const isValid = await bcrypt.compare(credentials.password, user.password);
            console.log('Password valid:', isValid);
            
            if (isValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.profile?.displayName || user.email,
                isSuperAdmin: user.isSuperAdmin,
              };
            }
          } else {
             console.log('User not found or no password');
          }
          return null;
        } catch (error) {
          console.error('Error in authorize:', error);
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
