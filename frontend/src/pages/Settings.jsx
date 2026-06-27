import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { useTheme } from '../context/ThemeContext'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Alert from '../components/common/Alert'

const Settings = () => {
  const { user } = useAuth()
  const { currency, changeCurrency, formatAmount } = useCurrency()
  const { theme, toggleTheme } = useTheme()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const currencies = [
    { code: 'COP', flag: '🇨🇴', name: 'Peso Col.' },
    { code: 'USD', flag: '🇺🇸', name: 'Dólar' },
    { code: 'EUR', flag: '🇪🇺', name: 'Euro' }
  ]

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    // TODO: Implement password change API call
    setTimeout(() => {
      setMessage('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>

      {message && <Alert type="success" message={message} onClose={() => setMessage(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Theme Settings */}
      <Card title="Tema">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => theme !== 'light' && toggleTheme()}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="text-3xl mb-2">☀️</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Modo Claro</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Interfaz brillante y limpia
            </div>
          </button>

          <button
            onClick={() => theme !== 'dark' && toggleTheme()}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <div className="text-3xl mb-2">🌙</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">Modo Oscuro</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Fácil para los ojos en ambientes oscuros
            </div>
          </button>
        </div>
      </Card>

      {/* Currency Preferences */}
      <Card title="Moneda Preferida">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Selecciona tu moneda preferida:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currencies.map(({ code, flag, name }) => (
            <button
              key={code}
              onClick={() => changeCurrency(code)}
              className={`p-6 rounded-xl border-2 text-left transition-all ${
                currency === code
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="text-3xl mb-2">{flag}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">{code}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">{name}</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatAmount(1000000)}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Change Password */}
      <Card title="Cambiar Contraseña">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <div className="pt-2">
            <Button type="submit" loading={loading}>
              Actualizar Contraseña
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default Settings
