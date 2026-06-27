import React from 'react';
import Badge from '../common/Badge';
import { useCurrency } from '../../context/CurrencyContext';

const TransactionRow = ({ transaction, onEdit, onDelete }) => {
  const { formatAmount } = useCurrency();

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
        {transaction.date}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {transaction.description}
        {transaction.isGoalContribution && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">(Aporte a meta · no editable)</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {transaction.isGoalContribution ? (
          <Badge color="#6366f1">
            🎯 Meta
          </Badge>
        ) : (
          transaction.Category && (
            <Badge color={transaction.Category.color}>
              {transaction.Category.name}
            </Badge>
          )
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
          transaction.type === 'income'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <span className={`font-semibold ${
          transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
        {!transaction.isGoalContribution && (
          <>
            <button
              onClick={() => onEdit(transaction)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(transaction)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
            >
              🗑️
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

export default TransactionRow;
