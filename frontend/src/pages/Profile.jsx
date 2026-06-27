import React from 'react'
import { useAuth } from '../context/AuthContext'
import Card from '../components/common/Card'

const Profile = () => {
  const { user } = useAuth()

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>

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
    </div>
  )
}

export default Profile
