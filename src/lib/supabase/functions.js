
import { createClient } from './client';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
async function callEdgeFunction(functionName, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.');
  }
  if (!SUPABASE_ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables.');
  }
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const requestHeaders = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    ...headers,
  };
  if (session?.access_token) {
    requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
  }
  const fetchOptions = {
    method,
    headers: requestHeaders,
  };
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(url, fetchOptions);
    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to Supabase Edge Function. Please check:\n` +
        `1. Your Supabase URL is correct: ${SUPABASE_URL}\n` +
        `2. The Edge Function "${functionName}" is deployed\n` +
        `3. Your network connection is working\n` +
        `Original error: ${error.message}`
      );
    }
    throw error;
  }
}
async function callEdgeFunctionJson(functionName, options = {}) {
  let response;
  try {
    response = await callEdgeFunction(functionName, options);
  } catch (error) {
    if (error.message.includes('NEXT_PUBLIC_SUPABASE_URL') || error.message.includes('Failed to connect')) {
      throw error;
    }
    throw new Error(`Network error calling ${functionName}: ${error.message}`);
  }
  let data;
  try {
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse response from ${functionName}. The Edge Function may not be deployed or may be returning an error.`);
  }
  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.response = data;
    error.status = response.status;
    throw error;
  }
  return data;
}
export const authFunctions = {
  async login({ email, password }) {
    return callEdgeFunctionJson('auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  async register({ displayName, email, password, role = 'user', contact, idUrl }) {
    return callEdgeFunctionJson('auth/register', {
      method: 'POST',
      body: { displayName, email, password, role, contact, idUrl },
    });
  },
  async sellerRegister({ displayName, email, password, contact, idUrl }) {
    return callEdgeFunctionJson('auth/seller-register', {
      method: 'POST',
      body: { displayName, email, password, contact, idUrl, role: 'seller' },
    });
  },
  async resetPassword({ email }) {
    return callEdgeFunctionJson('auth/reset-password', {
      method: 'POST',
      body: { email },
    });
  },
  async updatePasswordChangedAt() {
    return callEdgeFunctionJson('auth/update-password-changed-at', {
      method: 'POST',
    });
  },
  async logout() {
    return callEdgeFunctionJson('auth/logout', {
      method: 'POST',
    });
  },
};
export const productFunctions = {
  async getProducts() {
    return callEdgeFunctionJson('products/get-products', {
      method: 'GET',
    });
  },
  async getProductsByCategory(category) {
    return callEdgeFunctionJson(`products/get-products-by-category?category=${encodeURIComponent(category)}`, {
      method: 'GET',
    });
  },
  async addProduct({ productName, description, price, category, idUrl, username }) {
    return callEdgeFunctionJson('products/add-product', {
      method: 'POST',
      body: { productName, description, price, category, idUrl, username },
    });
  },
  async updateProduct({ productId, productName, description, price, category, idUrl, username }) {
    return callEdgeFunctionJson('products/update-product', {
      method: 'PUT',
      body: { productId, productName, description, price, category, idUrl, username },
    });
  },
  async deleteProduct(productId, username) {
    return callEdgeFunctionJson(`products/delete-product?id=${encodeURIComponent(productId)}&username=${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
  },
  async getSellerProducts(username) {
    return callEdgeFunctionJson(`products/get-seller-products?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });
  },
};
export const cartFunctions = {
  async addToCart({ username, productId, productName, description, price, idUrl, quantity = 1 }) {
    return callEdgeFunctionJson('cart/add-to-cart', {
      method: 'POST',
      body: { username, productId, productName, description, price, idUrl, quantity },
    });
  },
  async getCart(username) {
    return callEdgeFunctionJson(`cart/get-cart?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });
  },
  async getCartCount(username) {
    return callEdgeFunctionJson(`cart/get-cart-count?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });
  },
  async updateCartQuantity(itemId, action, username) {
    return callEdgeFunctionJson(`cart/update-cart-quantity?id=${encodeURIComponent(itemId)}&action=${action}&username=${encodeURIComponent(username)}`, {
      method: 'PATCH',
    });
  },
  async removeFromCart(itemId, username) {
    return callEdgeFunctionJson(`cart/remove-from-cart?id=${encodeURIComponent(itemId)}&username=${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
  },
};
export const orderFunctions = {
  async getOrders(username) {
    return callEdgeFunctionJson(`orders/get-orders?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });
  },
  async checkout({ username, items, shipping_address_id, payment_method, delivery_option }) {
    return callEdgeFunctionJson('orders/checkout', {
      method: 'POST',
      body: { username, items, shipping_address_id, payment_method, delivery_option },
    });
  },
};
export const shippingFunctions = {
  async getAddresses(username) {
    return callEdgeFunctionJson(`shipping/shipping-addresses?username=${encodeURIComponent(username)}`, {
      method: 'GET',
    });
  },
  async addAddress({ username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault }) {
    return callEdgeFunctionJson('shipping/shipping-addresses', {
      method: 'POST',
      body: { username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault },
    });
  },
  async updateAddress({ id, username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault }) {
    return callEdgeFunctionJson('shipping/shipping-addresses', {
      method: 'PUT',
      body: { id, username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault },
    });
  },
  async deleteAddress(id, username) {
    return callEdgeFunctionJson(`shipping/shipping-addresses?id=${encodeURIComponent(id)}&username=${encodeURIComponent(username)}`, {
      method: 'DELETE',
    });
  },
};
export const adminFunctions = {
  async getUsers() {
    return callEdgeFunctionJson('admin/users', {
      method: 'GET',
    });
  },
  async getSellers() {
    return callEdgeFunctionJson('admin/sellers', {
      method: 'GET',
    });
  },
  async getPendingSellers() {
    return callEdgeFunctionJson('admin/pending-sellers', {
      method: 'GET',
    });
  },
  async approveSeller({ sellerId, action }) {
    return callEdgeFunctionJson('admin/approve-seller', {
      method: 'POST',
      body: { sellerId, action },
    });
  },
  async getStatistics() {
    return callEdgeFunctionJson('admin/statistics', {
      method: 'GET',
    });
  },
};
export const utilityFunctions = {
  async trackVisit({ pagePath, visitorId, userAgent }) {
    return callEdgeFunctionJson('utils/track-visit', {
      method: 'POST',
      body: { pagePath, visitorId, userAgent },
    });
  },
};