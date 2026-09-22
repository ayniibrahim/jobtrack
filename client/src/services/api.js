// Centralized API Client for JobTrack
const API_BASE = '/api';

function getHeaders(isFormData = false) {
  const headers = {};
  const token = localStorage.getItem('jobtrack_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...options.headers
    }
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request('/auth/me'),
    updateProfile: (profileData) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
    changePassword: (passwords) => request('/auth/password', { method: 'PUT', body: JSON.stringify(passwords) })
  },

  // Applications
  applications: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/applications${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/applications/${id}`),
    create: (data) => request('/applications', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/applications/${id}`, { method: 'DELETE' }),
    updateStatus: (id, payload) => request(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
    toggleArchive: (id, isArchived) => request(`/applications/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ isArchived }) }),
    getStats: () => request('/applications/stats/summary')
  },

  // Companies
  companies: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/companies${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/companies/${id}`),
    create: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/companies/${id}`, { method: 'DELETE' })
  },

  // Contacts
  contacts: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/contacts${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/contacts/${id}`),
    create: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/contacts/${id}`, { method: 'DELETE' })
  },

  // Interviews & Calendar
  interviews: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/interviews${query ? `?${query}` : ''}`);
    },
    getCalendar: () => request('/interviews/calendar'),
    getById: (id) => request(`/interviews/${id}`),
    create: (data) => request('/interviews', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/interviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/interviews/${id}`, { method: 'DELETE' })
  },

  // Documents
  documents: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/documents${query ? `?${query}` : ''}`);
    },
    upload: (formData) => request('/documents/upload', { method: 'POST', body: formData }),
    rename: (id, data) => request(`/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/documents/${id}`, { method: 'DELETE' })
  },

  // Notifications
  notifications: {
    getAll: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
    delete: (id) => request(`/notifications/${id}`, { method: 'DELETE' })
  },

  // Activities
  activities: {
    getAll: () => request('/activities'),
    clearAll: () => request('/activities', { method: 'DELETE' })
  },

  // Analytics
  analytics: {
    getMetrics: () => request('/analytics')
  },

  // Notes
  notes: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/notes${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/notes/${id}`, { method: 'DELETE' })
  },

  // Global Search
  search: {
    query: (q) => request(`/search?q=${encodeURIComponent(q)}`)
  }
};

export default api;
