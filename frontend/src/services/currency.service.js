import api from './api'

const currencyService = {
  getRates: async () => {
    const response = await api.get('/currency/rates')
    return response.data
  },

  getUserCurrency: async () => {
    const response = await api.get('/currency/user')
    return response.data
  },

  updateUserCurrency: async (currency) => {
    const response = await api.put('/currency/user', { currency })
    return response.data
  },

  convertAmount: async (amount, fromCurrency, toCurrency) => {
    const response = await api.post('/currency/convert', {
      amount,
      fromCurrency,
      toCurrency
    })
    return response.data
  }
}

export default currencyService
