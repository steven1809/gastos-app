import api from './api';

const chatbotService = {
  sendMessage: async (message) => {
    const response = await api.post('/chatbot/message', { message });
    return response.data;
  }
};

export default chatbotService;
