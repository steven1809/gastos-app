import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const DailyReminder = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showBanner, setShowBanner] = useState(false);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const checkDismissedToday = () => {
    const today = getTodayString();
    return localStorage.getItem(`reminder_dismissed_${today}`) === 'true';
  };

  const handleDismiss = () => {
    const today = getTodayString();
    localStorage.setItem(`reminder_dismissed_${today}`, 'true');
    setShowBanner(false);
  };

  const fetchTodaySummary = async () => {
    try {
      const response = await axios.get('/api/transactions/today');
      const { hasMovements } = response.data;
      
      if (!hasMovements && !checkDismissedToday()) {
        setShowBanner(true);
      }
    } catch (error) {
      console.error('Error checking today movements:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodaySummary();
    } else {
      setShowBanner(false);
    }
  }, [isAuthenticated]);

  if (!showBanner) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">💰</span>
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            ¿Ya registraste tus movimientos de hoy?
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Lleva un control preciso de tus finanzas diarias
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/transactions')}
          className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          Registrar
        </button>
        <button
          onClick={handleDismiss}
          className="text-amber-400 hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-100 text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default DailyReminder;
