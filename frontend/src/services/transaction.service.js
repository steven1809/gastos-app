import api from './api';

const transactionService = {
  getAll: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  getSummary: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get('/transactions/summary', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  }
};

export default transactionService;
