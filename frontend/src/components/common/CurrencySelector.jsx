import React, { useState } from 'react'
import { useCurrency } from '../../context/CurrencyContext'
import LoadingSpinner from './LoadingSpinner'

const CurrencySelector = () => {
  const { currency, changeCurrency, loading } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  const currencies = [
    { code: 'COP', flag: '🇨🇴', name: 'Peso colombiano' },
    { code: 'USD', flag: '🇺🇸', name: 'Dólar americano' },
    { code: 'EUR', flag: '🇪🇺', name: 'Euro' }
  ]

  const handleSelect = async (code) => {
    await changeCurrency(code)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {loading ? (
          <LoadingSpinner size="xs" />
        ) : (
          <>
            🌍 {currency}
            <span className="text-xs">▼</span>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50">
          {currencies.map(({ code, flag, name }) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                currency === code ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-lg">{flag}</span>
              <span className="flex-1 font-medium">{code} — {name}</span>
              {currency === code && <span>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CurrencySelector
