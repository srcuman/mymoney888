// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 通用请求函数
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

// ==================== 认证相关 API ====================

export const auth = {
  // 注册
  register: async (data) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 登录
  login: async (data) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 退出登录
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // 获取当前用户
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 保存用户信息
  saveUser: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// ==================== 账套相关 API ====================

export const books = {
  // 获取账套列表
  getAll: async () => {
    return apiRequest('/books');
  },

  // 创建账套
  create: async (data) => {
    return apiRequest('/books', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// ==================== 账户相关 API ====================

export const accounts = {
  // 获取账户列表
  getAll: async (bookId) => {
    return apiRequest(`/books/${bookId}/accounts`);
  },

  // 创建账户
  create: async (bookId, data) => {
    return apiRequest(`/books/${bookId}/accounts`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 更新账户
  update: async (bookId, accountId, data) => {
    return apiRequest(`/books/${bookId}/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // 删除账户
  delete: async (bookId, accountId) => {
    return apiRequest(`/books/${bookId}/accounts/${accountId}`, {
      method: 'DELETE'
    });
  }
};

// ==================== 分类相关 API ====================

export const categories = {
  // 获取分类列表
  getAll: async (bookId, type) => {
    const query = type ? `?type=${type}` : '';
    return apiRequest(`/books/${bookId}/categories${query}`);
  },

  // 创建分类
  create: async (bookId, data) => {
    return apiRequest(`/books/${bookId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// ==================== 交易相关 API ====================

export const transactions = {
  // 获取交易列表
  getAll: async (bookId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/books/${bookId}/transactions${query ? '?' + query : ''}`);
  },

  // 创建交易
  create: async (bookId, data) => {
    return apiRequest(`/books/${bookId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // 更新交易
  update: async (bookId, transactionId, data) => {
    return apiRequest(`/books/${bookId}/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // 删除交易
  delete: async (bookId, transactionId) => {
    return apiRequest(`/books/${bookId}/transactions/${transactionId}`, {
      method: 'DELETE'
    });
  }
};

// ==================== 商家相关 API ====================

export const merchants = {
  // 获取商家列表
  getAll: async (bookId) => {
    return apiRequest(`/books/${bookId}/merchants`);
  },

  // 创建商家
  create: async (bookId, data) => {
    return apiRequest(`/books/${bookId}/merchants`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

// ==================== 统计相关 API ====================

export const statistics = {
  // 获取收支统计
  getStatistics: async (bookId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/books/${bookId}/statistics${query ? '?' + query : ''}`);
  }
};

// ==================== 日志相关 API ====================

export const logs = {
  // 获取日志列表
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/logs${query ? '?' + query : ''}`);
  }
};

// ==================== 健康检查 API ====================

export const health = {
  check: async () => {
    return apiRequest('/health');
  }
};
