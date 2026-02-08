import { NextResponse } from "next/server";

export function createSuccessResponse(payload, status = 200, headers = {}) {
  const body = typeof payload === "object" && payload !== null ? { success: true, ...payload } : { success: true, data: payload };
  const res = NextResponse.json(body, { status });
  Object.entries(headers).forEach(([key, value]) => res.headers.set(key, value));
  return res;
}

export function sanitizeError(error, isProduction = null) {
  const production = isProduction !== null ? isProduction : process.env.NODE_ENV === 'production';
  if (!error) {
    return 'An error occurred';
  }
  let errorMessage = '';
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error.message) {
    errorMessage = error.message;
  } else {
    errorMessage = String(error);
  }
  if (!production) {
    return errorMessage;
  }
  let sanitized = errorMessage;
  sanitized = sanitized.replace(/\/[^\s]+/g, '[path]');
  sanitized = sanitized.replace(/[^\s]+@[^\s]+/g, '[email]');
  if (sanitized.toLowerCase().includes('sql') || sanitized.toLowerCase().includes('database')) {
    sanitized = 'Database error occurred';
  }
  sanitized = sanitized.split('\n')[0];
  sanitized = sanitized.replace(/\[.*?\]/g, '');
  if (sanitized.includes('ENOENT') || sanitized.includes('file')) {
    sanitized = 'File operation failed';
  }
  if (sanitized.includes('network') || sanitized.includes('fetch')) {
    sanitized = 'Network error occurred';
  }
  return sanitized.trim() || 'An error occurred';
}
export function createErrorResponse(message, status = 500, error = null) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sanitizedMessage = sanitizeError(message, isProduction);
  if (error && !isProduction) {
    console.error('Error details:', error);
  }
  const response = {
    message: sanitizedMessage,
    success: false,
  };
  if (!isProduction && error) {
    if (error instanceof Error) {
      response.error = error.message;
      response.stack = error.stack;
    } else if (typeof error === 'object') {
      response.error = error;
    }
  }
  return NextResponse.json(response, { status });
}
export function createValidationErrorResponse(errors) {
  const errorMessages = Array.isArray(errors) ? errors : [errors];
  return NextResponse.json(
    {
      message: 'Validation failed',
      errors: errorMessages,
      success: false,
    },
    { status: 400 }
  );
}
export function createUnauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    {
      message,
      error: 'Authentication required',
      success: false,
    },
    { status: 401 }
  );
}
export function createForbiddenResponse(message = 'Forbidden') {
  return NextResponse.json(
    {
      message,
      error: 'You do not have permission to perform this action',
      success: false,
    },
    { status: 403 }
  );
}
export function handleError(error, context = 'operation') {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    console.error(`Error in ${context}:`, error);
  }
  let status = 500;
  let message = 'An error occurred';
  if (error instanceof Error) {
    message = error.message;
    if (message.includes('Unauthorized') || message.includes('authentication')) {
      status = 401;
    } else if (message.includes('Forbidden') || message.includes('permission')) {
      status = 403;
    } else if (message.includes('Not found') || message.includes('does not exist')) {
      status = 404;
    } else if (message.includes('Validation') || message.includes('invalid')) {
      status = 400;
    }
  } else if (typeof error === 'string') {
    message = error;
  }
  return createErrorResponse(message, status, error);
}