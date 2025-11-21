import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { unauthorized, forbidden } from '@/lib/api-response';

/**
 * Require that the current request is authenticated and the user is super-admin.
 * Returns `null` when allowed, otherwise returns a NextResponse (401/403) which the caller should return.
 */
export async function requireSuperAdminForApi(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return unauthorized();
  const isSuper = Boolean((session.user as any).isSuperAdmin);
  if (!isSuper) return forbidden();
  return null;
}

/**
 * Generic role checker placeholder: can be expanded to check tenant roles, etc.
 */
export async function requireRoleForApi(request: Request, check: (sessionUser: any) => boolean) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return unauthorized();
  const ok = check(session.user);
  if (!ok) return forbidden();
  return null;
}
