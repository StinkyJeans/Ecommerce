/**
 * Input validation utilities
 * Provides email validation, password strength checking, input sanitization, and length validation
 */

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * @param {string} password - Password to validate
 * @returns {{valid: boolean, errors: string[]}} - Validation result with error messages
 */
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitizes string input by trimming and removing dangerous characters
 * @param {string} input - Input string to sanitize
 * @param {number} maxLength - Maximum allowed length (optional)
 * @returns {string} - Sanitized string
 */
export function sanitizeString(input, maxLength = null) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input.trim();
  
  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validates string length
 * @param {string} input - Input string to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} - True if length is valid
 */
export function validateLength(input, minLength = 0, maxLength = Infinity) {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const length = input.trim().length;
  return length >= minLength && length <= maxLength;
}

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is valid
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates image URL (must be a valid URL and end with image extension)
 * @param {string} url - Image URL to validate
 * @returns {boolean} - True if URL is a valid image URL
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  
  if (!isValidUrl(url)) {
    return false;
  }
  
  const lowerUrl = url.toLowerCase();
  
  // Check for image file extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.pdf'];
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
  
  // Check for Supabase Storage URLs (public or signed)
  const isSupabaseStorage = 
    lowerUrl.includes('supabase.co') ||
    lowerUrl.includes('supabase.in') ||
    lowerUrl.includes('storage/v1/object/public/') ||
    lowerUrl.includes('storage/v1/object/sign/') ||
    lowerUrl.includes('/storage/v1/object/');
  
  return hasImageExtension || isSupabaseStorage;
}

/**
 * Validates phone number format (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone number format is valid
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Check if it's all digits and has reasonable length (7-15 digits)
  return /^\d{7,15}$/.test(cleaned);
}

/**
 * Validates postal code format (basic validation)
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} - True if postal code format is valid
 */
export function isValidPostalCode(postalCode) {
  if (!postalCode || typeof postalCode !== 'string') {
    return false;
  }
  
  // Allow alphanumeric postal codes (3-10 characters)
  return /^[A-Z0-9\s\-]{3,10}$/i.test(postalCode.trim());
}

/**
 * Validates price format
 * @param {string|number} price - Price to validate
 * @returns {boolean} - True if price is valid
 */
export function isValidPrice(price) {
  if (price === null || price === undefined) {
    return false;
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice) || numPrice < 0) {
    return false;
  }
  
  return true;
}

/**
 * Validates quantity (must be positive integer)
 * @param {number} quantity - Quantity to validate
 * @returns {boolean} - True if quantity is valid
 */
export function isValidQuantity(quantity) {
  if (quantity === null || quantity === undefined) {
    return false;
  }
  
  const numQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
  
  return Number.isInteger(numQuantity) && numQuantity > 0;
}
