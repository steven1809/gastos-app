import React, { createContext, useState, useContext, useEffect } from 'react'
import currencyService from '../services/currency.service'

const CurrencyContext = createContext()

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('COP')
  const [rates, setRates] = useState({ COP: 1, USD: 0.00024, EUR: 0.00022 })
  const [loading, setLoading] = useState(false)

  const loadUserCurrency = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const data = await currencyService.getUserCurrency()
      setCurrency(data.currency || 'COP')
    } catch (error) {
      setCurrency('COP') // default sin redirigir
    }
  }

  const loadRates = async () => {
    try {
      const data = await currencyService.getRates()
      setRates(data.rates)
    } catch (error) {
      // usar tasas aproximadas como fallback
      setRates({ COP: 1, USD: 0.00024, EUR: 0.00022 })
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

  const formatAmount = (amountInCOP, abbreviate = false) => {
    const rate = rates[currency] || 1
    const validAmount = parseFloat(amountInCOP) || 0
    const converted = validAmount * rate

    // For very large numbers, optionally abbreviate
    if (abbreviate && Math.abs(converted) >= 1000000) {
      const suffixes = ['', 'k', 'M', 'B', 'T']
      const magnitude = Math.floor(Math.log10(Math.abs(converted)) / 3)
      const scaled = converted / Math.pow(1000, magnitude)
      
      const formatters = {
        COP: (num) => `$${num.toFixed(1)}${suffixes[magnitude]}`,
        USD: (num) => `$${num.toFixed(2)}${suffixes[magnitude]}`,
        EUR: (num) => `${num.toFixed(2)}€${suffixes[magnitude]}`
      }
      return formatters[currency]?.(scaled) || formatters.COP(scaled)
    }

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
    const token = localStorage.getItem('token')
    if (!token) return // ← no llamar API sin token
    loadUserCurrency()
    loadRates()
  }, [])

  // Escuchar cambios en localStorage para cuando el usuario inicia/cierra sesión
  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem('token')
      if (token) {
        loadUserCurrency()
        loadRates()
      } else {
        setCurrency('COP')
        setRates({ COP: 1, USD: 0.00024, EUR: 0.00022 })
      }
    }
    
    window.addEventListener('storage', handleStorage)
    
    // También verificar cuando el componente se monte
    handleStorage()

    return () => window.removeEventListener('storage', handleStorage)
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
