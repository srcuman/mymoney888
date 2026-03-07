const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '请求失败');
  }
  return response.json();
}

export const auth = {
  register: async (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: async (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => { localStorage.removeItem('token'); localStorage.removeItem('user'); },
  getCurrentUser: () => { const userStr = localStorage.getItem('user'); return userStr ? JSON.parse(userStr) : null; },
  saveUser: (user, token) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); }
};

export const books = {
  getAll: async () => apiRequest('/books'),
  create: async (data) => apiRequest('/books', { method: 'POST', body: JSON.stringify(data) })
};

export const accounts = {
  getAll: async (bookId) => apiRequest(`/books/${bookId}/accounts`),
  create: async (bookId, data) => apiRequest(`/books/${bookId}/accounts`, { method: 'POST', body: JSON.stringify(data) }),
  update: async (bookId, accountId, data) => apiRequest(`/books/${bookId}/accounts/${accountId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (bookId, accountId) => apiRequest(`/books/${bookId}/accounts/${accountId}`, { method: 'DELETE' })
};

export const categories = {
  getAll: async (bookId, type) => { const query = type ? `?type=${type}` : ''; return apiRequest(`/books/${bookId}/categories${query}`); },
  create: async (bookId, data) => apiRequest(`/books/${bookId}/categories`, { method: 'POST', body: JSON.stringify(data) })
};

export const transactions = {
  getAll: async (bookId, params = {}) => { const query = new URLSearchParams(params).toString(); return apiRequest(`/books/${bookId}/transactions${query ? '?' + query : ''}`); },
  create: async (bookId, data) => apiRequest(`/books/${bookId}/transactions`, { method: 'POST', body: JSON.stringify(data) }),
  update: async (bookId, transactionId, data) => apiRequest(`/books/${bookId}/transactions/${transactionId}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: async (bookId, transactionId) => apiRequest(`/books/${bookId}/transactions/${transactionId}`, { method: 'DELETE' })
};

export const merchants = {
  getAll: async (bookId) => apiRequest(`/books/${bookId}/merchants`),
  create: async (bookId, data) => apiRequest(`/books/${bookId}/merchants`, { method: 'POST', body: JSON.stringify(data) })
};

export const statistics = {
  getStatistics: async (bookId, params = {}) => { const query = new URLSearchParams(params).toString(); return apiRequest(`/books/${bookId}/statistics${query ? '?' + query : ''}`); }
};

export const logs = {
  getAll: async (params = {}) => { const query = new URLSearchParams(params).toString(); return apiRequest(`/logs${query ? '?' + query : ''}`); }
};

export const health = {
  check: async () => apiRequest('/health')
};