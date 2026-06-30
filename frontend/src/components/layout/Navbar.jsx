import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { 
      path: '/', 
      label: 'Inicio', 
      icon: '📊',
      description: 'Resumen financiero',
      color: 'from-blue-500 to-blue-700'
    },
    { 
      path: '/transactions', 
      label: 'Día a día', 
      icon: '💸',
      description: 'Transacciones del mes',
      color: 'from-green-500 to-green-700'
    },
    { 
      path: '/budgets', 
      label: 'Gastos Fijos', 
      icon: '📋',
      description: 'Pagos recurrentes',
      color: 'from-orange-500 to-orange-700'
    },
    { 
      path: '/goals', 
      label: 'Metas', 
      icon: '🎯',
      description: 'Ahorro y objetivos',
      color: 'from-purple-500 to-purple-700'
    },
    { 
      path: '/reports', 
      label: 'Reportes', 
      icon: '📈',
      description: 'Estadísticas y gráficas',
      color: 'from-cyan-500 to-cyan-700',
      category: 'analysis'
    },
    { 
      path: '/settings', 
      label: 'Configuración', 
      icon: '⚙️',
      description: 'Tema, moneda, seguridad',
      color: 'from-indigo-500 to-indigo-700',
      category: 'account'
    }
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 relative z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍊</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">GastosApp</span>
          </Link>

          {/* Mobile menu button */}
          <div className="flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-40">
          <div className="p-4 space-y-4">
            {/* Principal Section */}
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Principal</p>
              <div className="space-y-2">
                {navLinks.filter(l => l.category !== 'analysis' && l.category !== 'account').map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      location.pathname === link.path
                        ? 'bg-gradient-to-r ' + link.color + ' text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      location.pathname === link.path ? 'bg-white/20' : 'bg-gradient-to-r ' + link.color}`}>
                      {link.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{link.label}</p>
                      {link.description && (
                        <p className="text-xs opacity-75">{link.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Analysis Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Análisis</p>
              <div className="space-y-2">
                {navLinks.filter(l => l.category === 'analysis').map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      location.pathname === link.path
                        ? 'bg-gradient-to-r ' + link.color + ' text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      location.pathname === link.path ? 'bg-white/20' : 'bg-gradient-to-r ' + link.color}`}>
                      {link.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{link.label}</p>
                      {link.description && (
                        <p className="text-xs opacity-75">{link.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Account Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Cuenta</p>
              <div className="space-y-2">
                {navLinks.filter(l => l.category === 'account').map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                      location.pathname === link.path
                        ? 'bg-gradient-to-r ' + link.color + ' text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      location.pathname === link.path ? 'bg-white/20' : 'bg-gradient-to-r ' + link.color}`}>
                      {link.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{link.label}</p>
                      {link.description && (
                        <p className="text-xs opacity-75">{link.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Info & Logout */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-3 p-2 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Usuario Demo'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || 'demo@gastos.com'}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-semibold">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
