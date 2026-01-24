
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('validation') || 
        message.includes('required') ||
        message.includes('invalid') ||
        message.includes('not found') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')) {
      return error.message;
    }
    return 'An error occurred. Please try again.';
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An error occurred. Please try again.';
}
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