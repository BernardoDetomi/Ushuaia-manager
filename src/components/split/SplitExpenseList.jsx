import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Search, RefreshCw, Receipt } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { getExpenseSplits, SPLIT_CATEGORIES } from './splitUtils';

const SplitExpenseList = ({ expenses, group, onDelete, onEdit, canManage }) => {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return expenses.filter((exp) => {
      if (filterCategory !== 'all' && exp.category !== filterCategory) return false;
      if (
        filterPerson !== 'all' &&
        exp.paidBy !== filterPerson &&
        !exp.splitBetween?.includes(filterPerson)
      )
        return false;
      if (
        searchQuery &&
        !exp.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [expenses, filterCategory, filterPerson, searchQuery]);

  const isMonthClosed = (dateStr) => {
    if (!dateStr) return false;
    const month = dateStr.substring(0, 7);
    return (group.closedMonths || []).includes(month);
  };

  const total = filtered.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
        <div className="relative flex-1 min-w-[150px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
            placeholder="Buscar despesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">Todas categorias</option>
          {SPLIT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
          value={filterPerson}
          onChange={(e) => setFilterPerson(e.target.value)}
        >
          <option value="all">Todos</option>
          {(group.participants || []).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-500">
            {filtered.length} despesa{filtered.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Total: {formatCurrency(total)}
          </span>
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <Receipt className="mx-auto text-slate-600 mb-3" size={36} />
          <p className="text-slate-400">Nenhuma despesa encontrada.</p>
          <p className="text-xs text-slate-500 mt-1">
            {expenses.length === 0
              ? 'Adicione a primeira despesa do grupo'
              : 'Tente alterar os filtros'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((exp) => {
            const splits = getExpenseSplits(exp);
            const closed = isMonthClosed(exp.date);

            return (
              <div
                key={exp.id}
                className={`bg-slate-800 rounded-xl border border-slate-700 p-4 transition ${
                  closed ? 'opacity-60' : 'hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{exp.description}</span>
                      <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                        {exp.category}
                      </span>
                      {exp.isRecurring && (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <RefreshCw size={8} /> Recorrente
                        </span>
                      )}
                      {closed && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                          Fechado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>
                        Pago por <strong className="text-slate-300">{exp.paidBy}</strong>
                      </span>
                      <span>&bull;</span>
                      <span>{exp.date}</span>
                      {exp.splitType !== 'equal' && (
                        <>
                          <span>&bull;</span>
                          <span className="text-indigo-400">
                            {exp.splitType === 'percentage' ? 'Percentual' : 'Personalizado'}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1.5 flex flex-wrap gap-x-3">
                      {Object.entries(splits).map(([person, share]) => (
                        <span key={person}>
                          {person}: <strong>{formatCurrency(share)}</strong>
                        </span>
                      ))}
                    </div>
                    {exp.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 italic">"{exp.notes}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-white font-bold">{formatCurrency(exp.amount)}</span>
                    {!closed && canManage && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(exp)}
                          className="p-1.5 text-yellow-400 hover:bg-yellow-500/10 rounded transition"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(exp.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SplitExpenseList;
