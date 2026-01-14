/**
 * Error handling utilities
 * Provides error sanitization and standardized error responses
 */

import { NextResponse } from "next/server";

/**
 * Sanitizes error messages to remove sensitive information
 * @param {Error|object|string} error - Error object or message
 * @param {boolean} isProduction - Whether we're in production mode
 * @returns {string} - Sanitized error message
 */
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
    // In development, return more detailed errors
    return errorMessage;
  }
  
  // In production, sanitize sensitive information
  let sanitized = errorMessage;
  
  // Remove file paths
  sanitized = sanitized.replace(/\/[^\s]+/g, '[path]');
  
  // Remove email addresses
  sanitized = sanitized.replace(/[^\s]+@[^\s]+/g, '[email]');
  
  // Remove potential SQL errors
  if (sanitized.toLowerCase().includes('sql') || sanitized.toLowerCase().includes('database')) {
    sanitized = 'Database error occurred';
  }
  
  // Remove stack traces
  sanitized = sanitized.split('\n')[0];
  
  // Remove internal error codes
  sanitized = sanitized.replace(/\[.*?\]/g, '');
  
  // Generic messages for common errors
  if (sanitized.includes('ENOENT') || sanitized.includes('file')) {
    sanitized = 'File operation failed';
  }
  
  if (sanitized.includes('network') || sanitized.includes('fetch')) {
    sanitized = 'Network error occurred';
  }
  
  return sanitized.trim() || 'An error occurred';
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message (will be sanitized in production)
 * @param {number} status - HTTP status code
 * @param {Error|object} error - Optional error object for logging
 * @returns {NextResponse} - Error response
 */
export function createErrorResponse(message, status = 500, error = null) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sanitizedMessage = sanitizeError(message, isProduction);
  
  // Log detailed error server-side only
  if (error && !isProduction) {
    console.error('Error details:', error);
  }
  
  const response = {
    message: sanitizedMessage,
    success: false,
  };
  
  // Only include error details in development
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

/**
 * Creates a validation error response
 * @param {string|string[]} errors - Error message(s)
 * @returns {NextResponse} - 400 Bad Request response
 */
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

/**
 * Creates an unauthorized error response
 * @param {string} message - Optional custom message
 * @returns {NextResponse} - 401 Unauthorized response
 */
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

/**
 * Creates a forbidden error response
 * @param {string} message - Optional custom message
 * @returns {NextResponse} - 403 Forbidden response
 */
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

/**
 * Handles and logs errors consistently
 * @param {Error|object|string} error - Error to handle
 * @param {string} context - Context where error occurred (e.g., 'login', 'register')
 * @returns {NextResponse} - Error response
 */
export function handleError(error, context = 'operation') {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log error with context (server-side only)
  if (!isProduction) {
    console.error(`Error in ${context}:`, error);
  }
  
  // Determine status code based on error type
  let status = 500;
  let message = 'An error occurred';
  
  if (error instanceof Error) {
    message = error.message;
    
    // Check for specific error types
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
