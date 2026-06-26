import api from './api';

const budgetService = {
  getAll: async (params = {}) => {
    const response = await api.get('/budgets', { params });
    return response.data;
  },

  getMonthlyStatus: async (month, year) => {
    const params = {};
    if (month) params.month = month;
    if (year) params.year = year;
    const response = await api.get('/budgets/status', { params });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/budgets', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/budgets/${id}`, data);
    return response.data;
  },

  remove: async (id, deleteFromHere = false) => {
    const params = {};
    if (deleteFromHere) params.deleteFromHere = true;
    const response = await api.delete(`/budgets/${id}`, { params });
    return response.data;
  }
};

export default budgetService;
