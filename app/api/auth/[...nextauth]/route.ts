import NextAuth from 'next-auth/next';
import { AuthOptions, SessionStrategy } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { getActiveImpersonation } from '@/lib/session';
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
        token.realUserId = user.id as string;
        token.realUserEmail = user.email;
        token.realUserName = user.name;
        if ('isSuperAdmin' in user) {
          token.isSuperAdmin = Boolean((user as { isSuperAdmin?: boolean }).isSuperAdmin);
        }
      }

      const realUserId = token.realUserId || (typeof token.id === 'string' ? token.id : undefined);

      if (realUserId) {
        const activeImpersonation = await getActiveImpersonation(realUserId);

        if (activeImpersonation) {
          token.impersonationSessionId = activeImpersonation.id;
          token.impersonatedUserId = activeImpersonation.effectiveUserId;
          token.effectiveUserId = activeImpersonation.effectiveUserId;
          token.effectiveUserEmail = activeImpersonation.effectiveUser.email;
          token.effectiveUserName =
            activeImpersonation.effectiveUser.profile?.displayName || activeImpersonation.effectiveUser.email;
        } else {
          token.impersonationSessionId = null;
          token.impersonatedUserId = null;
          token.effectiveUserId = realUserId;
          token.effectiveUserEmail = token.realUserEmail || (typeof token.email === 'string' ? token.email : null);
          token.effectiveUserName = token.realUserName || (typeof token.name === 'string' ? token.name : null);
        }

        token.id = token.effectiveUserId as string;
        if (token.effectiveUserEmail) {
          token.email = token.effectiveUserEmail;
        }
        if (token.effectiveUserName) {
          token.name = token.effectiveUserName;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.effectiveUserId ?? token.id;
        session.user.realUserId = token.realUserId ?? token.effectiveUserId ?? token.id;
        session.user.email = (token.email as string) ?? null;
        session.user.name = (token.name as string) ?? null;
        session.user.realUserEmail = token.realUserEmail ?? null;
        session.user.realUserName = token.realUserName ?? session.user.name;
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
        session.user.impersonatedUserId = token.impersonatedUserId ?? null;
        session.user.impersonationActive = Boolean(token.impersonatedUserId);
        session.user.impersonationSessionId = token.impersonationSessionId ?? null;
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
