import React, { createContext, useState, useContext, useEffect } from 'react'
import currencyService from '../services/currency.service'

const CurrencyContext = createContext()

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('COP')
  const [rates, setRates] = useState({ COP: 1, USD: 0.00024, EUR: 0.00022 })
  const [loading, setLoading] = useState(false)

  const loadUserCurrency = async () => {
    try {
      const data = await currencyService.getUserCurrency()
      setCurrency(data.currency)
    } catch (error) {
      console.error('Error loading user currency:', error)
    }
  }

  const loadRates = async () => {
    try {
      const data = await currencyService.getRates()
      setRates(data.rates)
    } catch (error) {
      console.error('Error loading rates:', error)
    }
  }

  const changeCurrency = async (newCurrency) => {
    setLoading(true)
    try {
      await currencyService.updateUserCurrency(newCurrency)
      setCurrency(newCurrency)
      await loadRates()
    } catch (error) {
      console.error('Error updating currency:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amountInCOP) => {
    const rate = rates[currency] || 1
    const converted = amountInCOP * rate

    const formatters = {
      COP: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }),
      USD: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      EUR: new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    return formatters[currency].format(converted)
  }

  useEffect(() => {
    loadUserCurrency()
    loadRates()
  }, [])

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        rates,
        loading,
        formatAmount,
        changeCurrency
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
