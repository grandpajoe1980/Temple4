/**
 * Standardized API Response Utilities
 * 
 * Provides consistent error handling and response formatting across all API routes.
 * Addresses todo.md Section 8.1: Standardize error responses
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard error response format
 */
export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

/**
 * Error codes for consistent client-side handling
 */
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Handles API errors and returns standardized NextResponse
 * 
 * @param error - Error object (Error, ZodError, or unknown)
 * @param context - Optional context for logging (route, userId, tenantId)
 * @returns NextResponse with appropriate status code and error message
 */
export function handleApiError(
  error: unknown,
  context?: { route?: string; userId?: string; tenantId?: string; [key: string]: string | undefined }
): NextResponse {
  // Log error with context for observability
  const logContext = context ? `[${Object.entries(context).filter(([_, v]) => v).map(([k, v]) => `${k}:${v}`).join(', ')}]` : '';
  console.error(`API Error ${logContext}:`, error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    });

    return NextResponse.json<ApiError>(
      {
        message: 'Validation failed',
        code: ApiErrorCode.VALIDATION_ERROR,
        errors: fieldErrors,
      },
      { status: 400 }
    );
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred';
    
    return NextResponse.json<ApiError>(
      {
        message,
        code: ApiErrorCode.INTERNAL_ERROR,
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  return NextResponse.json<ApiError>(
    {
      message: 'An unexpected error occurred',
      code: ApiErrorCode.INTERNAL_ERROR,
    },
    { status: 500 }
  );
}

/**
 * Returns a 401 Unauthorized response
 */
export function unauthorized(message: string = 'Not authenticated'): NextResponse {
  return NextResponse.json<ApiError>(
    {
      message,
      code: ApiErrorCode.UNAUTHORIZED,
    },
    { status: 401 }
  );
}

/**
 * Returns a 403 Forbidden response
 */
export function forbidden(message: string = 'You do not have permission to perform this action'): NextResponse {
  return NextResponse.json<ApiError>(
    {
      message,
      code: ApiErrorCode.FORBIDDEN,
    },
    { status: 403 }
  );
}

/**
 * Returns a 404 Not Found response
 */
export function notFound(resource: string = 'Resource'): NextResponse {
  return NextResponse.json<ApiError>(
    {
      message: `${resource} not found`,
      code: ApiErrorCode.NOT_FOUND,
    },
    { status: 404 }
  );
}

/**
 * Returns a 409 Conflict response
 */
export function conflict(message: string): NextResponse {
  return NextResponse.json<ApiError>(
    {
      message,
      code: ApiErrorCode.CONFLICT,
    },
    { status: 409 }
  );
}

/**
 * Returns a 400 Bad Request response for validation errors
 */
export function validationError(errors: Record<string, string[]>, message?: string): NextResponse {
  return NextResponse.json<ApiError>(
    {
      message: message || 'Validation failed',
      code: ApiErrorCode.VALIDATION_ERROR,
      errors,
    },
    { status: 400 }
  );
}

/**
 * Wraps an API handler with consistent error handling
 * 
 * Usage:
 * export const GET = withErrorHandling(async (request, { params }) => {
 *   // Your handler logic here
 *   return NextResponse.json({ data: 'success' });
 * });
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: { route?: string }
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}
