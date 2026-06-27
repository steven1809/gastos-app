import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const sidebarLinks = [
    { path: '/admin/users', label: 'Usuarios' },
    { path: '/admin/categories', label: 'Categorías' },
    { path: '/admin/reports', label: 'Reportes globales' }
  ];

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
  );
};

export default Sidebar;
