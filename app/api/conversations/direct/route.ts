import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getOrCreateDirectConversation } from '@/lib/data';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userId = (session.user as any).id;
  const { recipientId } = await request.json();
  
  if (!recipientId) {
    return NextResponse.json({ error: 'recipientId is required' }, { status: 400 });
  }
  
  const conversation = await getOrCreateDirectConversation(userId, recipientId);
  
  return NextResponse.json(conversation);
}
