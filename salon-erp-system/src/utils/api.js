import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request Interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response Interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?sessionExpired=true';
    }
    return Promise.reject(error);
  }
);

// // Add response interceptor to normalize responses
// api.interceptors.response.use(response => {
//   // If response.data exists and has a data property, use that
//   if (response.data && Array.isArray(response.data.data)) {
//     return { ...response, data: response.data.data };
//   }
//   // If response.data is already an array, use it directly
//   if (Array.isArray(response.data)) {
//     return response;
//   }
//   // Otherwise return the response as-is
//   return response;
// }, error => {
//   return Promise.reject(error);
// });

// Appointment API methods
const appointmentApi = {
  getAll: () => api.get('/appointments'),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
  getAvailability: (params) => api.get('/appointments/availability', { params }),
  // Add this to your appointmentApi object
getByBranch: async (branchId) => {
  const response = await axios.get(`/api/appointments/branch/${branchId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  return response;
},
};

// Transaction API methods
const transactionApi = {
  getAll: (params) => api.get('/transactions', { params })
    .then(res => res.data)
    .catch(err => {
      console.error('Error fetching transactions:', err);
      throw err;
    }),

  getById: (id) => api.get(`/transactions/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching transaction ${id}:`, err);
      throw err;
    }),

  create: (data) => api.post('/pos/transactions', data)
    .then(res => res.data)
    .catch(err => {
      console.error('Error creating transaction:', err);
      throw err;
    }),

  refund: (id) => api.post(`/transactions/${id}/refund`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error refunding transaction ${id}:`, err);
      throw err;
    }),

  exportExcel: (params) => api.get('/transactions/export/excel', { 
    params,
    responseType: 'blob'
  }).then(res => res.data),

  exportPDF: (params) => api.get('/transactions/export/pdf', { 
    params,
    responseType: 'blob'
  }).then(res => res.data),

  getReceipt: (transactionId) => api.get(`/pos/receipt/${transactionId}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching receipt for transaction ${transactionId}:`, err);
      throw err;
    }),
};

const productApi = {
  getAll: (params) => api.get('/products', { params })
    .then(res => res.data.data)
    .catch(err => {
      console.error('Error fetching products:', err);
      throw err;
    }),

  getById: (id) => api.get(`/products/${id}`)
    .then(res => res.data.data)
    .catch(err => {
      console.error(`Error fetching product ${id}:`, err);
      throw err;
    }),

  create: async (data) => {
    try {
      console.log('Creating product with data:', data);
      const response = await api.post('/products', data);
      return response.data;
    } catch (error) {
      console.error('API Create Error:', {
        config: error.config,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        },
        message: error.message,
        stack: error.stack
      });
  
      const apiError = new Error(error.response?.data?.error || 'Failed to create product');
      apiError.response = error.response;
      throw apiError;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API Error Details:', {
        config: error.config,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        },
        message: error.message,
        stack: error.stack
      });
  
      const apiError = new Error(error.response?.data?.error || 'Failed to update product');
      apiError.response = error.response;
      throw apiError;
    }
  },

  delete: (id) => api.delete(`/products/${id}`)
    .then(res => res.data.data)
    .catch(err => {
      console.error(`Error deleting product ${id}:`, err);
      throw err;
    }),

  getCategories: () => api.get('/categories')
    .then(res => res.data.data)
    .catch(err => {
      console.error('Error fetching categories:', err);
      throw err;
    }),
    
  search: (query) => api.get('/products/search', { params: { q: query } }),
  getInventory: (productId) => api.get(`/products/${productId}/inventory`),
  updateInventory: (productId, data) => api.put(`/products/${productId}/inventory`, data),
  getLowStock: () => api.get('/products/low-stock'),
  getProductHistory: (productId) => api.get(`/products/${productId}/history`),
  getStocks: (branchId) => api.get(`/branches/${branchId}/inventory`),
  updateStock: (branchId, productId, stock) => 
    api.put(`/branches/${branchId}/inventory/${productId}`, stock)
};


// Service API methods
const serviceApi = {
  getAll: () => api.get('/services'),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
};

// Employee API methods
const employeeApi = {
  getAll: () => api.get('/employees?is_active=true'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getSchedule: (id) => api.get(`/employees/${id}/schedule`),
};

// Branch API methods
const branchApi = {
  getAll: () => api.get('/branches'),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

// Customer API methods
const customerApi = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getAppointments: (id) => api.get(`/customers/${id}/appointments`),
  getSales: (id) => api.get(`/customers/${id}/sales`),
  getStaffMembers: () => api.get('/employees?is_active=true'),
  search: (query) => api.get('/customers/search', { params: { q: query } }),
  
};

// Category API methods
const categoryApi = {
  create: async (data) => {
    try {
      const response = await api.post('/categories', data);
      return response.data;
    } catch (error) {
      console.error('API Create Error:', error);
      
      const apiError = new Error(
        error.response?.data?.error || error.message || 'Failed to create category'
      );
      apiError.response = error.response;
      apiError.field = error.response?.data?.field;
      throw apiError;
    }
  },
  getAll: () => api.get('/categories')
    .then(res => res.data)
    .catch(err => {
      console.error('Error fetching categories:', err);
      throw err;
    }),

  getById: (id) => api.get(`/categories/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching category ${id}:`, err);
      throw err;
    }),

  update: async (id, data) => {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API Update Error:', error);
      
      const apiError = new Error(
        error.response?.data?.error || error.message || 'Failed to update category'
      );
      apiError.response = error.response;
      apiError.field = error.response?.data?.field;
      throw apiError;
    }
  },

  delete: (id) => api.delete(`/categories/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error deleting category ${id}:`, err);
      throw err;
    }),
};

const posApi = {
  createTransaction: (data) => api.post('/pos/transactions', data),
  getReceipt: (transactionId) => api.get(`/pos/receipt/${transactionId}`)
};

const stockApi = {
  getAll: () => api.get('/stocks').then(res => res.data),
  getByBranch: (branchId) => api.get(`/stocks/branch/${branchId}`).then(res => res.data),
  create: (data) => api.post('/stocks', data).then(res => res.data),
  update: (id, data) => api.put(`/stocks/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/stocks/${id}`).then(res => res.data),
  requestRestock: (stockId, branchId, quantity) => 
    api.post('/stocks/restock-requests', { stockId, branchId, quantity }).then(res => res.data),
  getRestockRequests: () => api.get('/stocks/restock-requests/pending').then(res => res.data),
  confirmRestock: (requestId) => api.put(`/stocks/restock-requests/${requestId}/confirm`).then(res => res.data),
  getProducts: () => api.get('/products').then(res => res.data),
  getBranches: () => api.get('/branches').then(res => res.data),
  createRestockRequest: async (data) => {
    const response = await axios.post("/api/restock-requests", data);
    return response.data;
  },
};

const feedbackApi = {
  getAll: (params = {}) => axios.get('/api/feedbacks', { params }),
};


// Role API methods
const roleApi = {
  getAll: () => api.get('/roles')
    .then(res => res.data)
    .catch(err => {
      console.error('Error fetching roles:', err);
      throw err;
    }),

  getById: (id) => api.get(`/roles/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching role ${id}:`, err);
      throw err;
    }),

  create: async (data) => {
    try {
      const response = await api.post('/roles', data);
      return response.data;
    } catch (error) {
      console.error('API Create Error:', {
        config: error.config,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        },
        message: error.message,
        stack: error.stack
      });
  
      const apiError = new Error(error.response?.data?.error || 'Failed to create role');
      apiError.response = error.response;
      throw apiError;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/roles/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API Update Error:', {
        config: error.config,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        },
        message: error.message,
        stack: error.stack
      });
  
      const apiError = new Error(error.response?.data?.error || 'Failed to update role');
      apiError.response = error.response;
      throw apiError;
    }
  },

  delete: (id) => api.delete(`/roles/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error deleting role ${id}:`, err);
      throw err;
    }),

  getPermissions: (roleId) => api.get(`/roles/${roleId}/permissions`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching permissions for role ${roleId}:`, err);
      throw err;
    }),

  addPermission: (roleId, permissionId) => 
    api.post(`/roles/${roleId}/permissions`, { permission_id: permissionId })
    .then(res => res.data)
    .catch(err => {
      console.error(`Error adding permission to role ${roleId}:`, err);
      throw err;
    }),

  removePermission: (roleId, permissionId) => 
    api.delete(`/roles/${roleId}/permissions/${permissionId}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error removing permission from role ${roleId}:`, err);
      throw err;
    }),

  getUsersWithRole: (roleId) => api.get(`/roles/${roleId}/users`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching users with role ${roleId}:`, err);
      throw err;
    })
};

// Permission API methods
const permissionApi = {
  getAll: () => api.get('/permissions')
    .then(res => res.data)
    .catch(err => {
      console.error('Error fetching permissions:', err);
      throw err;
    }),

  getById: (id) => api.get(`/permissions/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching permission ${id}:`, err);
      throw err;
    }),

  create: (data) => api.post('/permissions', data)
    .then(res => res.data)
    .catch(err => {
      console.error('Error creating permission:', err);
      throw err;
    }),

  update: (id, data) => api.put(`/permissions/${id}`, data)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error updating permission ${id}:`, err);
      throw err;
    }),

  delete: (id) => api.delete(`/permissions/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error deleting permission ${id}:`, err);
      throw err;
    }),

  getRolesWithPermission: (permissionId) => api.get(`/permissions/${permissionId}/roles`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching roles with permission ${permissionId}:`, err);
      throw err;
    })
};

// User API methods
const userApi = {
  getAll: (params = {}) => api.get('/users', { params })
    .then(res => res.data)
    .catch(err => {
      console.error('Error fetching users:', err);
      throw err;
    }),

  getById: (id) => api.get(`/users/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error fetching user ${id}:`, err);
      throw err;
    }),

  create: async (data) => {
    try {
      const response = await api.post('/users', data);
      return response.data;
    } catch (error) {
      console.error('API Create Error:', {
        config: error.config,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        },
        message: error.message,
        stack: error.stack
      });
  
      const apiError = new Error(error.response?.data?.error || 'Failed to create user');
      apiError.response = error.response;
      apiError.field = error.response?.data?.field;
      throw apiError;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('API Update Error:', {
        config: error.config,
        response: {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        },
        message: error.message,
        stack: error.stack
      });
  
      const apiError = new Error(error.response?.data?.error || 'Failed to update user');
      apiError.response = error.response;
      apiError.field = error.response?.data?.field;
      throw apiError;
    }
  },

  delete: (id) => api.delete(`/users/${id}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error deleting user ${id}:`, err);
      throw err;
    }),

  // Specialized user endpoints
  updateStatus: (id, is_active) => api.patch(`/users/${id}/status`, { is_active })
    .then(res => res.data)
    .catch(err => {
      console.error(`Error updating user ${id} status:`, err);
      throw err;
    }),

  updatePassword: (id, currentPassword, newPassword) => 
    api.patch(`/users/${id}/password`, { currentPassword, newPassword })
    .then(res => res.data)
    .catch(err => {
      console.error(`Error updating user ${id} password:`, err);
      throw err;
    }),

  resetPassword: (email) => api.post('/users/reset-password', { email })
    .then(res => res.data)
    .catch(err => {
      console.error('Error requesting password reset:', err);
      throw err;
    }),

  verifyEmail: (token) => api.post('/users/verify-email', { token })
    .then(res => res.data)
    .catch(err => {
      console.error('Error verifying email:', err);
      throw err;
    }),

  getCurrentUser: () => api.get('/users/me')
    .then(res => res.data)
    .catch(err => {
      console.error('Error fetching current user:', err);
      throw err;
    }),

  // Role management
  assignRole: (userId, roleId) => api.post(`/users/${userId}/roles`, { role_id: roleId })
    .then(res => res.data)
    .catch(err => {
      console.error(`Error assigning role to user ${userId}:`, err);
      throw err;
    }),

  removeRole: (userId, roleId) => api.delete(`/users/${userId}/roles/${roleId}`)
    .then(res => res.data)
    .catch(err => {
      console.error(`Error removing role from user ${userId}:`, err);
      throw err;
    }),

  // Branch management
  assignBranch: (userId, branchId) => api.post(`/users/${userId}/branches`, { branch_id: branchId })
    .then(res => res.data)
    .catch(err => {
      console.error(`Error assigning branch to user ${userId}:`, err);
      throw err;
    }),

  // Search and filtering
  search: (query) => api.get('/users/search', { params: { q: query } })
    .then(res => res.data)
    .catch(err => {
      console.error('Error searching users:', err);
      throw err;
    }),

  // Bulk operations
  bulkUpdateStatus: (userIds, is_active) => api.patch('/users/bulk-status', { userIds, is_active })
    .then(res => res.data)
    .catch(err => {
      console.error('Error bulk updating user status:', err);
      throw err;
    }),

  // Export
  exportToCSV: (params) => api.get('/users/export/csv', { 
    params,
    responseType: 'blob'
  }).then(res => res.data),

  exportToExcel: (params) => api.get('/users/export/excel', { 
    params,
    responseType: 'blob'
  }).then(res => res.data)
};


// In your api.js file
const dashboardApi = {
  getDashboardData: async (userId, role) => {
    try {
      // First try the role-specific endpoint
      let response;
      try {
        response = await api.get(`/dashboard/${role.toLowerCase()}`, {
          params: { userId }
        });
      } catch (roleError) {
        // Fallback to generic endpoint if role-specific fails
        console.log('Role-specific endpoint not found, trying generic endpoint');
        response = await api.get('/dashboard', {
          params: { userId, role }
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', {
        config: error.config,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  
},

  // Admin specific methods
  getAdminStats: async () => {
    const response = await api.get('/dashboard/admin-stats');
    return response.data;
  },

  // Accountant specific methods
  getFinancialData: async () => {
    const response = await api.get('/dashboard/financials');
    return response.data;
  },

  getRevenueTrends: async () => {
    const response = await api.get('/dashboard/revenue-trends');
    return response.data;
  },

  // Branch Manager specific methods
  getBranchStats: async (branchId) => {
    const response = await api.get(`/dashboard/branch-stats/${branchId}`);
    return response.data;
  },

  getStaffPerformance: async (branchId) => {
    const response = await api.get(`/dashboard/staff-performance/${branchId}`);
    return response.data;
  },

  // Receptionist specific methods
  getTodaysAppointments: async (branchId) => {
    const response = await api.get(`/dashboard/todays-appointments/${branchId}`);
    return response.data;
  },

  getClientStats: async (branchId) => {
    const response = await api.get(`/dashboard/client-stats/${branchId}`);
    return response.data;
  },

  // Shared methods
  getRecentFeedback: async () => {
    const response = await api.get('/dashboard/recent-feedback');
    return response.data;
  },

  getInventoryAlerts: async () => {
    const response = await api.get('/dashboard/inventory-alerts');
    return response.data;
  }
};

export {
  api as default,
  appointmentApi,
  transactionApi,
  serviceApi,
  employeeApi,
  branchApi,
  customerApi,
  productApi,
  categoryApi,
  posApi, 
  stockApi,
  feedbackApi,
  roleApi,
  userApi,
  permissionApi,
  dashboardApi
};