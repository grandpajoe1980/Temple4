import { NextResponse } from 'next/server';
import { mcpRequest } from '../../../../lib/mcp';

// POST /api/_mcp/proxy
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await mcpRequest(payload, { retries: 2, timeoutMs: 15000 });
    return NextResponse.json(result);
  } catch (err: any) {
    const message = err?.message || String(err);
    const body = err?.body ?? null;
    return NextResponse.json({ error: message, details: body }, { status: 500 });
  }
}
