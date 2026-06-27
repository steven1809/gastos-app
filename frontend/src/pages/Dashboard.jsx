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

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount);

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
      text: `Falta ${formatCurrency(remaining)}`, 
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
    <div className="space-y-4 md:space-y-6">
      {/* Saludo - todo el ancho */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-4 md:p-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, {user?.name || user?.username || 'usuario'}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2 text-base md:text-lg">
          Aquí tienes el resumen de tus finanzas para {months[month - 1]} {year}
        </p>
      </div>

      {/* Selectores de mes/año - centrados */}
      <div className="flex justify-center gap-2 md:gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
          className="px-3 md:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-base min-h-[44px]"
        >
          {months.map((m, idx) => (
            <option key={idx + 1} value={idx + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="px-3 md:px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-base min-h-[44px]"
        >
          {[2023, 2024, 2025, 2026].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 dark:text-green-300 font-medium mb-1 text-sm">Total Ingresos</p>
              <p className="text-2xl md:text-3xl font-bold text-green-800 dark:text-green-200">{formatCurrency(summary?.totalIncome || 0)}</p>
            </div>
            <div className="bg-green-500 rounded-full p-2 md:p-3">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border border-red-200 dark:border-red-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-700 dark:text-red-300 font-medium mb-1 text-sm">Total Gastos</p>
              <p className="text-2xl md:text-3xl font-bold text-red-800 dark:text-red-200">{formatCurrency(summary?.totalExpenses || 0)}</p>
            </div>
            <div className="bg-red-500 rounded-full p-2 md:p-3">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border border-indigo-200 dark:border-indigo-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-700 dark:text-indigo-300 font-medium mb-1 text-sm">Balance</p>
              <p className={`text-2xl md:text-3xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(summary?.balance || 0)}</p>
            </div>
            <div className="bg-indigo-500 rounded-full p-2 md:p-3">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        {dashboardSummary.totalBudgeted > 0 && (
          <Card className={
            dashboardSummary.totalPaid >= dashboardSummary.totalBudgeted 
              ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700' 
              : dashboardSummary.totalPaid > 0 
                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200 dark:border-yellow-700' 
                : 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border border-red-200 dark:border-red-700'
          } p-4>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium mb-1 text-sm`} style={{ color: dashboardSummary.totalPaid >= dashboardSummary.totalBudgeted ? '#15803d' : dashboardSummary.totalPaid > 0 ? '#854d0e' : '#991b1c' }}>
                  {dashboardSummary.totalPaid >= dashboardSummary.totalBudgeted ? 'Todo pagado' : dashboardSummary.totalPaid > 0 ? 'Falta pagar' : 'Sin pagos'}
                </p>
                <p className="text-xl md:text-2xl font-bold" style={{ color: dashboardSummary.totalPaid >= dashboardSummary.totalBudgeted ? '#15803d' : dashboardSummary.totalPaid > 0 ? '#854d0e' : '#991b1c' }}>
                  {formatCurrency(dashboardSummary.totalPaid)} / {formatCurrency(dashboardSummary.totalBudgeted)}
                </p>
                {dashboardSummary.remaining > 0 && (
                  <p className="text-xs md:text-sm font-semibold mt-1" style={{ color: dashboardSummary.totalPaid > 0 ? '#854d0e' : '#991b1c' }}>
                    Falta: {formatCurrency(dashboardSummary.remaining)}
                  </p>
                )}
              </div>
              <div className={
                dashboardSummary.totalPaid >= dashboardSummary.totalBudgeted 
                  ? 'bg-green-500 rounded-full p-2 md:p-3' 
                  : dashboardSummary.totalPaid > 0 
                    ? 'bg-yellow-500 rounded-full p-2 md:p-3' 
                    : 'bg-red-500 rounded-full p-2 md:p-3'
              }>
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Goals Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">🎯 Progreso de Metas</h2>
          <Link to="/goals" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm">Ver todas →</Link>
        </div>

        {activeGoals.length > 0 ? (
          <div className="space-y-3">
            {activeGoals.slice(0, 3).map((goal) => {
              const percentage = Math.min(100, goal.percentage || 0);
              
              return (
                <Card key={goal.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{goal.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{goal.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{Math.round(percentage)}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${getProgressBarColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatCurrency(goal.currentAmount || 0)} guardados</span>
                    <span>{formatCurrency(goal.targetAmount)} objetivo</span>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300 mb-4">No tienes metas activas</p>
              <Link to="/goals">
                <Button>Crear tu primera meta</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Recordatorios - como cards individuales */}
      {fixedExpenses.length > 0 && (
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">📌 Recordatorios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fixedExpenses
              .sort((a, b) => a.dueDay - b.dueDay)
              .map((budget) => {
                const cat = categories.find(c => c.id === budget.categoryId) || budget.Category;
                const status = getFixedExpenseStatus(budget);
                const percentagePaid = Math.min(100, (budget.spent || 0) / budget.amount * 100);
                
                const getCardBg = () => {
                  if (percentagePaid >= 100) return 'bg-green-50 border-green-200';
                  if (percentagePaid === 0) return 'bg-red-50 border-red-200';
                  return 'bg-yellow-50 border-yellow-200';
                };
                
                return (
                  <Card key={budget.id} className={`${getCardBg()} p-4`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {cat && <Badge className="text-xs px-2 py-0.5">{cat.name}</Badge>}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                          {status.icon} {status.text}
                        </span>
                      </div>
                      <span className="text-base md:text-lg font-bold text-gray-900">{formatCurrency(budget.amount)}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          percentagePaid >= 100 ? 'bg-green-500' : 
                          percentagePaid === 0 ? 'bg-red-500' : 
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${percentagePaid}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-3">
                      <span>Pagado: {formatCurrency(budget.spent || 0)}</span>
                      {percentagePaid < 100 && (
                        <span>Falta: {formatCurrency(status.remaining)}</span>
                      )}
                    </div>
                    
                    {!status.isPaid && (
                      <Button 
                        size="sm"
                        onClick={() => handlePayFixedExpense(budget)}
                        className="w-full min-h-[44px]"
                      >
                        💳 Pagar
                      </Button>
                    )}
                    
                    {status.isPaid && (
                      <div className="text-center py-2">
                        <span className="text-green-600 font-semibold text-sm">✅ Completado</span>
                      </div>
                    )}
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card title="Gastos por Categoría">
          <div style={{ maxWidth: '400px', margin: '0 auto', height: '200px', md: { height: '300px' } }}>
            <Doughnut data={doughnutData()} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } }
            }} />
          </div>
        </Card>
        <Card title="Ingresos vs Gastos - Últimos 6 Meses">
          <div style={{ height: '200px', md: { height: '300px' } }}>
            <Bar data={barData()} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } }
            }} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card title="Transacciones Recientes" action={<Link to="/transactions" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Ver todas →</Link>}>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <span className="text-xs md:text-sm text-gray-500 w-16 md:w-24 flex-shrink-0">{tx.date}</span>
                  {tx.isGoalContribution ? (
                    <Badge color="#6366f1" className="flex-shrink-0">🎯 Meta</Badge>
                  ) : tx.Category ? (
                    <Badge color={tx.Category.color} className="flex-shrink-0">{tx.Category.name}</Badge>
                  ) : null}
                  <span className="text-gray-700 text-xs md:text-sm truncate">{tx.description}</span>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <span className={`font-semibold text-xs md:text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              </div>
            ))}
            {!recentTransactions?.length && (
              <p className="text-gray-500 text-center py-8 text-sm">No hay transacciones recientes</p>
            )}
          </div>
        </Card>

        <Card title="Estado del Presupuesto">
          <div className="space-y-3 md:space-y-4">
            {budgetStatus?.budgets?.map((budget) => {
              const percentageUsed = Math.min(100, budget.percentage_used);
              const remaining = budget.amount - (budget.spent || 0);
              
              const getStatusBg = () => {
                if (percentageUsed >= 100) return 'bg-green-100 border-green-200';
                if (percentageUsed === 0) return 'bg-red-100 border-red-200';
                return 'bg-yellow-100 border-yellow-200';
              };
              
              const getStatusIcon = () => {
                if (percentageUsed >= 100) return '✅';
                if (percentageUsed === 0) return '⚠️';
                return '💰';
              };
              
              const getStatusText = () => {
                if (percentageUsed >= 100) return 'Pagado';
                if (percentageUsed === 0) return 'Sin pagar';
                return `Falta ${formatCurrency(remaining)}`;
              };
              
              const getProgressColor = () => {
                if (percentageUsed >= 100) return 'bg-green-500';
                if (percentageUsed === 0) return 'bg-red-500';
                return 'bg-yellow-500';
              };
              
              return (
                <div key={budget.id} className={`p-3 md:p-4 rounded-lg border ${getStatusBg()}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge color={budget.Category?.color || '#6366f1'} className="text-xs">{budget.Category?.name || 'General'}</Badge>
                      <span className="text-xs md:text-sm font-semibold">{getStatusIcon()} {getStatusText()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getProgressColor()}`}
                      style={{ width: `${percentageUsed}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm mt-2">
                    <span className="text-gray-600">{formatCurrency(budget.spent || 0)} pagado</span>
                    <span className="font-medium text-gray-900">{formatCurrency(budget.amount)} total</span>
                  </div>
                  {percentageUsed < 100 && (
                    <p className="text-right text-xs text-gray-500 mt-1">Falta: {formatCurrency(remaining)}</p>
                  )}
                </div>
              );
            })}
            {!budgetStatus?.budgets?.length && (
              <p className="text-gray-500 text-center py-8 text-sm">No hay presupuestos configurados</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
