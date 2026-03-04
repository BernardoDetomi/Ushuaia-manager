import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  RefreshCw,
  Plus,
  X,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Repeat,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { SPLIT_CATEGORIES } from './splitUtils';

const SplitRecurring = ({ group, recurringItems }) => {
  const [showForm, setShowForm] = useState(false);
  const participants = group.participants || [];

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paidBy: participants[0] || '',
    splitBetween: [...participants],
    splitType: 'equal',
    splitDetails: {},
    category: SPLIT_CATEGORIES[0],
    frequency: 'mensal',
    dayOfMonth: '1',
  });

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      paidBy: participants[0] || '',
      splitBetween: [...participants],
      splitType: 'equal',
      splitDetails: {},
      category: SPLIT_CATEGORIES[0],
      frequency: 'mensal',
      dayOfMonth: '1',
    });
  };

  const toggleParticipant = (name) => {
    const current = formData.splitBetween;
    if (current.includes(name)) {
      if (current.length <= 1) return;
      setFormData({ ...formData, splitBetween: current.filter((p) => p !== name) });
    } else {
      setFormData({ ...formData, splitBetween: [...current, name] });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.amount) return;

    try {
      await addDoc(collection(db, 'split_groups', group.id, 'recurring'), {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        paidBy: formData.paidBy,
        splitBetween: formData.splitBetween,
        splitType: formData.splitType,
        splitDetails: formData.splitType === 'equal' ? {} : formData.splitDetails,
        category: formData.category,
        frequency: formData.frequency,
        dayOfMonth: parseInt(formData.dayOfMonth),
        active: true,
        lastGenerated: null,
        createdAt: new Date().toISOString(),
      });
      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error('Error creating recurring:', err);
      alert('Erro ao criar recorrência.');
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateDoc(doc(db, 'split_groups', group.id, 'recurring', item.id), {
        active: !item.active,
      });
    } catch (err) {
      console.error('Error toggling recurring:', err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Excluir esta despesa recorrente?')) {
      try {
        await deleteDoc(doc(db, 'split_groups', group.id, 'recurring', id));
      } catch (err) {
        console.error('Error deleting recurring:', err);
      }
    }
  };

  const frequencyLabels = {
    mensal: 'Mensal',
    quinzenal: 'Quinzenal',
    anual: 'Anual',
  };

  const frequencyColors = {
    mensal: 'bg-indigo-500/20 text-indigo-400',
    quinzenal: 'bg-purple-500/20 text-purple-400',
    anual: 'bg-orange-500/20 text-orange-400',
  };

  const activeItems = recurringItems.filter((i) => i.active);
  const inactiveItems = recurringItems.filter((i) => !i.active);
  const monthlyTotal = activeItems
    .filter((i) => i.frequency === 'mensal')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="text-indigo-400" size={18} />
            Despesas Recorrentes
          </h3>
          {activeItems.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {activeItems.length} ativa{activeItems.length !== 1 ? 's' : ''} —{' '}
              {formatCurrency(monthlyTotal)}/mês
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition hover:scale-105"
        >
          <Plus size={16} /> Nova Recorrência
        </button>
      </div>

      {/* Empty state */}
      {recurringItems.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="bg-slate-700/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Repeat className="text-slate-500" size={32} />
          </div>
          <p className="text-slate-300 font-medium mb-1">Nenhuma despesa recorrente</p>
          <p className="text-slate-500 text-sm">
            Crie contas fixas (aluguel, Netflix, energia...) que serão lançadas automaticamente
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active items */}
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium">{item.description}</span>
                    <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        frequencyColors[item.frequency] || frequencyColors.mensal
                      }`}
                    >
                      {frequencyLabels[item.frequency] || 'Mensal'}
                    </span>
                    <span className="text-[10px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded">
                      Ativa
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-x-2">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      Dia {item.dayOfMonth}
                    </span>
                    <span>&bull;</span>
                    <span>Pago por {item.paidBy}</span>
                    <span>&bull;</span>
                    <span>Dividido: {item.splitBetween?.join(', ')}</span>
                    {item.lastGenerated && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-600">Último: {item.lastGenerated}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-white font-bold">{formatCurrency(item.amount)}</span>
                  <button
                    onClick={() => toggleActive(item)}
                    className="p-1.5 hover:bg-slate-700 rounded transition"
                    title="Pausar recorrência"
                  >
                    <ToggleRight size={22} className="text-teal-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Inactive items */}
          {inactiveItems.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-slate-600 uppercase tracking-wider font-bold mb-2">
                Pausadas
              </p>
              {inactiveItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-4 opacity-50 mb-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{item.description}</span>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                          Pausada
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {frequencyLabels[item.frequency]} • {item.category} •{' '}
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        onClick={() => toggleActive(item)}
                        className="p-1.5 hover:bg-slate-700 rounded transition"
                        title="Reativar"
                      >
                        <ToggleLeft size={22} className="text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Recurring Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <RefreshCw className="text-indigo-400" /> Nova Recorrência
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Descrição</label>
                  <input
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                    placeholder="Ex: Aluguel"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Frequência</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({ ...formData, frequency: e.target.value })
                    }
                  >
                    <option value="mensal">Mensal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Dia do Mês</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                    placeholder="1"
                    value={formData.dayOfMonth}
                    onChange={(e) =>
                      setFormData({ ...formData, dayOfMonth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Categoria</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {SPLIT_CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Quem Paga</label>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, paidBy: p })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                        formData.paidBy === p
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Dividir entre</label>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleParticipant(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                        formData.splitBetween.includes(p)
                          ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition shadow-lg"
                >
                  Criar Recorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitRecurring;
