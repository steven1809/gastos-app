import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import budgetService from '../services/budget.service';
import transactionService from '../services/transaction.service';
import categoryService from '../services/category.service';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';
import Badge from '../components/common/Badge';
import ProgressBar from '../components/common/ProgressBar';
import MonthPicker from '../components/common/MonthPicker';
import CategorySelect from '../components/common/CategorySelect';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const formatNumber = (num) => {
  if (!num && num !== 0) return '';
  const number = parseFloat(num.toString().replace(/\./g, ''));
  if (isNaN(number)) return '';
  return number.toLocaleString('es-CO');
};

const parseNumber = (str) => {
  return parseFloat(str.replace(/\./g, ''));
};

const getMonthName = (month) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month - 1];
};

const Budgets = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState(null);
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [deleteFromHere, setDeleteFromHere] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    startMonth: selectedMonth,
    startYear: selectedYear,
    durationMonths: 1,
    amount: '',
    isFixed: false,
    dueDay: ''
  });
  const [displayAmount, setDisplayAmount] = useState('');



  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetData, catData] = await Promise.all([
        budgetService.getMonthlyStatus(selectedMonth, selectedYear),
        categoryService.getAll('expense')
      ]);
      setBudgets(budgetData.budgets || []);
      setStatus(budgetData);
      setCategories(catData);
    } catch (err) {
      setError('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const handleOpenModal = (budget = null) => {
    setEditingBudget(budget);
    if (budget) {
      setFormData({
        categoryId: budget.categoryId ? Number(budget.categoryId) : '',
        startMonth: budget.month,
        startYear: budget.year,
        durationMonths: 1,
        amount: budget.amount,
        isFixed: budget.isFixed || false,
        dueDay: budget.dueDay || ''
      });
      setDisplayAmount(formatNumber(budget.amount));
    } else {
      setFormData({
        categoryId: '',
        startMonth: selectedMonth,
        startYear: selectedYear,
        durationMonths: 1,
        amount: '',
        isFixed: false,
        dueDay: ''
      });
      setDisplayAmount('');
    }
    setModalOpen(true);
  };

  // Sincronizar formData cuando cambia selectedMonth o selectedYear y no hay editingBudget
  useEffect(() => {
    if (!editingBudget && !modalOpen) {
      setFormData(prev => ({
        ...prev,
        startMonth: selectedMonth,
        startYear: selectedYear
      }));
    }
  }, [selectedMonth, selectedYear, editingBudget, modalOpen]);

  const handleSaveBudget = async () => {
    try {
      const dataToSend = {
        categoryId: formData.categoryId,
        startMonth: Number(formData.startMonth),
        startYear: Number(formData.startYear),
        durationMonths: Number(formData.durationMonths),
        amount: Number(formData.amount),
        isFixed: formData.isFixed,
        dueDay: formData.isFixed ? Number(formData.dueDay) : null
      };
      
      console.log('=== Sending budget data ===');
      console.log(dataToSend);
      
      if (editingBudget) {
        // Para edición solo actualizamos el presupuesto actual
        await budgetService.update(editingBudget.id, {
          amount: dataToSend.amount,
          isFixed: dataToSend.isFixed,
          dueDay: dataToSend.dueDay
        });
        setSuccessMessage('Presupuesto actualizado');
      } else {
        await budgetService.create(dataToSend);
        setSuccessMessage('Presupuestos creados');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving budget:', err.response?.data || err);
      
      // Manejar errores de validación
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        const errorMessages = err.response.data.errors.map(e => e.msg).join(', ');
        setError(errorMessages);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al guardar presupuesto');
      }
    }
  };

  const handleDeleteBudget = async () => {
    try {
      const result = await budgetService.remove(budgetToDelete.id, deleteFromHere);
      setSuccessMessage(result.message || 'Presupuesto eliminado');
      setDeleteModalOpen(false);
      setDeleteFromHere(false);
      loadData();
    } catch (err) {
      setError('Error al eliminar presupuesto');
    }
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

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const onlyDigits = value.replace(/[^0-9]/g, '');
    setDisplayAmount(formatNumber(onlyDigits));
    setFormData(prev => ({ ...prev, amount: onlyDigits }));
  };

  const getOverallStatus = () => {
    if (!status || !status.budgets || status.budgets.length === 0) {
      return { text: 'Bajo control', icon: '✅', bg: 'bg-green-100 dark:bg-green-900/30', totalPaid: 0, totalBudgeted: 0, remaining: 0 };
    }
    
    // Filtramos solo presupuestos fijos
    const fixedBudgets = status.budgets.filter(b => b.isFixed);
    
    if (fixedBudgets.length === 0) {
      const totalPaid = parseFloat(status.totalSpent) || 0;
      const totalBudgeted = parseFloat(status.totalBudgeted) || 0;
      return { 
        text: '✅ Bajo control', 
        icon: '✅', 
        bg: 'bg-green-100 dark:bg-green-900/30',
        totalPaid,
        totalBudgeted,
        remaining: totalBudgeted - totalPaid
      };
    }
    
    // Calculamos totales de pagos
    let totalPaid = 0;
    let totalBudgeted = 0;
    let allPaid = true;
    let anyPaid = false;
    
    fixedBudgets.forEach(budget => {
      const paid = parseFloat(budget.spent) || 0;
      const amount = parseFloat(budget.amount) || 0;
      totalPaid += paid;
      totalBudgeted += amount;
      
      if (paid < amount) {
        allPaid = false;
      }
      if (paid > 0) {
        anyPaid = true;
      }
    });
    
    const remaining = totalBudgeted - totalPaid;
    
    // Determinamos el estado
    if (allPaid) {
      // Todos los pagos completados
      return { 
        text: '✅ Todo pagado', 
        icon: '✅', 
        bg: 'bg-green-100 dark:bg-green-900/30',
        totalPaid,
        totalBudgeted,
        remaining
      };
    } else if (anyPaid) {
      // Algunos pagos, pero falta algo
      return { 
        text: `💰 Falta ${formatAmount(remaining)}`, 
        icon: '💰', 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        totalPaid,
        totalBudgeted,
        remaining
      };
    } else {
      // Nada pagado
      return { 
        text: ' Sin pagos', 
        icon: '⚠️', 
        bg: 'bg-red-100 dark:bg-red-900/30',
        totalPaid,
        totalBudgeted,
        remaining
      };
    }
  };

  const getFixedExpenseStatus = (budget) => {
    const spent = parseFloat(budget.spent) || 0;
    const total = parseFloat(budget.amount) || 0;
    const percentagePaid = total > 0 ? (spent / total) * 100 : 0;
    const remaining = total - spent;

    if (percentagePaid >= 100) {
      return { 
        text: 'Pagado', 
        color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', 
        icon: '✅',
        isPaid: true,
        remaining
      };
    }

    if (percentagePaid === 0) {
      return { 
        text: 'Sin pagar', 
        color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', 
        icon: '⚠️',
        isPaid: false,
        remaining
      };
    }

    return { 
      text: `Falta ${formatAmount(remaining)}`, 
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', 
      icon: '💰',
      isPaid: false,
      remaining
    };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6 pb-24 px-4 sm:px-6">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900 text-center p-4 dark:text-white">Mis Gastos Fijos</h1>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const prev = new Date(selectedYear, selectedMonth - 2);
                setSelectedMonth(prev.getMonth() + 1);
                setSelectedYear(prev.getFullYear());
              }}
              className="w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              ←
            </button>
            <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[120px] text-center">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
            <button 
              onClick={() => {
                const next = new Date(selectedYear, selectedMonth);
                setSelectedMonth(next.getMonth() + 1);
                setSelectedYear(next.getFullYear());
              }}
              className="w-12 h-12 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              →
            </button>
          </div>
          <Button onClick={() => handleOpenModal()} className="border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            + Nuevo Presupuesto
          </Button>
        </div>
      </div>

      {status && (
        <div className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-6 border border-blue-200 dark:border-blue-800/30">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Resumen del mes</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {formatAmount(overallStatus.totalPaid)} pagado de {formatAmount(overallStatus.totalBudgeted)}
          </p>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">{overallStatus.icon}</span>
            <p className="text-xl font-bold text-amber-600 dark:text-yellow-400">{overallStatus.text}</p>
          </div>
          {overallStatus.remaining > 0 && (
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Falta: {formatAmount(overallStatus.remaining)}
            </p>
          )}
          <div className="mt-4">
            <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-300 bg-blue-500"
                style={{ width: `${overallStatus.totalBudgeted > 0 ? Math.min(100, (overallStatus.totalPaid / overallStatus.totalBudgeted) * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Presupuestos</h3>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-6 border border-blue-200 dark:border-blue-800/30 animate-pulse">
              <div className="h-32"></div>
            </div>
          ))
        ) : (
          budgets.map(budget => {
            const cat = budget.Category || categories.find(c => c.id === Number(budget.categoryId));
            const percentage_used = parseFloat(budget.percentage_used) || 0;
            const isExceeded = percentage_used > 100;
            const fixedStatus = budget.isFixed ? getFixedExpenseStatus(budget) : null;
            const percentage = Math.min(100, percentage_used);

            return (
              <div key={budget.id} className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-6 border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center justify-between mb-4">
                  {cat && (
                    <span className="px-4 py-1.5 rounded-full text-sm font-semibold text-white" style={{ backgroundColor: cat.color || '#7c2d12' }}>
                      {cat.name}
                    </span>
                  )}
                  {!cat && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">Sin categoría</span>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(budget)}
                      className="w-12 h-12 rounded-xl border-2 border-gray-400 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        setBudgetToDelete(budget);
                        setDeleteModalOpen(true);
                      }}
                      className="w-12 h-12 rounded-xl border-2 border-gray-400 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-4 py-1.5 rounded-full text-sm font-semibold text-amber-700 dark:text-orange-400 bg-amber-100 dark:bg-orange-900/30">
                    {fixedStatus?.icon} {fixedStatus?.text || 'Sin pagar'}
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white ml-auto">{percentage.toFixed(0)}%</span>
                </div>
                
                <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      percentage >= 100 ? 'bg-green-500' : 
                      percentage === 0 ? 'bg-red-500' : 
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-base mb-1">
                  {formatAmount(parseFloat(budget.spent) || 0)} pagado de {formatAmount(parseFloat(budget.amount) || 0)}
                </p>
                {percentage_used < 100 && (
                  <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                    Falta: {formatAmount(fixedStatus?.remaining || 0)}
                  </p>
                )}
                
                <button
                  onClick={() => handlePayFixedExpense(budget)}
                  disabled={(parseFloat(budget.spent) || 0) >= (parseFloat(budget.amount) || 0)}
                  className="w-full py-3 rounded-xl border-2 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-white font-semibold text-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(parseFloat(budget.spent) || 0) >= (parseFloat(budget.amount) || 0) ? '✅ Pagado' : 'Pagar'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {!loading && budgets.length === 0 && (
        <div className="bg-blue-100 dark:bg-blue-900/40 rounded-3xl p-6 border border-blue-200 dark:border-blue-800/30">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">No tienes presupuestos configurados</p>
            <Button onClick={() => handleOpenModal()}>Crear tu primer presupuesto</Button>
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          size="md"
        >
          <div className="space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <CategorySelect
                value={formData.categoryId}
                onChange={(categoryId) => setFormData({ ...formData, categoryId })}
                type="expense"
                placeholder="Selecciona una categoría"
                disabled={!!editingBudget}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mes de inicio <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.startMonth}
                  onChange={(e) => setFormData({ ...formData, startMonth: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  disabled={!!editingBudget}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Año de inicio"
                type="number"
                value={formData.startYear}
                onChange={(e) => setFormData({ ...formData, startYear: Number(e.target.value) })}
                min={2020} max={2030}
                disabled={!!editingBudget}
              />
              <Input
                label="Duración (meses)"
                type="number"
                value={formData.durationMonths}
                onChange={(e) => setFormData({ ...formData, durationMonths: Number(e.target.value) })}
                min={1} max={120}
                disabled={!!editingBudget}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monto límite <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 dark:text-gray-400">
                  $
                </div>
                <input
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  inputMode="numeric"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 pl-8 pr-4 py-2.5 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="isFixed"
                checked={formData.isFixed}
                onChange={(e) => setFormData({ ...formData, isFixed: e.target.checked })}
                className="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="isFixed" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Es gasto fijo mensual
              </label>
            </div>
            {formData.isFixed && (
              <Input
                label="Día de vencimiento"
                type="number"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: Number(e.target.value) })}
                min={1} max={31}
                placeholder="Ej: 15"
              />
            )}
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveBudget}
            >
              {editingBudget ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </Modal>
      )}

      {deleteModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => { setDeleteModalOpen(false); setDeleteFromHere(false); }}
          title="Eliminar presupuesto"
          size="md"
        >
          {budgetToDelete && (() => {
            const cat = budgetToDelete.Category || categories.find(c => c.id === Number(budgetToDelete.categoryId));
            const categoryName = cat ? cat.name : 'la categoría';
            const isDecember = budgetToDelete.month === 12;
            
            return (
              <>
                <p className="text-gray-700 dark:text-gray-300 mb-2 text-sm break-words">
                  ¿Estás seguro de eliminar el presupuesto de {categoryName} para {getMonthName(budgetToDelete.month)} {budgetToDelete.year}?
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Límite: {formatAmount(budgetToDelete.amount)}
                </p>
                
                <hr className="border-gray-200 dark:border-gray-700 my-4" />
                
                <div className={`${deleteFromHere ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' : 'bg-transparent border-transparent'} border rounded-lg p-3 transition-all duration-200`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="deleteFromHere"
                      checked={deleteFromHere}
                      onChange={(e) => setDeleteFromHere(e.target.checked)}
                      disabled={isDecember}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 bg-white dark:bg-gray-800 mt-0.5"
                    />
                    <label 
                      htmlFor="deleteFromHere" 
                      className={`text-sm font-medium cursor-pointer flex-1 ${isDecember ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      Eliminar también en los meses restantes del año
                    </label>
                  </div>
                  
                  {isDecember && (
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 ml-7">
                      Ya es el último mes del año
                    </p>
                  )}
                  
                  {deleteFromHere && !isDecember && (
                    <div className="mt-3 ml-7 transition-opacity duration-200">
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Se eliminarán los presupuestos de {categoryName} desde {getMonthName(budgetToDelete.month)} hasta Diciembre {budgetToDelete.year}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3 mt-6 w-full">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => { setDeleteModalOpen(false); setDeleteFromHere(false); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleDeleteBudget}
                  >
                    {deleteFromHere ? 'Eliminar meses restantes' : 'Eliminar este mes'}
                  </Button>
                </div>
              </>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};

export default Budgets;
