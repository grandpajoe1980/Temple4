import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      realUserId: string;
      realUserEmail?: string | null;
      realUserName?: string | null;
      impersonatedUserId?: string | null;
      impersonationActive?: boolean;
      impersonationSessionId?: string | null;
      isSuperAdmin: boolean;
    };
  }

  interface User extends DefaultUser {
    isSuperAdmin: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    realUserId: string;
    realUserEmail?: string | null;
    realUserName?: string | null;
    effectiveUserId?: string;
    effectiveUserEmail?: string | null;
    effectiveUserName?: string | null;
    impersonatedUserId?: string | null;
    impersonationSessionId?: string | null;
    isSuperAdmin: boolean;
  }
}
