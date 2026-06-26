import api from './api';

const goalService = {
  getAll: async (params = {}) => {
    const response = await api.get('/goals', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/goals/stats');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/goals', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },

  addContribution: async (goalId, data) => {
    const response = await api.post(`/goals/${goalId}/contributions`, data);
    return response.data;
  },

  removeContribution: async (goalId, contribId) => {
    const response = await api.delete(`/goals/${goalId}/contributions/${contribId}`);
    return response.data;
  }
};

export default goalService;
