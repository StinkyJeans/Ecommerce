/**
 * Error handling utilities for Supabase Edge Functions
 */

/**
 * Sanitize error message to prevent information leakage
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Don't expose internal error details
    const message = error.message.toLowerCase();
    
    // Whitelist safe error messages
    if (message.includes('validation') || 
        message.includes('required') ||
        message.includes('invalid') ||
        message.includes('not found') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')) {
      return error.message;
    }
    
    // Generic error for unknown errors
    return 'An error occurred. Please try again.';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An error occurred. Please try again.';
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 400,
  additionalData?: Record<string, any>
): Response {
  const response: Record<string, any> = {
    success: false,
    message: sanitizeError(message),
    ...additionalData,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(
  data: any,
  message?: string,
  status: number = 200
): Response {
  const response: Record<string, any> = {
    success: true,
    ...(message && { message }),
    ...(typeof data === 'object' && !Array.isArray(data) ? data : { data }),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handle async function errors
 */
export async function handleAsyncError(
  fn: () => Promise<Response>
): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    console.error('Edge Function Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}
