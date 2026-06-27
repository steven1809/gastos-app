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
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Reportes</h1>
        <ExportButtons
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          loadingExcel={loadingExcel}
          loadingPDF={loadingPDF}
        />
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap mb-4">
          {presets.map((p) => (
            <Button
              key={p.label}
              variant="secondary"
              size="sm"
              onClick={() => setDateRange(p.getDates())}
              className="min-h-[44px]"
            >
              {p.label}
            </Button>
          ))}
        </div>
        
        <div className="flex flex-col gap-2 md:flex-row md:gap-3 md:items-center">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">Desde</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base min-h-[44px]"
            />
          </div>
          <span className="hidden md:inline text-gray-500 dark:text-gray-400 self-end pb-2">a</span>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 dark:text-gray-300">Hasta</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base min-h-[44px]"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">Cargando reportes...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">Total Ingresos</p>
              <p className="text-3xl font-bold text-green-800 dark:text-green-100 mt-2">{formatCurrency(reportData?.totalIncome || 0)}</p>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">Total Gastos</p>
              <p className="text-3xl font-bold text-red-800 dark:text-red-100 mt-2">{formatCurrency(reportData?.totalExpenses || 0)}</p>
            </Card>
            <Card className={`bg-gradient-to-br ${(reportData?.balance || 0) >= 0 ? 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700' : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700'} border`}>
              <p className="text-sm font-medium" style={{ color: (reportData?.balance || 0) >= 0 ? '#4f46e5' : '#b91c1c' }}>Balance</p>
              <p className="text-3xl font-bold mt-2" style={{ color: (reportData?.balance || 0) >= 0 ? '#4f46e5' : '#b91c1c' }}>{formatCurrency(reportData?.balance || 0)}</p>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Tasa de Ahorro</p>
              <p className="text-3xl font-bold text-purple-800 dark:text-purple-100 mt-2">
                {(reportData?.savingsRate || 0).toFixed(1)}%
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Tendencia Mensual">
              <div style={{ height: '200px' }}>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { intersect: false, mode: 'index' },
                    plugins: {
                      legend: { 
                        position: 'top',
                        labels: { color: 'rgb(107,114,128)' } // Gray-500, should work for both modes
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
            </Card>
            <Card title="Top Categorías de Gastos">
              <div className="space-y-4">
                {!reportData?.topExpenseCategories || reportData.topExpenseCategories.length === 0 ? (
                  <p className="text-center py-8 text-gray-500 dark:text-gray-400">No hay gastos en este período</p>
                ) : (
                  reportData.topExpenseCategories.map((cat) => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <Badge color={cat.color} className="min-w-[120px]">{cat.name}</Badge>
                      <div className="flex-1">
                        <ProgressBar percentage={cat.percentage} />
                      </div>
                      <p className="font-semibold min-w-[100px] text-right text-gray-900 dark:text-white">{formatCurrency(cat.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
