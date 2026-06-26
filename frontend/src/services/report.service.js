import api from './api';

const reportService = {
  getSummary: async (params = {}) => {
    const response = await api.get('/reports/summary', { params });
    return response.data;
  },

  exportExcel: async (params = {}) => {
    const response = await api.get('/reports/export/excel', {
      params,
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_gastos_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportPDF: async (params = {}) => {
    const response = await api.get('/reports/export/pdf', {
      params,
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_gastos_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default reportService;
