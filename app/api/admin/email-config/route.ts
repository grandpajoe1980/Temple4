import { withErrorHandling } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requireSuperAdminForApi } from '@/lib/middleware/requireRole';

export const GET = withErrorHandling(async (req) => {
  const authCheck = await requireSuperAdminForApi(req as any);
  if (authCheck) return authCheck;

  const config = await prisma.emailProviderConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
  return NextResponse.json({ data: config || null });
});

export const POST = withErrorHandling(async (req) => {
  const authCheck = await requireSuperAdminForApi(req as any);
  if (authCheck) return authCheck;

  const body = await req.json();
  if (!body?.provider || !body?.settings) return NextResponse.json({ message: 'provider and settings required' }, { status: 400 });

  // create or update latest
  const created = await prisma.emailProviderConfig.create({ data: { provider: body.provider, settings: body.settings } });
  return NextResponse.json({ data: { id: created.id } });
});
