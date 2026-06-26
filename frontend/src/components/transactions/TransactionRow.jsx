import React from 'react';
import Badge from '../common/Badge';

const TransactionRow = ({ transaction, onEdit, onDelete }) => {
  const formatCurrency = (amount) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP'
  }).format(amount);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {transaction.date}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {transaction.description}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {transaction.Category && (
          <Badge color={transaction.Category.color}>
            {transaction.Category.name}
          </Badge>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
          transaction.type === 'income'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <span className={`font-semibold ${
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        <button
          onClick={() => onEdit(transaction)}
          className="text-indigo-600 hover:text-indigo-800 p-1"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete(transaction)}
          className="text-red-600 hover:text-red-800 p-1"
        >
          🗑️
        </button>
      </td>
    </tr>
  );
};

export default TransactionRow;
