import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from '../common/Footer';

const Layout = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {isAdminRoute ? (
          <div className="flex">
            <Sidebar />
            <div className="flex-1 p-6 lg:p-8">
              {children}
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-8">
            {children}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
