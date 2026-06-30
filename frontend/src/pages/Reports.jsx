import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import reportService from '../services/report.service';
import transactionService from '../services/transaction.service';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ExportButtons from '../components/common/ExportButtons';
import ProgressBar from '../components/common/ProgressBar';
import Badge from '../components/common/Badge';
import Alert from '../components/common/Alert';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const presets = [
    { 
      label: 'Este mes', 
      getDates: () => {
        const firstDay = new Date(currentYear, currentMonth - 1, 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
        return {
          start: firstDay.toISOString().split('T')[0],
          end: lastDay.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Mes anterior', 
      getDates: () => {
        const prevMonthDate = new Date(currentYear, currentMonth - 2, 1);
        const firstDay = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 1);
        const lastDay = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0);
        return {
          start: firstDay.toISOString().split('T')[0],
          end: lastDay.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Últimos 3 meses', 
      getDates: () => {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        const firstDay = new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1);
        const lastDay = new Date(currentYear, currentMonth, 0);
        return {
          start: firstDay.toISOString().split('T')[0],
          end: lastDay.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Este año', 
      getDates: () => ({
        start: `${currentYear}-01-01`,
        end: `${currentYear}-12-31`
      })
    }
  ];

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(amount);

  const loadReportData = async () => {
    try {
      setLoading(true);
      console.log('Loading report data for:', dateRange);
      const params = dateRange.start ? { startDate: dateRange.start, endDate: dateRange.end } : {};
      const [reportRes, txRes] = await Promise.all([
        reportService.getSummary(params),
        transactionService.getAll(params)
      ]);
      
      console.log('Report response:', reportRes);
      
      const transactionsData = txRes.transactions || txRes;
      
      setReportData(reportRes);
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const preset = presets[0];
    const dates = preset.getDates();
    setDateRange(dates);
  }, []);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadReportData();
    }
  }, [dateRange]);

  const handleExportExcel = async () => {
    try {
      setLoadingExcel(true);
      await reportService.exportExcel({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
    } catch (err) {
      setError('Error al exportar Excel');
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoadingPDF(true);
      await reportService.exportPDF({
        startDate: dateRange.start,
        endDate: dateRange.end
      });
    } catch (err) {
      setError('Error al exportar PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const getMonthlyComparisonData = () => {
    if (!reportData?.monthlyComparison || reportData.monthlyComparison.length === 0) {
      return {
        labels: [''],
        datasets: [
          { label: 'Ingresos', data: [0], borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
          { label: 'Gastos', data: [0], borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 }
        ]
      };
    }
    
    return {
      labels: reportData.monthlyComparison.map((m) => m.month),
      datasets: [
        { label: 'Ingresos', data: reportData.monthlyComparison.map((m) => m.income), borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
        { label: 'Gastos', data: reportData.monthlyComparison.map((m) => m.expenses), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 }
      ]
    };
  };

  const chartData = getMonthlyComparisonData();

  return (
    <div className="space-y-6 px-4 sm:px-6 pb-24">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-center py-4 text-gray-900 dark:text-white">Mis Reportes</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={loadingExcel}
              className="px-4 py-2 rounded-xl border-2 border-green-500 text-green-600 dark:text-green-400 font-semibold hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
            >
               {loadingExcel ? 'Exportando...' : 'Excel'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loadingPDF}
              className="px-4 py-2 rounded-xl border-2 border-red-500 text-red-600 dark:text-red-400 font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
               {loadingPDF ? 'Exportando...' : 'PDF'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setDateRange(p.getDates())}
              className="px-4 py-2 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-lg"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-3xl p-6 border border-blue-200 dark:border-blue-800/30">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-gray-400">Desde</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-4 py-2 rounded-xl border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 dark:text-gray-400">Hasta</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-4 py-2 rounded-xl border-2 border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">Cargando reportes...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-4 border-l-4 border-green-500 border-blue-200 dark:border-blue-800/30">
              <p className="text-sm text-green-700 dark:text-green-300 font-semibold uppercase">Ingresos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(reportData?.totalIncome || 0)}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-4 border-l-4 border-red-500 border-blue-200 dark:border-blue-800/30">
              <p className="text-sm text-red-700 dark:text-red-300 font-semibold uppercase">Gastos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(reportData?.totalExpenses || 0)}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-4 border-l-4 border-blue-500 border-blue-200 dark:border-blue-800/30">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold uppercase">Balance</p>
              <p className="text-xl font-bold mt-1" style={{ color: (reportData?.balance || 0) >= 0 ? '#2563eb' : '#dc2626' }}>{formatCurrency(reportData?.balance || 0)}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-4 border-l-4 border-purple-500 border-blue-200 dark:border-blue-800/30">
              <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold uppercase">Tasa de Ahorro</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {(reportData?.savingsRate || 0).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-6 border border-blue-200 dark:border-blue-800/30">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tendencia Mensual</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ingresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Gastos</span>
                </div>
              </div>
              <div style={{ height: '200px' }}>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                      legend: { 
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(ctx) {
                            return `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: { 
                        grid: { display: false },
                        ticks: { color: 'rgb(107,114,128)' }
                      },
                      y: { 
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { color: 'rgb(107,114,128)' }
                      }
                    }
                  }}
                />
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-6 border border-blue-200 dark:border-blue-800/30">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Categorías de Gastos</h3>
              <div className="space-y-4">
                {!reportData?.topExpenseCategories || reportData.topExpenseCategories.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">No hay gastos en este período</p>
                ) : (
                  reportData.topExpenseCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <span className="px-4 py-1 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: cat.color }}>{cat.name}</span>
                      <div className="flex-1">
                        <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, cat.percentage)}%`, backgroundColor: cat.color }}
                          ></div>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(cat.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="text-center pt-4 text-gray-500 dark:text-gray-600 text-sm">
        <p>Creado por Javier Steven Diaz Gongora</p>
        <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
      </div>
    </div>
  );
};

export default Reports;
