/**
 * Supabase API Client Utility
 * Uses Next.js API routes instead of Edge Functions
 * All operations use Supabase directly via server-side API routes
 */

/**
 * Call a Next.js API route
 * @param {string} endpoint - API endpoint (e.g., '/api/login')
 * @param {object} options - Request options
 * @param {string} options.method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {object} options.body - Request body (will be JSON stringified)
 * @returns {Promise<object>} - Parsed JSON response
 */
async function callApi(endpoint, options = {}) {
  const { method = 'GET', body } = options;

  const fetchOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, fetchOptions);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.response = data;
    error.status = response.status;
    // Preserve validation errors array if present
    if (data.errors) {
      error.response.errors = data.errors;
    }
    throw error;
  }

  return data;
}

// Auth Functions
export const authFunctions = {
  async login({ email, password }) {
    return callApi('/api/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async register({ displayName, email, password, role = 'user', contact, idUrl }) {
    return callApi('/api/register', {
      method: 'POST',
      body: { displayName, email, password, role, contact, idUrl },
    });
  },

  async sellerRegister({ displayName, email, password, contact, idUrl }) {
    return callApi('/api/seller/register', {
      method: 'POST',
      body: { displayName, email, password, contact, idUrl, role: 'seller' },
    });
  },

  async resetPassword({ email }) {
    return callApi('/api/resetPassword', {
      method: 'POST',
      body: { email },
    });
  },

  async updatePasswordChangedAt() {
    return callApi('/api/updatePasswordChangedAt', {
      method: 'POST',
    });
  },

  async logout() {
    return callApi('/api/logout', {
      method: 'POST',
    });
  },
};

// Product Functions
export const productFunctions = {
  async getProducts() {
    return callApi('/api/getProduct');
  },

  async getProductsByCategory(category) {
    return callApi(`/api/getProductByCategory?category=${encodeURIComponent(category)}`);
  },

  async addProduct({ productName, description, price, category, idUrl, username }) {
    return callApi('/api/goods/addProduct', {
      method: 'POST',
      body: { productName, description, price, category, idUrl, username },
    });
  },

  async updateProduct({ productId, productName, description, price, category, idUrl, username }) {
    return callApi('/api/sellers/updateProduct', {
      method: 'PUT',
      body: { productId, productName, description, price, category, idUrl, username },
    });
  },

  async deleteProduct(productId, username) {
    return callApi(`/api/sellers/deleteProduct?id=${encodeURIComponent(productId)}&username=${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
  },

  async getSellerProducts(username) {
    return callApi(`/api/sellers/getProducts?username=${encodeURIComponent(username)}`);
  },
};

// Cart Functions
export const cartFunctions = {
  async addToCart({ username, productId, productName, description, price, idUrl, quantity = 1 }) {
    return callApi('/api/addToCart', {
      method: 'POST',
      body: { username, productId, productName, description, price, idUrl, quantity },
    });
  },

  async getCart(username) {
    return callApi(`/api/getCart?username=${encodeURIComponent(username)}`);
  },

  async getCartCount(username) {
    return callApi(`/api/getCartCount?username=${encodeURIComponent(username)}`);
  },

  async updateCartQuantity(itemId, action, username) {
    return callApi(`/api/updateCartQuantity?id=${encodeURIComponent(itemId)}&action=${action}&username=${encodeURIComponent(username)}`, {
      method: 'PATCH',
    });
  },

  async removeFromCart(itemId, username) {
    return callApi(`/api/removeFromCart?id=${encodeURIComponent(itemId)}&username=${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
  },
};

// Order Functions
export const orderFunctions = {
  async getOrders(username) {
    return callApi(`/api/getOrders?username=${encodeURIComponent(username)}`);
  },

  async checkout({ username, items, shipping_address_id, payment_method, delivery_option }) {
    return callApi('/api/checkout', {
      method: 'POST',
      body: { username, items, shipping_address_id, payment_method, delivery_option },
    });
  },
};

// Shipping Functions
export const shippingFunctions = {
  async getAddresses(username) {
    return callApi(`/api/shipping-addresses?username=${encodeURIComponent(username)}`);
  },

  async addAddress({ username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault }) {
    return callApi('/api/shipping-addresses', {
      method: 'POST',
      body: { username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault },
    });
  },

  async updateAddress({ id, username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault }) {
    return callApi('/api/shipping-addresses', {
      method: 'PUT',
      body: { id, username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault },
    });
  },

  async deleteAddress(id, username) {
    return callApi(`/api/shipping-addresses?id=${encodeURIComponent(id)}&username=${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
  },
};

// Admin Functions
export const adminFunctions = {
  async getUsers() {
    return callApi('/api/admin/users');
  },

  async getSellers() {
    return callApi('/api/admin/sellers');
  },

  async getPendingSellers() {
    return callApi('/api/admin/pendingSellers');
  },

  async approveSeller({ sellerId, action }) {
    return callApi('/api/admin/approveSeller', {
      method: 'POST',
      body: { sellerId, action },
    });
  },

  async getStatistics() {
    return callApi('/api/admin/statistics');
  },
};

// Utility Functions
export const utilityFunctions = {
  async trackVisit({ pagePath, visitorId, userAgent }) {
    return callApi('/api/trackVisit', {
      method: 'POST',
      body: { pagePath, visitorId, userAgent },
    });
  },
};
