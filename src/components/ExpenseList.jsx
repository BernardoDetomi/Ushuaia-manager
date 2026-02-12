import React, { useState } from 'react';
import { Trash2, CreditCard, Pencil } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const ExpenseList = ({ expenses, onDelete, onEdit, settings }) => {
  const [filter, setFilter] = useState('todos');

  const filteredExpenses = expenses.filter((exp) => {
    if (filter === 'todos') return true;
    if (filter === 'person1') return exp.quem_pagou === 'person1';
    if (filter === 'person2') return exp.quem_pagou === 'person2';
    return exp.categoria === filter;
  });

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <CreditCard size={18} className="text-teal-400" /> Histórico Geral
        </h3>
        <select
          className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="todos">Todos os Gastos</option>
          <option value="person1">Pago por {settings.person1}</option>
          <option value="person2">Pago por {settings.person2}</option>
          <option disabled>--- Categorias ---</option>
          <option value="Passagem">Passagem</option>
          <option value="Hospedagem">Hospedagem</option>
          <option value="Alimentação">Alimentação</option>
          <option value="Passeios">Passeios</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/50 text-slate-200 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3">Quem Pagou</th>
              <th className="px-6 py-3 text-right">Valor Total</th>
              <th className="px-6 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500 italic">
                  Nenhum gasto registrado ainda.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-700/30 transition">
                  <td className="px-6 py-4">
                    {new Date(expense.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {expense.descricao}
                    <div className="text-xs text-slate-500 mt-0.5">{expense.forma_pagamento}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        expense.quem_pagou === 'person1'
                          ? 'bg-teal-500/10 text-teal-300'
                          : 'bg-purple-500/10 text-purple-300'
                      }`}
                    >
                      {expense.quem_pagou === 'person1' ? settings.person1 : settings.person2}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-white font-bold">
                    {formatCurrency(expense.valor_total)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(expense)}
                        className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 p-1.5 rounded-full transition"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-full transition"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseList;
