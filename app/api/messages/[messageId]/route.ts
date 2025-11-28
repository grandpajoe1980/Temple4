import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import MessageService from '@/lib/services/message-service';

// DELETE /api/messages/[messageId] - Soft delete a message
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    try {
      await MessageService.deleteMessage(userId, messageId);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg === 'not_found') return NextResponse.json({ message: 'Message not found' }, { status: 404 });
      if (msg.startsWith('forbidden') || msg === 'no_permission') return NextResponse.json({ message: 'You do not have permission to delete this message' }, { status: 403 });
      console.error(`Failed to delete message ${messageId}:`, err);
      return NextResponse.json({ message: 'Failed to delete message' }, { status: 500 });
    }
  } catch (error) {
    console.error(`Failed to delete message ${messageId}:`, error);
    return NextResponse.json({ message: 'Failed to delete message' }, { status: 500 });
  }
}
