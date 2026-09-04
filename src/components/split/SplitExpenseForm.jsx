import React, { useState, useMemo } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Plus, Pencil, X, DollarSign, Percent, SlidersHorizontal } from 'lucide-react';
import { SPLIT_CATEGORIES } from './splitUtils';
import { formatCurrency } from '../../utils/formatCurrency';

const SplitExpenseForm = ({ group, onClose, editingExpense, user }) => {
  const isEditing = !!editingExpense;
  const todayStr = new Date().toISOString().split('T')[0];
  const participants = group.participants || [];

  const [formData, setFormData] = useState({
    description: editingExpense?.description || '',
    amount: editingExpense?.amount?.toString() || '',
    paidBy: editingExpense?.paidBy || participants[0] || '',
    splitBetween: editingExpense?.splitBetween || [...participants],
    splitType: editingExpense?.splitType || 'equal',
    splitDetails: editingExpense?.splitDetails || {},
    category: editingExpense?.category || SPLIT_CATEGORIES[0],
    date: editingExpense?.date || todayStr,
    notes: editingExpense?.notes || '',
  });

  const toggleParticipant = (name) => {
    const current = formData.splitBetween;
    if (current.includes(name)) {
      if (current.length <= 1) return;
      setFormData({ ...formData, splitBetween: current.filter((p) => p !== name) });
    } else {
      setFormData({ ...formData, splitBetween: [...current, name] });
    }
  };

  const updateSplitDetail = (person, value) => {
    setFormData({
      ...formData,
      splitDetails: { ...formData.splitDetails, [person]: parseFloat(value) || 0 },
    });
  };

  const splitPreview = useMemo(() => {
    const amount = parseFloat(formData.amount) || 0;
    const preview = {};

    if (formData.splitType === 'equal') {
      const share = amount / (formData.splitBetween.length || 1);
      formData.splitBetween.forEach((p) => {
        preview[p] = share;
      });
    } else if (formData.splitType === 'percentage') {
      formData.splitBetween.forEach((p) => {
        preview[p] = amount * ((formData.splitDetails[p] || 0) / 100);
      });
    } else {
      formData.splitBetween.forEach((p) => {
        preview[p] = formData.splitDetails[p] || 0;
      });
    }

    return preview;
  }, [formData]);

  const amount = parseFloat(formData.amount) || 0;
  const totalSplit = Object.values(splitPreview).reduce((a, b) => a + b, 0);

  const percentSum = formData.splitBetween.reduce(
    (s, p) => s + (formData.splitDetails[p] || 0),
    0
  );
  const isPercentageValid = formData.splitType !== 'percentage' || Math.abs(percentSum - 100) < 0.1;
  const isCustomValid = formData.splitType !== 'custom' || Math.abs(totalSplit - amount) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.splitType === 'percentage' && !isPercentageValid) return;
    if (formData.splitType === 'custom' && !isCustomValid) return;

    try {
      const expenseData = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        paidBy: formData.paidBy,
        splitBetween: formData.splitBetween,
        splitType: formData.splitType,
        splitDetails: formData.splitType === 'equal' ? {} : formData.splitDetails,
        category: formData.category,
        date: formData.date,
        notes: formData.notes.trim(),
        isRecurring: false,
        recurringId: null,
      };

      if (isEditing) {
        await updateDoc(
          doc(db, 'split_groups', group.id, 'expenses', editingExpense.id),
          expenseData
        );
      } else {
        await addDoc(collection(db, 'split_groups', group.id, 'expenses'), {
          ...expenseData,
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
        });
      }

      onClose();
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Erro ao salvar despesa.');
    }
  };

  const splitTypes = [
    { key: 'equal', label: 'Igual', icon: DollarSign },
    { key: 'percentage', label: 'Percentual', icon: Percent },
    { key: 'custom', label: 'Personalizado', icon: SlidersHorizontal },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isEditing ? (
              <>
                <Pencil className="text-yellow-400" /> Editar Despesa
              </>
            ) : (
              <>
                <Plus className="text-indigo-400" /> Nova Despesa
              </>
            )}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Description & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Descrição</label>
              <input
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                placeholder="Ex: Mercado Carrefour"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data</label>
              <input
                type="date"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Categoria</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {SPLIT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Who Paid */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Quem Pagou?</label>
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

          {/* Split Between */}
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

          {/* Split Type */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tipo de Divisão</label>
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
              {splitTypes.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, splitType: key })}
                  className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-md text-xs sm:text-sm font-medium transition ${
                    formData.splitType === key
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Split Details for percentage/custom */}
          {formData.splitType !== 'equal' && (
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-3">
              <p className="text-xs text-slate-500">
                {formData.splitType === 'percentage'
                  ? 'Defina o percentual para cada pessoa (soma deve ser 100%)'
                  : `Defina o valor para cada pessoa (soma deve ser ${formatCurrency(amount)})`}
              </p>
              {formData.splitBetween.map((person) => (
                <div key={person} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[11px] text-slate-300 font-bold shrink-0">
                    {person.charAt(0)}
                  </div>
                  <span className="text-sm text-white w-20 truncate">{person}</span>
                  <input
                    type="number"
                    step={formData.splitType === 'percentage' ? '0.1' : '0.01'}
                    min="0"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm focus:border-indigo-500 outline-none"
                    placeholder={formData.splitType === 'percentage' ? '%' : 'R$'}
                    value={formData.splitDetails[person] || ''}
                    onChange={(e) => updateSplitDetail(person, e.target.value)}
                  />
                  {formData.splitType === 'percentage' && (
                    <span className="text-xs text-slate-500 w-20 text-right">
                      = {formatCurrency(splitPreview[person] || 0)}
                    </span>
                  )}
                </div>
              ))}
              {formData.splitType === 'percentage' && (
                <div
                  className={`text-xs ${isPercentageValid ? 'text-teal-400' : 'text-red-400'}`}
                >
                  Soma: {Math.round(percentSum * 10) / 10}%
                  {!isPercentageValid && ' — deve ser 100%'}
                </div>
              )}
              {formData.splitType === 'custom' && amount > 0 && (
                <div className={`text-xs ${isCustomValid ? 'text-teal-400' : 'text-red-400'}`}>
                  Soma: {formatCurrency(totalSplit)}
                  {!isCustomValid && ` — deve ser ${formatCurrency(amount)}`}
                </div>
              )}
            </div>
          )}

          {/* Equal split preview */}
          {amount > 0 && formData.splitType === 'equal' && formData.splitBetween.length > 0 && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
              <p className="text-xs text-indigo-300">
                Cada pessoa paga:{' '}
                <span className="font-bold">
                  {formatCurrency(amount / formData.splitBetween.length)}
                </span>{' '}
                ({formData.splitBetween.length} {formData.splitBetween.length === 1 ? 'pessoa' : 'pessoas'})
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Observação (opcional)</label>
            <textarea
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none resize-none"
              rows={2}
              placeholder="Ex: Compras da semana..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                (formData.splitType === 'percentage' && !isPercentageValid) ||
                (formData.splitType === 'custom' && !isCustomValid)
              }
              className={`flex-1 font-bold py-3 rounded-lg transition shadow-lg text-white disabled:opacity-50 ${
                isEditing
                  ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/50'
              }`}
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SplitExpenseForm;
