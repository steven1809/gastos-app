import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import transactionService from '../services/transaction.service';
import budgetService from '../services/budget.service';
import categoryService from '../services/category.service';
import goalService from '../services/goal.service';
import reportService from '../services/report.service';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Alert from '../components/common/Alert';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [categories, setCategories] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [activeGoals, setActiveGoals] = useState([]);
  
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading dashboard data for:', { month, year });
      
      const [summaryRes, budgetRes, categoryRes, goalsRes, reportRes] = await Promise.all([
        transactionService.getSummary(month, year),
        budgetService.getMonthlyStatus(month, year),
        categoryService.getAll(),
        goalService.getAll({ status: 'active' }),
        reportService.getSummary()
      ]);
      
      console.log('Summary response:', summaryRes);
      
      setSummary(summaryRes);
      setBudgetStatus(budgetRes);
      setCategories(categoryRes);
      setActiveGoals(goalsRes);
      setReportData(reportRes);
      
      // Load recent transactions
      const transactionsRes = await transactionService.getAll({ month, year, includeGoalContributions: true });
      const transactions = transactionsRes.transactions || transactionsRes;
      const sortedTransactions = [...transactions].sort(
        (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      );
      setRecentTransactions(sortedTransactions.slice(0, 5));
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [month, year]);


  const getFixedExpenseStatus = (budget) => {
    const spent = budget.spent || 0;
    const total = budget.amount;
    const percentagePaid = (spent / total) * 100;
    const remaining = total - spent;

    if (percentagePaid >= 100) {
      return { 
        text: 'Pagado', 
        color: 'bg-green-100 text-green-800', 
        icon: '✅',
        isPaid: true,
        remaining
      };
    }

    if (percentagePaid === 0) {
      return { 
        text: 'Sin pagar', 
        color: 'bg-red-100 text-red-800', 
        icon: '⚠️',
        isPaid: false,
        remaining
      };
    }

    return { 
      text: `Falta ${formatAmount(remaining)}`, 
      color: 'bg-yellow-100 text-yellow-800', 
      icon: '💰',
      isPaid: false,
      remaining
    };
  };

  const handlePayFixedExpense = (budget) => {
    const cat = categories.find(c => c.id === budget.categoryId) || budget.Category;
    navigate('/transactions', {
      state: {
        openModal: true,
        prefill: {
          categoryId: budget.categoryId,
          amount: budget.amount,
          description: `Pago de ${cat ? cat.name : 'gasto fijo'}`,
          type: 'expense'
        }
      }
    });
  };

  const doughnutData = () => {
    if (!summary?.byCategory || summary.byCategory.length === 0) {
      return { 
        labels: ['Sin gastos'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e5e7eb'],
          borderWidth: 2
        }]
      };
    }
    return {
      labels: summary.byCategory.map(c => c.categoryName),
      datasets: [
        {
          data: summary.byCategory.map(c => c.amount),
          backgroundColor: summary.byCategory.map(c => c.categoryColor || '#6366f1'),
          borderWidth: 2
        }
      ]
    };
  };

  const barData = () => {
    if (!reportData?.monthlyComparison) {
      return {
        labels: [''],
        datasets: [
          { label: 'Ingresos', data: [0], backgroundColor: '#22c55e' },
          { label: 'Gastos', data: [0], backgroundColor: '#ef4444' }
        ]
      };
    }
    return {
      labels: reportData.monthlyComparison.map(m => m.month),
      datasets: [
        {
          label: 'Ingresos',
          data: reportData.monthlyComparison.map(m => m.income),
          backgroundColor: '#22c55e'
        },
        {
          label: 'Gastos',
          data: reportData.monthlyComparison.map(m => m.expenses),
          backgroundColor: '#ef4444'
        }
      ]
    };
  };

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const getDashboardSummaryStatus = () => {
    if (!budgetStatus || !budgetStatus.budgets || budgetStatus.budgets.length === 0) {
      return { totalPaid: 0, totalBudgeted: 0, remaining: 0 };
    }
    
    const fixedBudgets = budgetStatus.budgets.filter(b => b.isFixed);
    
    let totalPaid = 0;
    let totalBudgeted = 0;
    
    fixedBudgets.forEach(budget => {
      totalPaid += (budget.spent || 0);
      totalBudgeted += budget.amount;
    });
    
    return {
      totalPaid,
      totalBudgeted,
      remaining: totalBudgeted - totalPaid
    };
  };

  const fixedExpenses = budgetStatus?.budgets?.filter(b => b.isFixed) || [];

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="lg" /></div>;
  }

  if (error) {
    return <Alert type="error" message={error} onClose={() => setError(null)} />;
  }

  const dashboardSummary = getDashboardSummaryStatus();

  const getProgressBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 space-y-4 bg-white dark:bg-gray-950 min-h-screen">
      {/* Saludo y selectores */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-2xl p-4 text-white">
        <h1 className="text-lg font-bold">
          {getGreeting()}, {user?.name || user?.username || 'usuario'}! 👋
        </h1>
        <p className="text-indigo-200 text-sm">Resumen de finanzas para {months[month - 1]} {year}</p>
        <div className="flex gap-2 mt-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-indigo-400 text-sm w-full max-w-[150px]"
          >
            {months.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-indigo-400 text-sm w-full max-w-[150px]"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas de ingresos, gastos y balance */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-500 to-green-700 dark:from-green-800 dark:to-green-900 rounded-2xl p-4 text-white shadow-md overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-green-100 dark:text-green-300 text-xs font-medium">Total Ingresos</p>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-center">{formatAmount(summary?.totalIncome || 0)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-700 dark:from-red-800 dark:to-red-900 rounded-2xl p-4 text-white shadow-md overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-red-100 dark:text-red-300 text-xs font-medium">Total Gastos</p>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-center">{formatAmount(summary?.totalExpenses || 0)}</p>
        </div>

        <div className="col-span-2 bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-800 dark:to-blue-900 rounded-2xl p-4 text-white shadow-md overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="text-blue-100 dark:text-blue-300 text-xs font-medium">Balance</p>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-center">{formatAmount(summary?.balance || 0)}</p>
        </div>
      </div>

      {/* Goals Section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">🎯 Progreso de Metas</h2>
          <Link to="/goals" className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">Ver todas →</Link>
        </div>

        {activeGoals.length > 0 ? (
          <div className="space-y-2">
            {activeGoals.slice(0, 3).map((goal) => {
              const percentage = Math.min(100, goal.percentage || 0);
              
              return (
                <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{goal.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-200 text-sm">{goal.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-gray-200 text-sm">{Math.round(percentage)}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-1">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getProgressBarColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatAmount(goal.currentAmount || 0)} guardados</span>
                    <span>{formatAmount(goal.targetAmount)} objetivo</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Gastos por categoría - Gráfico donut */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Gastos por Categoría</h2>
        <div style={{ maxWidth: '300px', margin: '0 auto', height: '200px' }}>
          <Doughnut data={doughnutData()} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { 
                display: false 
              } 
            }
          }} />
        </div>
        {(!summary?.byCategory || summary.byCategory.length === 0) && (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-2">Sin gastos</p>
        )}
      </div>

      {/* Ingresos vs Gastos - Gráfico de barras */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Ingresos vs Gastos - últimos 6 meses</h2>
        <div style={{ height: '200px' }}>
          <Bar data={barData()} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
              legend: { 
                position: 'top',
                labels: { 
                  color: theme === 'dark' ? '#e5e7eb' : '#1f2937', 
                  boxWidth: 10, 
                  padding: 8, 
                  font: { size: 10 }
                } 
              } 
            },
            scales: {
              x: {
                ticks: { color: theme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } },
                grid: { color: theme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)' }
              },
              y: {
                ticks: { color: theme === 'dark' ? '#9ca3af' : '#4b5563', font: { size: 10 } },
                grid: { color: theme === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.3)' }
              }
            }
          }} />
        </div>
      </div>

      {/* Transacciones Recientes */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Transacciones Recientes</h2>
          <Link to="/transactions" className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">Ver todas →</Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-xs text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">{tx.date}</div>
                    <div className="flex-1 min-w-0">
                      {tx.isGoalContribution ? (
                        <span className="text-xs text-gray-700 dark:text-gray-200">🎯 Meta</span>
                      ) : tx.Category ? (
                        <span className="text-xs text-gray-700 dark:text-gray-200">{tx.Category.name}</span>
                      ) : null}
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{tx.description}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span className={`font-semibold text-xs ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No hay transacciones recientes</p>
          )}
        </div>
      </div>

      {/* Estado del Presupuesto */}
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Estado del Presupuesto</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          {budgetStatus?.budgets?.length > 0 ? (
            <div className="space-y-3">
              {budgetStatus.budgets.map((budget) => {
                const percentageUsed = Math.min(100, budget.percentage_used);
                
                return (
                  <div key={budget.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{budget.Category?.name || 'General'}</span>
                      <span className="text-xs text-gray-700 dark:text-gray-300">{Math.round(percentageUsed)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${percentageUsed >= 100 ? 'bg-green-500' : percentageUsed >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${percentageUsed}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 text-sm">No hay presupuestos configurados</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
