import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Sidebar = ({ isSidebarLayout = false }) => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!isSidebarLayout) {
    // Original admin sidebar
    const sidebarLinks = [
      { path: '/admin/users', label: 'Usuarios' },
      { path: '/admin/categories', label: 'Categorías' },
      { path: '/admin/reports', label: 'Reportes globales' }
    ]

    return (
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pt-5 pb-4">
          <div className="flex flex-col flex-grow px-4">
            <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Administración
            </h3>
            <nav className="mt-4 flex-1 space-y-1">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    location.pathname.startsWith(link.path)
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Principal Section */}
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Principal</p>
        {navLinks.filter(l => l.category !== 'analysis' && l.category !== 'account').map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all mb-1 ${
              location.pathname === link.path
                ? 'bg-gradient-to-r ' + link.color + ' text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
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

      {/* Analysis Section */}
      <div className="mb-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Análisis</p>
        {navLinks.filter(l => l.category === 'analysis').map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all mb-1 ${
              location.pathname === link.path
                ? 'bg-gradient-to-r ' + link.color + ' text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
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

      {/* Account Section */}
      <div className="mb-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Cuenta</p>
        {navLinks.filter(l => l.category === 'account').map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all mb-1 ${
              location.pathname === link.path
                ? 'bg-gradient-to-r ' + link.color + ' text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
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

      {/* User Info & Logout */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="p-2">
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
  )
}

export default Sidebar
