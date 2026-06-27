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

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP'
  }).format(amount);

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
      return { text: '✅ Bajo control', icon: '✅', bg: 'bg-green-100 dark:bg-green-900/30', totalPaid: 0, totalBudgeted: 0, remaining: 0 };
    }
    
    // Filtramos solo presupuestos fijos
    const fixedBudgets = status.budgets.filter(b => b.isFixed);
    
    if (fixedBudgets.length === 0) {
      const totalPaid = status.totalSpent || 0;
      const totalBudgeted = status.totalBudgeted || 0;
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
      const paid = budget.spent || 0;
      totalPaid += paid;
      totalBudgeted += budget.amount;
      
      if (paid < budget.amount) {
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
        text: `💰 Falta ${formatCurrency(remaining)}`, 
        icon: '💰', 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        totalPaid,
        totalBudgeted,
        remaining
      };
    } else {
      // Nada pagado
      return { 
        text: '⚠️ Sin pagos', 
        icon: '⚠️', 
        bg: 'bg-red-100 dark:bg-red-900/30',
        totalPaid,
        totalBudgeted,
        remaining
      };
    }
  };

  const getFixedExpenseStatus = (budget) => {
    const spent = budget.spent || 0;
    const total = budget.amount;
    const percentagePaid = (spent / total) * 100;
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
      text: `Falta ${formatCurrency(remaining)}`, 
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', 
      icon: '💰',
      isPaid: false,
      remaining
    };
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Presupuestos</h1>
        <div className="flex gap-3 items-center">
          <MonthPicker
            month={selectedMonth}
            year={selectedYear}
            onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }}
          />
          <Button onClick={() => handleOpenModal()}>+ Nuevo Presupuesto</Button>
        </div>
      </div>

      {status && (
        <Card className={`${overallStatus.bg} dark:${overallStatus.bg.replace('bg-', 'bg-')}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Resumen del mes</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {formatCurrency(overallStatus.totalPaid)} pagado de {formatCurrency(overallStatus.totalBudgeted)}
              </p>
              <p className="text-2xl font-bold mt-2">{overallStatus.text}</p>
              {overallStatus.remaining > 0 && (
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-1">
                  Falta: {formatCurrency(overallStatus.remaining)}
                </p>
              )}
            </div>
            <div className="lg:col-span-2">
              <ProgressBar
                percentage={overallStatus.totalBudgeted > 0 ? (overallStatus.totalPaid / overallStatus.totalBudgeted) * 100 : 0}
                showLabel={false}
                height="h-5"
              />
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg"></div>
            </Card>
          ))
        ) : (
          budgets.map(budget => {
            const cat = budget.Category || categories.find(c => c.id === Number(budget.categoryId));
            const isExceeded = budget.percentage_used > 100;
            const fixedStatus = budget.isFixed ? getFixedExpenseStatus(budget) : null;

            return (
              <Card key={budget.id} className={isExceeded ? 'border-2 border-red-300 dark:border-red-700' : ''}>
                {isExceeded && (
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-xl font-semibold">
                    ¡Presupuesto excedido por {formatCurrency(budget.spent - budget.amount)}!
                  </div>
                )}
            <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {cat && (
                      <Badge color={cat.color}>{cat.name}</Badge>
                    )}
                    {!cat && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">Sin categoría</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(budget)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        setBudgetToDelete(budget);
                        setDeleteModalOpen(true);
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {budget.isFixed ? (
                  <div className="space-y-3">
                    {fixedStatus && (
                      <div className="text-center">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${fixedStatus.color}`}>
                          {fixedStatus.icon} {fixedStatus.text}
                        </span>
                      </div>
                    )}
                    <div className="text-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.min(100, budget.percentage_used).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          Math.min(100, budget.percentage_used) >= 100 ? 'bg-green-500' : 
                          Math.min(100, budget.percentage_used) === 0 ? 'bg-red-500' : 
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(100, budget.percentage_used)}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-gray-700 dark:text-gray-300 text-sm">
                      {formatCurrency(budget.spent)} pagado de {formatCurrency(budget.amount)}
                    </p>
                    {budget.percentage_used < 100 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 text-xs">
                        Falta: {formatCurrency(fixedStatus?.remaining || 0)}
                      </p>
                    )}
                    <Button 
                      onClick={() => handlePayFixedExpense(budget)}
                      className="w-full mt-2"
                      disabled={budget.spent >= budget.amount}
                    >
                      💳 {budget.spent >= budget.amount ? 'Pagado' : 'Pagar'}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="text-center mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {budget.percentage_used.toFixed(0)}%
                      </span>
                    </div>
                    <ProgressBar percentage={budget.percentage_used} height="h-4" />
                    <p className="text-center mt-3 text-gray-700 dark:text-gray-300">
                      {formatCurrency(budget.spent)} gastado de {formatCurrency(budget.amount)}
                    </p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {!loading && budgets.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">No tienes presupuestos configurados</p>
            <Button onClick={() => handleOpenModal()}>Crear tu primer presupuesto</Button>
          </div>
        </Card>
      )}

      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingBudget ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          size="md"
        >
          <div className="space-y-4">
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
            <div className="grid grid-cols-3 gap-4">
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
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  ¿Estás seguro de eliminar el presupuesto de {categoryName} para {getMonthName(budgetToDelete.month)} {budgetToDelete.year}?
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Límite: {formatCurrency(budgetToDelete.amount)}
                </p>
                
                <hr className="border-gray-200 dark:border-gray-700 my-4" />
                
                <div className={`${deleteFromHere ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' : 'bg-transparent border-transparent'} border rounded-lg p-3 transition-all duration-200`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="deleteFromHere"
                      checked={deleteFromHere}
                      onChange={(e) => setDeleteFromHere(e.target.checked)}
                      disabled={isDecember}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 bg-white dark:bg-gray-800"
                    />
                    <label 
                      htmlFor="deleteFromHere" 
                      className={`text-sm font-medium cursor-pointer ${isDecember ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}
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
                
                <div className="flex gap-3 mt-6">
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