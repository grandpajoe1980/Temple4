import { NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from './api-response';

const requestHistory = new Map<string, number[]>();

export function enforceRateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): NextResponse | null {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const timestamps = (requestHistory.get(key) || []).filter((ts) => ts > windowStart);

  if (timestamps.length >= options.limit) {
    return NextResponse.json<ApiError>(
      {
        message: 'Too many requests. Please try again later.',
        code: ApiErrorCode.FORBIDDEN,
      },
      { status: 429 }
    );
  }

  timestamps.push(now);
  requestHistory.set(key, timestamps);

  return null;
}
