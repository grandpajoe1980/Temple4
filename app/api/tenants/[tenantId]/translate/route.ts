import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { translateText, translateBatch } from '@/lib/services/translation';
import { TranslationSettings } from '@/types';

const translateSchema = z.object({
  text: z.string().min(1).max(10000).optional(),
  texts: z.array(z.string().min(1).max(10000)).max(100).optional(),
  sourceLang: z.string().length(2),
  targetLang: z.string().length(2),
}).refine(data => data.text || data.texts, {
  message: 'Either text or texts must be provided',
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check membership
    const membership = await prisma.userTenantMembership.findFirst({
      where: {
        userId: session.user.id,
        tenantId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this tenant' }, { status: 403 });
    }

    // Get tenant settings
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { settings: true },
    });

    if (!tenant?.settings?.enableTranslation) {
      return NextResponse.json(
        { error: 'Translation is not enabled for this tenant' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = translateSchema.parse(body);

    const translationSettings = tenant.settings.translationSettings as unknown as TranslationSettings | undefined;

    // Check if target language is allowed
    if (
      translationSettings?.allowedLanguages?.length &&
      !translationSettings.allowedLanguages.includes(parsed.targetLang)
    ) {
      return NextResponse.json(
        { error: `Language ${parsed.targetLang} is not enabled` },
        { status: 400 }
      );
    }

    if (parsed.text) {
      // Single text translation
      const result = await translateText(
        parsed.text,
        parsed.sourceLang,
        parsed.targetLang,
        tenantId,
        translationSettings
      );

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 429 });
      }

      return NextResponse.json({
        translation: result.translation,
        cached: result.cached,
        sourceLang: parsed.sourceLang,
        targetLang: parsed.targetLang,
      });
    } else if (parsed.texts) {
      // Batch translation
      const result = await translateBatch(
        parsed.texts,
        parsed.sourceLang,
        parsed.targetLang,
        tenantId,
        translationSettings
      );

      return NextResponse.json({
        translations: result.translations,
        errors: result.errors,
        sourceLang: parsed.sourceLang,
        targetLang: parsed.targetLang,
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Translation API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
