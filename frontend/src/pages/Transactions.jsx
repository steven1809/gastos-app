import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import transactionService from '../services/transaction.service';
import categoryService from '../services/category.service';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TransactionRow from '../components/transactions/TransactionRow';
import TransactionForm from '../components/transactions/TransactionForm';

const Transactions = () => {
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [categories, setCategories] = useState([]);
  
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    type: '', categoryId: '', startDate: '', endDate: '', minAmount: '', maxAmount: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [prefillData, setPrefillData] = useState(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = { ...filters, ...pagination, ...sortConfig, includeGoalContributions: true };
      const data = await transactionService.getAll(params);
      setTransactions(data.transactions || data);
      if (data.total) {
        setPagination(prev => ({
          ...prev, total: data.total, totalPages: data.totalPages || 1
        }));
      }
    } catch (err) {
      setError('Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [filters, pagination.page, pagination.limit, sortConfig]);

  useEffect(() => {
    if (location.state?.openModal && location.state?.prefill) {
      setPrefillData(location.state.prefill);
      setModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP'
  }).format(amount);

  const handleAddTransaction = () => {
    setPrefillData(null);
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleEditTransaction = (transaction) => {
    setPrefillData(null);
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const handleSaveTransaction = async (formData) => {
    setProcessingAction(true);
    try {
      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, formData);
        setSuccessMessage('Transacción actualizada');
      } else {
        await transactionService.create(formData);
        setSuccessMessage('Transacción creada');
      }
      setModalOpen(false);
      setPrefillData(null);
      loadTransactions();
    } catch (err) {
      setError('Error al guardar transacción');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDeleteTransaction = async () => {
    setProcessingAction(true);
    try {
      await transactionService.remove(transactionToDelete.id);
      setSuccessMessage('Transacción eliminada');
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
      loadTransactions();
    } catch (err) {
      setError('Error al eliminar transacción');
    } finally {
      setProcessingAction(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      type: '', categoryId: '', startDate: '', endDate: '', minAmount: '', maxAmount: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transacciones</h1>
        <Button onClick={handleAddTransaction}>+ Nueva Transacción</Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setFilters({ ...filters, type: '' })}
          className={`px-4 py-2 rounded-lg border ${!filters.type ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'border-gray-300 text-gray-600'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilters({ ...filters, type: 'income' })}
          className={`px-4 py-2 rounded-lg border ${filters.type === 'income' ? 'bg-green-100 border-green-500 text-green-700' : 'border-gray-300 text-gray-600'}`}
        >
          Ingresos
        </button>
        <button
          onClick={() => setFilters({ ...filters, type: 'expense' })}
          className={`px-4 py-2 rounded-lg border ${filters.type === 'expense' ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-300 text-gray-600'}`}
        >
          Gastos
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600"
        >
          🔍 Filtros
        </button>
      </div>

      {showFilters && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              >
                <option value="">Todas</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto mínimo</label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto máximo</label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>
          <Button variant="secondary" onClick={clearFilters}>Limpiar filtros</Button>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <>
            {/* Desktop: Table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      Fecha {sortConfig.field === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                    >
                      Descripción
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                    >
                      Categoría
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                    >
                      Tipo
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      Monto {sortConfig.field === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onEdit={handleEditTransaction}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Card view */}
            <div className="md:hidden space-y-3">
              {transactions.map((transaction) => {
                const cat = transaction.Category || categories.find(c => c.id === Number(transaction.categoryId));
                return (
                  <div key={transaction.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {transaction.isGoalContribution ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#6366f1' }}>
                            🎯 Meta
                          </span>
                        ) : (
                          cat && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: cat.color || '#6366f1' }}>
                              {cat.name}
                            </span>
                          )
                        )}
                      </div>
                      <span className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                    
                    <p className="text-gray-800 font-medium mb-3">{transaction.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <span>📅</span>
                        <span>{transaction.date}</span>
                        {transaction.isGoalContribution && (
                          <span className="text-xs text-gray-400 ml-2">(Aporte a meta · no editable)</span>
                        )}
                      </div>
                      {!transaction.isGoalContribution && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteClick(transaction)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!loading && transactions.length === 0 && (
              <p className="text-center py-12 text-gray-500">No hay transacciones para mostrar</p>
            )}

            {/* Desktop Pagination */}
            <div className="hidden md:block px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex gap-6">
                  <span className="text-green-700 font-semibold">
                    Ingresos: {formatCurrency(totalIncome)}
                  </span>
                  <span className="text-red-700 font-semibold">
                    Gastos: {formatCurrency(totalExpenses)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Mostrando {(pagination.page - 1)*pagination.limit + 1}-{Math.min(pagination.page*pagination.limit, pagination.total || transactions.length)} de {pagination.total || transactions.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Pagination */}
            <div className="md:hidden border-t border-gray-200 py-4 px-4 space-y-3">
              <p className="text-center text-gray-600 font-medium">Página {pagination.page} de {pagination.totalPages || 1}</p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 min-h-[44px]"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 min-h-[44px]"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {modalOpen && (
        <TransactionForm
          initialData={editingTransaction}
          prefillData={prefillData}
          onSubmit={handleSaveTransaction}
          onCancel={() => { setModalOpen(false); setEditingTransaction(null); setPrefillData(null); }}
          loading={processingAction}
        />
      )}

      {deleteModalOpen && transactionToDelete && (
        <Modal
          isOpen={true}
          onClose={() => { setDeleteModalOpen(false); setTransactionToDelete(null); }}
          title="Confirmar eliminación"
          size="sm"
        >
          <p className="mb-4 text-gray-700">
            ¿Estás seguro de eliminar la transacción: <strong>{transactionToDelete.description}</strong>?
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setDeleteModalOpen(false); setTransactionToDelete(null); }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              loading={processingAction}
              onClick={handleDeleteTransaction}
            >
              Eliminar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Transactions;