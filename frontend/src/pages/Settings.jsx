import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import { useTheme } from '../context/ThemeContext'
import { notificationService } from '../services/notifications.service'
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationsHour, setNotificationsHour] = useState('20')

  const currencies = [
    { code: 'COP', flag: '🇨🇴', name: 'Peso colombiano' },
    { code: 'USD', flag: '🇺🇸', name: 'Dólar americano' },
    { code: 'EUR', flag: '🇪🇺', name: 'Euro' }
  ]

  const hourOptions = [
    { value: '18', label: '18:00' },
    { value: '19', label: '19:00' },
    { value: '20', label: '20:00' },
    { value: '21', label: '21:00' },
    { value: '22', label: '22:00' }
  ]

  useEffect(() => {
    const savedEnabled = localStorage.getItem('notifications_enabled')
    const savedHour = localStorage.getItem('notifications_hour')
    if (savedEnabled !== null) setNotificationsEnabled(savedEnabled === 'true')
    if (savedHour !== null) setNotificationsHour(savedHour)
  }, [])

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

  const handleNotificationsToggle = async (enabled) => {
    setNotificationsEnabled(enabled)
    localStorage.setItem('notifications_enabled', enabled.toString())
    if (enabled) {
      await notificationService.scheduleDailyReminder(parseInt(notificationsHour))
      setMessage('Recordatorios activados')
    } else {
      await notificationService.cancelAll()
      setMessage('Recordatorios desactivados')
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleHourChange = async (newHour) => {
    setNotificationsHour(newHour)
    localStorage.setItem('notifications_hour', newHour)
    if (notificationsEnabled) {
      await notificationService.scheduleDailyReminder(parseInt(newHour))
      setMessage('Hora del recordatorio actualizada')
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>

      {message && <Alert type="success" message={message} onClose={() => setMessage(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Appearance Section */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Apariencia</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all ${
                theme === 'light'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 flex items-center justify-center text-2xl">
                ☀️
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Claro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Interfaz brillante</p>
              </div>
            </button>

            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center text-2xl">
                🌙
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">Oscuro</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fácil para los ojos</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Currency Section */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Moneda preferida</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          {currencies.map(({ code, flag, name }) => (
            <button
              key={code}
              onClick={() => changeCurrency(code)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                currency === code
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xl">
                {flag}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 dark:text-white">{code}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{name}</p>
              </div>
              {currency === code && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recordatorios</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Recordatorios diarios</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Recordarme registrar mis movimientos</p>
            </div>
            <button
              onClick={() => handleNotificationsToggle(!notificationsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notificationsEnabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {notificationsEnabled && (
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Hora del recordatorio</p>
              <div className="grid grid-cols-3 gap-2">
                {hourOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleHourChange(value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      notificationsHour === value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Seguridad</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña actual <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <Button type="submit" loading={loading} className="w-full py-3">
              Guardar contraseña
            </Button>
          </form>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="pb-8">
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Zona de peligro</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-900/20 text-left">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-600 dark:text-red-400">Eliminar cuenta</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Esta acción no se puede deshacer</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
