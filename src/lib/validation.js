
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

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

export function sanitizeString(input, maxLength = null) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

export function validateLength(input, minLength = 0, maxLength = Infinity) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const length = input.trim().length;
  return length >= minLength && length <= maxLength;
}

export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidSingleImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }

  if (!isValidUrl(url)) {
    return false;
  }

  const lowerUrl = url.toLowerCase();

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.pdf'];
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));

  const isSupabaseStorage = 
    lowerUrl.includes('supabase.co') ||
    lowerUrl.includes('supabase.in') ||
    lowerUrl.includes('storage/v1/object/public/') ||
    lowerUrl.includes('storage/v1/object/sign/') ||
    lowerUrl.includes('/storage/v1/object/');

  return hasImageExtension || isSupabaseStorage;
}

export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }

  // Check if it's a JSON array string
  try {
    const parsed = JSON.parse(url);
    if (Array.isArray(parsed)) {
      // Validate each URL in the array
      return parsed.length > 0 && parsed.every(item => {
        if (typeof item !== 'string' || item.trim() === '') return false;
        return isValidSingleImageUrl(item);
      });
    }
  } catch {
    // Not JSON, continue with single URL validation
  }

  // Single URL validation
  return isValidSingleImageUrl(url);
}

export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  return /^\d{7,15}$/.test(cleaned);
}

export function isValidPostalCode(postalCode) {
  if (!postalCode || typeof postalCode !== 'string') {
    return false;
  }

  return /^[A-Z0-9\s\-]{3,10}$/i.test(postalCode.trim());
}

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

export function isValidQuantity(quantity) {
  if (quantity === null || quantity === undefined) {
    return false;
  }

  const numQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;

  return Number.isInteger(numQuantity) && numQuantity > 0;
}
