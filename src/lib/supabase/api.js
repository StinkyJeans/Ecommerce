import { getSigningKey, buildCanonicalRequest, signRequest } from "@/lib/signing-client";

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

  const key = getSigningKey();
  if (key && !(body && body instanceof FormData)) {
    const timestamp = Date.now().toString();
    const canonical = await buildCanonicalRequest(method, endpoint, body, timestamp);
    const signature = await signRequest(canonical, key);
    fetchOptions.headers['X-Signature'] = signature;
    fetchOptions.headers['X-Request-Timestamp'] = timestamp;
  }

  const response = await fetch(endpoint, fetchOptions);
  const contentType = response.headers.get('content-type') || '';
  let data;
  try {
    data = contentType.includes('application/json')
      ? await response.json()
      : null;
  } catch {
    if (!response.ok) {
      const error = new Error(response.status === 404 ? 'API route not found. Try restarting the dev server.' : `Request failed (${response.status})`);
      error.response = { message: error.message };
      error.status = response.status;
      throw error;
    }
    data = {};
  }
  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Request failed');
    error.response = data || {};
    error.status = response.status;
    if (data?.errors) {
      error.response.errors = data.errors;
    }
    throw error;
  }
  return data;
}
export const userFunctions = {
  async getProfile() {
    return callApi("/api/user/profile");
  },
};
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
export const productFunctions = {
  async getProducts() {
    return callApi('/api/getProduct');
  },
  async getProductsByCategory(category) {
    return callApi(`/api/getProductByCategory?category=${encodeURIComponent(category)}`);
  },
  async addProduct({ productName, description, price, category, idUrl, username, stockQuantity, isAvailable }) {
    return callApi('/api/goods/addProduct', {
      method: 'POST',
      body: { productName, description, price, category, idUrl, username, stockQuantity, isAvailable },
    });
  },
  async updateProduct({ productId, productName, description, price, category, idUrl, username, stockQuantity }) {
    return callApi('/api/sellers/updateProduct', {
      method: 'PUT',
      body: { productId, productName, description, price, category, idUrl, username, stockQuantity },
    });
  },
  async deleteProduct(productId) {
    return callApi(`/api/sellers/deleteProduct?id=${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
  },
  async getSellerProducts() {
    return callApi('/api/sellers/getProducts');
  },
  async getProductReviews(productId, options = {}) {
    const params = new URLSearchParams();
    if (options.rating != null && options.rating >= 1 && options.rating <= 5) {
      params.set("rating", String(options.rating));
    }
    const query = params.toString();
    return callApi(`/api/products/${encodeURIComponent(productId)}/reviews${query ? `?${query}` : ""}`);
  },
  async submitProductReview(productId, { rating, review_text }) {
    return callApi(`/api/products/${encodeURIComponent(productId)}/reviews`, {
      method: "POST",
      body: { rating, review_text: review_text ?? null },
    });
  },
};
export const cartFunctions = {
  async addToCart({ username, productId, productName, description, price, idUrl, quantity = 1 }) {
    return callApi('/api/addToCart', {
      method: 'POST',
      body: { username, productId, productName, description, price, idUrl, quantity },
    });
  },
  async getCart() {
    return callApi('/api/getCart');
  },
  async getCartCount() {
    return callApi('/api/getCartCount');
  },
  async updateCartQuantity(itemId, action) {
    return callApi(`/api/updateCartQuantity?id=${encodeURIComponent(itemId)}&action=${action}`, {
      method: 'PATCH',
    });
  },
  async removeFromCart(itemId) {
    return callApi(`/api/removeFromCart?id=${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    });
  },
  async clearCart() {
    return callApi('/api/clearCart', { method: 'DELETE' });
  },
};
export const orderFunctions = {
  async getOrders() {
    return callApi('/api/getOrders');
  },
  async checkout({ username, items, shipping_address_id, payment_method, delivery_option }) {
    return callApi('/api/checkout', {
      method: 'POST',
      body: { username, items, shipping_address_id, payment_method, delivery_option },
    });
  },
  async cancelOrder({ order_id, username, cancellation_reason }) {
    return callApi('/api/orders/cancel', {
      method: 'POST',
      body: { order_id, username, cancellation_reason },
    });
  },
};

export const sellerOrderFunctions = {
  async getSellerOrders(status = 'all') {
    return callApi(`/api/sellers/getOrders?status=${encodeURIComponent(status)}`);
  },
  async updateOrderStatus({ order_id, status, tracking_number }) {
    return callApi('/api/sellers/updateOrderStatus', {
      method: 'PATCH',
      body: { order_id, status, tracking_number },
    });
  },
  async getSellerOrderNotifications() {
    return callApi('/api/sellers/order-notifications');
  },
  async markSellerOrderNotificationsRead(orderIds) {
    return callApi('/api/sellers/order-notifications/read', {
      method: 'POST',
      body: orderIds && orderIds.length > 0 ? { order_ids: orderIds } : {},
    });
  },
};
export const shippingFunctions = {
  async getAddresses() {
    return callApi('/api/shipping-addresses');
  },
  async addAddress({ username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault, addressType }) {
    return callApi('/api/shipping-addresses', {
      method: 'POST',
      body: { username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault, addressType },
    });
  },
  async updateAddress({ id, username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault, addressType }) {
    return callApi('/api/shipping-addresses', {
      method: 'PUT',
      body: { id, username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault, addressType },
    });
  },
  async deleteAddress(id) {
    return callApi(`/api/shipping-addresses?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
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
export const utilityFunctions = {
  async trackVisit({ pagePath, visitorId, userAgent }) {
    return callApi('/api/trackVisit', {
      method: 'POST',
      body: { pagePath, visitorId, userAgent },
    });
  },
};

export const chatFunctions = {
  async getConversations() {
    return callApi('/api/chat/conversations');
  },
  async createConversation({ seller_username, product_id }) {
    return callApi('/api/chat/conversations', {
      method: 'POST',
      body: { seller_username, product_id: product_id || undefined },
    });
  },
  async getOrCreateConversation({ seller_username, product_id }) {
    const res = await callApi('/api/chat/conversations', {
      method: 'POST',
      body: { seller_username, product_id: product_id || undefined },
    });
    return res.conversation;
  },
  async getMessages(conversationId, { page = 1, limit = 50 } = {}) {
    return callApi(
      `/api/chat/messages?conversation_id=${encodeURIComponent(conversationId)}&page=${page}&limit=${limit}`
    );
  },
  async sendMessage(conversationId, content) {
    const res = await callApi('/api/chat/messages', {
      method: 'POST',
      body: { conversation_id: conversationId, content },
    });
    return res.message;
  },
  async markAsRead(conversationId) {
    return callApi(`/api/chat/messages/${encodeURIComponent(conversationId)}/read`, {
      method: 'PUT',
    });
  },
};
