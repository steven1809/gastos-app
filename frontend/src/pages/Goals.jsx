import React, { useState, useEffect, useRef } from 'react';
import goalService from '../services/goal.service';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import Badge from '../components/common/Badge';
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

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = getMonthName(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const EMICONS = ['🎯', '✈️', '🏠', '🚗', '💻', '📱', '🎓', '💍', '🏖️', '🛡️', '💰', '🎁'];
const COLORS = ['#6366f1', '#22c55e', '#ef4444', '#f59e0b', '#14b8a6', '#ec4899'];

const Goals = () => {
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState(null);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [deleteContributionConfirmOpen, setDeleteContributionConfirmOpen] = useState(false);
  const [contributionToDelete, setContributionToDelete] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    deadline: '',
    icon: '🎯',
    color: '#6366f1'
  });
  const [targetAmountDisplay, setTargetAmountDisplay] = useState('');
  const [contributionFormData, setContributionFormData] = useState({
    amount: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [contributionAmountDisplay, setContributionAmountDisplay] = useState('');



  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsData, statsData] = await Promise.all([
        goalService.getAll(),
        goalService.getStats()
      ]);
      setGoals(goalsData);
      setStats(statsData);
    } catch (err) {
      setError('Error al cargar metas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOpenModal = (goal = null) => {
    setEditingGoal(goal);
    if (goal) {
      setFormData({
        name: goal.name,
        description: goal.description || '',
        targetAmount: goal.targetAmount,
        deadline: goal.deadline,
        icon: goal.icon,
        color: goal.color
      });
      setTargetAmountDisplay(formatNumber(goal.targetAmount));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        deadline: tomorrow.toISOString().split('T')[0],
        icon: '🎯',
        color: '#6366f1'
      });
      setTargetAmountDisplay('');
    }
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveGoal = async () => {
    try {
      const dataToSend = {
        name: formData.name,
        description: formData.description || null,
        targetAmount: Number(formData.targetAmount),
        deadline: formData.deadline,
        icon: formData.icon,
        color: formData.color
      };
      
      if (editingGoal) {
        await goalService.update(editingGoal.id, dataToSend);
        setSuccessMessage('Meta actualizada');
      } else {
        await goalService.create(dataToSend);
        setSuccessMessage('Meta creada');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving goal:', err.response?.data || err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al guardar meta');
      }
    }
  };

  const handleCancelGoal = async () => {
    try {
      await goalService.remove(goalToDelete.id);
      setSuccessMessage('Meta cancelada');
      setDeleteConfirmModalOpen(false);
      setOpenMenuId(null);
      loadData();
    } catch (err) {
      setError('Error al cancelar meta');
    }
  };

  const handleOpenContributionModal = (goal) => {
    setSelectedGoalForContribution(goal);
    setContributionFormData({
      amount: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    });
    setContributionAmountDisplay('');
    setContributionModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveContribution = async () => {
    try {
      const result = await goalService.addContribution(
        selectedGoalForContribution.id,
        {
          amount: Number(contributionFormData.amount),
          notes: contributionFormData.notes || null,
          date: contributionFormData.date
        }
      );
      
      if (result.justCompleted) {
        setSuccessMessage(`🎉 ¡Felicitaciones! Completaste tu meta "${selectedGoalForContribution.name}"!`);
      } else {
        setSuccessMessage('Aporte registrado');
      }
      
      setContributionModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error adding contribution:', err.response?.data || err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al registrar aporte');
      }
    }
  };

  const handleOpenHistoryModal = (goal) => {
    setSelectedGoalForHistory(goal);
    setHistoryModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteContribution = async () => {
    try {
      await goalService.removeContribution(
        selectedGoalForHistory.id,
        contributionToDelete.id
      );
      setSuccessMessage('Aporte eliminado');
      setDeleteContributionConfirmOpen(false);
      loadData();
    } catch (err) {
      setError('Error al eliminar aporte');
    }
  };

  const handleTargetAmountChange = (e) => {
    const value = e.target.value;
    const onlyDigits = value.replace(/[^0-9]/g, '');
    setTargetAmountDisplay(formatNumber(onlyDigits));
    setFormData(prev => ({ ...prev, targetAmount: onlyDigits }));
  };

  const handleContributionAmountChange = (e) => {
    const value = e.target.value;
    const onlyDigits = value.replace(/[^0-9]/g, '');
    setContributionAmountDisplay(formatNumber(onlyDigits));
    setContributionFormData(prev => ({ ...prev, amount: onlyDigits }));
  };

  const getProgressBarColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredGoals = goals.filter(goal => {
    if (activeFilter === 'all') return true;
    return goal.status === activeFilter;
  });

  return (
    <div className="space-y-6" ref={menuRef}>
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Metas de Ahorro</h1>
        <Button onClick={() => handleOpenModal()}>+ Nueva Meta</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-700">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🎯</div>
              <div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Metas Activas</p>
                <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{stats.activeGoals}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💰</div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">Total Ahorrado</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{formatAmount(stats.totalSaved)}</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-3">
              <div className="text-3xl">✅</div>
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Metas Completadas</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.completedGoals}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Todas', value: 'all' },
          { label: 'Activas', value: 'active' },
          { label: 'Completadas', value: 'completed' },
          { label: 'Canceladas', value: 'cancelled' }
        ].map(filter => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === filter.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </Card>
          ))
        ) : (
          filteredGoals.map(goal => (
            <Card 
              key={goal.id}
              className={`border-2 ${
                goal.status === 'completed' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                  : goal.status === 'cancelled' 
                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                    : 'border-transparent'
              } relative`}
            >
              {goal.isOverdue && goal.status === 'active' && (
                <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-4 py-2 -mx-6 -mt-6 mb-4 rounded-t-xl font-semibold">
                  ⚠️ Fecha límite vencida
                </div>
              )}

              {goal.status === 'completed' && (
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700">
                    ✅ Completada
                  </Badge>
                  {goal.completedAt && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Completada el {formatDate(goal.completedAt)}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{goal.icon}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{goal.name}</h3>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === goal.id ? null : goal.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    ⋮
                  </button>
                  {openMenuId === goal.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-10">
                      {goal.status === 'active' && (
                        <button
                          onClick={() => handleOpenModal(goal)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                          ✏️ Editar meta
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenHistoryModal(goal)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        📋 Ver aportes
                      </button>
                      {goal.status === 'active' && (
                        <button
                          onClick={() => {
                            setGoalToDelete(goal);
                            setDeleteConfirmModalOpen(true);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-red-600 dark:text-red-400 flex items-center gap-2"
                        >
                          ❌ Cancelar meta
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {goal.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{goal.description}</p>
              )}

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatAmount(goal.currentAmount)} de {formatAmount(goal.targetAmount)}
                  </span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {Math.round(goal.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${getProgressBarColor(goal.percentage)}`}
                    style={{ width: `${Math.min(100, goal.percentage)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  📅 {formatDate(goal.deadline)}
                </div>
                {goal.status === 'active' && (
                  <div className={`font-medium ${goal.daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {goal.daysLeft < 0 
                      ? `Vencida hace ${Math.abs(goal.daysLeft)} días` 
                      : goal.daysLeft === 0 
                        ? '¡Hoy es la fecha límite!'
                        : `${goal.daysLeft} días restantes`
                    }
                  </div>
                )}
              </div>

              {goal.status === 'active' && (
                <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Falta: {formatAmount(goal.remaining)}
                </p>
              )}

              {goal.status === 'active' && (
                <Button 
                  onClick={() => handleOpenContributionModal(goal)}
                  className="w-full"
                >
                  + Agregar Aporte
                </Button>
              )}
            </Card>
          ))
        )}
      </div>

      {!loading && filteredGoals.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">No tienes metas configuradas</p>
            <Button onClick={() => handleOpenModal()}>Crear tu primera meta</Button>
          </div>
        </Card>
      )}

      {/* Modal: Nueva/Editar Meta */}
      {modalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          title={editingGoal ? 'Editar Meta' : 'Nueva Meta'}
          size="md"
        >
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Viaje a la playa"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 text-base"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="¿Qué quieres lograr?"
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 text-base"
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monto objetivo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 dark:text-gray-400 text-lg">
                  $
                </div>
                <input
                  value={targetAmountDisplay}
                  onChange={handleTargetAmountChange}
                  placeholder="0"
                  inputMode="numeric"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 pl-10 pr-4 py-3.5 text-base"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha límite <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 text-base"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ícono
              </label>
              <div className="flex flex-wrap gap-2">
                {EMICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2 transition-colors ${
                      formData.icon === icon
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      formData.color === color
                        ? 'border-gray-800 dark:border-white'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && '✓'}
                  </button>
                ))}
              </div>
            </div>
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
              onClick={handleSaveGoal}
            >
              {editingGoal ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal: Agregar Aporte */}
      {contributionModalOpen && selectedGoalForContribution && (
        <Modal
          isOpen={true}
          onClose={() => setContributionModalOpen(false)}
          title={`Agregar Aporte - ${selectedGoalForContribution.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="text-center py-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Progreso actual: <span className="font-bold">{Math.round(selectedGoalForContribution.percentage)}%</span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monto del aporte <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 dark:text-gray-400 text-lg">
                  $
                </div>
                <input
                  value={contributionAmountDisplay}
                  onChange={handleContributionAmountChange}
                  placeholder="¿Cuánto vas a aportar?"
                  inputMode="numeric"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 pl-10 pr-4 py-3.5 text-2xl font-bold"
                />
              </div>
            </div>

            {/* Preview de progreso */}
            {contributionFormData.amount > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-700">
                {(() => {
                  const projectedAmount = Number(selectedGoalForContribution.currentAmount) + Number(contributionFormData.amount);
                  const projectedPercentage = Math.min(100, (projectedAmount / Number(selectedGoalForContribution.targetAmount)) * 100);
                  const willComplete = projectedAmount >= Number(selectedGoalForContribution.targetAmount);
                  
                  return (
                    <div>
                      <p className="text-center text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                        Con este aporte llegarás al {Math.round(projectedPercentage)}% de tu meta
                      </p>
                      {!willComplete ? (
                        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                          Te faltará {formatAmount(Number(selectedGoalForContribution.targetAmount) - projectedAmount)} para completarla
                        </p>
                      ) : (
                        <p className="text-center text-lg font-bold text-green-700 dark:text-green-400">
                          🎉 ¡Completarás tu meta con este aporte!
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={contributionFormData.date}
                onChange={(e) => setContributionFormData({ ...contributionFormData, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 text-base"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas
              </label>
              <textarea
                value={contributionFormData.notes}
                onChange={(e) => setContributionFormData({ ...contributionFormData, notes: e.target.value })}
                placeholder="¿De dónde viene este dinero?"
                rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-indigo-500 text-base"
              ></textarea>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setContributionModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveContribution}
              disabled={!contributionFormData.amount}
            >
              Guardar Aporte
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal: Historial de Aportes */}
      {historyModalOpen && selectedGoalForHistory && (
        <Modal
          isOpen={true}
          onClose={() => setHistoryModalOpen(false)}
          title={`Historial - ${selectedGoalForHistory.name}`}
          size="md"
        >
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {(selectedGoalForHistory.contributions || []).length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-300 py-8">No hay aportes registrados</p>
            ) : (
              (selectedGoalForHistory.contributions || []).sort((a,b) => new Date(b.date) - new Date(a.date)).map(contribution => (
                <div key={contribution.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">📅 {formatDate(contribution.date)}</span>
                    </div>
                    {contribution.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{contribution.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-700 dark:text-green-400">+{formatAmount(contribution.amount)}</span>
                    <button
                      onClick={() => {
                        setContributionToDelete(contribution);
                        setDeleteContributionConfirmOpen(true);
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {(selectedGoalForHistory.contributions || []).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center font-medium text-gray-700 dark:text-gray-300">
                Total aportado: <span className="text-green-700 dark:text-green-400 font-bold">{formatAmount(selectedGoalForHistory.currentAmount)}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-4 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setHistoryModalOpen(false)}
            >
              Cerrar
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar Cancelar Meta */}
      {deleteConfirmModalOpen && goalToDelete && (
        <Modal
          isOpen={true}
          onClose={() => { setDeleteConfirmModalOpen(false); setGoalToDelete(null); }}
          title="¿Cancelar meta?"
          size="md"
        >
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            La meta "{goalToDelete.name}" será cancelada. Los aportes registrados se conservarán pero no podrás agregar nuevos aportes.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setDeleteConfirmModalOpen(false); setGoalToDelete(null); }}
            >
              No, mantener
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleCancelGoal}
            >
              Sí, cancelar
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar Eliminar Aporte */}
      {deleteContributionConfirmOpen && contributionToDelete && selectedGoalForHistory && (
        <Modal
          isOpen={true}
          onClose={() => { setDeleteContributionConfirmOpen(false); setContributionToDelete(null); }}
          title="Eliminar Aporte"
          size="md"
        >
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            ¿Estás seguro de eliminar este aporte de {formatAmount(contributionToDelete.amount)}?
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setDeleteContributionConfirmOpen(false); setContributionToDelete(null); }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleDeleteContribution}
            >
              Eliminar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Goals;
