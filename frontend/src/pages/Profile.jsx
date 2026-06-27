import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Alert from '../components/common/Alert'

const Profile = () => {
  const { user } = useAuth()
  const { currency, changeCurrency, formatAmount } = useCurrency()

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>

      {message && <Alert type="success" message={message} onClose={() => setMessage(null)} />}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Personal Info */}
      <Card title="Información Personal">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-4xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.role === 'admin' 
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Currency Preferences */}
      <Card title="Moneda Preferida">
        <p className="text-gray-600 dark:text-gray-400">Selecciona tu moneda preferida : </p>
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

export default Profile
