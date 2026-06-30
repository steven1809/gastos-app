import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from '../common/Footer'
import DailyReminder from '../common/DailyReminder'

const Layout = ({ children }) => {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isDashboard = location.pathname === '/'
  const isTransactions = location.pathname === '/transactions'
  const isSettings = location.pathname === '/settings'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Layout - Sidebar */}
      <div className="hidden lg:flex min-h-screen">
        <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col relative z-40">
          {/* Logo */}
          <div className="h-20 px-6 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-3xl">🍊</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">GastosApp</span>
          </div>
          
          <Sidebar isSidebarLayout={true} />
        </div>
        
        <div className="flex-1 flex flex-col">
          <DailyReminder />
          <div className="p-0 flex-1">
            {children}
          </div>
          <Footer className="hidden md:block" />
        </div>
      </div>

      {/* Mobile & Tablet Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        <Navbar />
        <DailyReminder />
        <main className="flex-1">
          {isAdminRoute ? (
            <div className="flex">
              <Sidebar />
              <div className="flex-1 p-3 md:p-6 lg:p-8">
                {children}
              </div>
            </div>
          ) : (
            <div className="p-0">
              {children}
            </div>
          )}
        </main>
        <Footer className="hidden md:block" />
      </div>
    </div>
  )
}

export default Layout
