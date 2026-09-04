import React, { useState } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, Pencil } from 'lucide-react';

const ExpenseForm = ({ onClose, settings, editingExpense, tripId, user }) => {
  const expensesRef = collection(db, 'trips', tripId, 'expenses');
  const isSplit = false;
  const isEditing = !!editingExpense;
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    description: editingExpense?.descricao || '',
    category: editingExpense?.categoria || 'Alimentação',
    value: editingExpense?.valor_total?.toString() || '',
    payer: editingExpense?.quem_pagou || 'person1',
    method: editingExpense?.forma_pagamento || 'Cartão de Crédito',
    cardName: editingExpense?.nome_cartao || '',
    cardDueDate: editingExpense?.dia_vencimento?.toString() || '',
    purchaseDate: editingExpense ? (editingExpense.data?.split('T')[0] || todayStr) : todayStr,
    isInstallment: editingExpense?.parcelado || false,
    installmentsCount: editingExpense?.detalhes_parcela?.count?.toString() || '2',
    firstInstallmentValue: editingExpense?.detalhes_parcela?.firstValue?.toString() || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalValue = parseFloat(formData.value);
      let installmentDetails = null;

      if (formData.isInstallment) {
        if (formData.firstInstallmentValue) {
          installmentDetails = {
            count: parseInt(formData.installmentsCount),
            firstValue: parseFloat(formData.firstInstallmentValue),
            remainingValue:
              (finalValue - parseFloat(formData.firstInstallmentValue)) /
              (parseInt(formData.installmentsCount) - 1),
          };
        } else {
          installmentDetails = {
            count: parseInt(formData.installmentsCount),
            valuePerMonth: finalValue / parseInt(formData.installmentsCount),
          };
        }
      }

      const expenseData = {
        descricao: formData.description,
        categoria: formData.category,
        valor_total: finalValue,
        quem_pagou: formData.payer,
        forma_pagamento: formData.method,
        nome_cartao: formData.cardName,
        dia_vencimento:
          formData.method === 'Cartão de Crédito' ? parseInt(formData.cardDueDate) : null,
        parcelado: formData.isInstallment,
        detalhes_parcela: installmentDetails,
        data: new Date(formData.purchaseDate + 'T12:00:00').toISOString(),
      };

      if (isEditing) {
        await updateDoc(doc(db, 'trips', tripId, 'expenses', editingExpense.id), expenseData);
      } else {
        await addDoc(expensesRef, {
          ...expenseData,
          parcelas_pagas: [],
          createdBy: user.uid,
        });
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar gasto.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {isEditing ? (
              <><Pencil className="text-yellow-400" /> Editar Gasto</>
            ) : (
              <><Plus className="text-teal-400" /> Novo Gasto</>
            )}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Descrição</label>
              <input
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                placeholder="Ex: Jantar no El Viejo Marino"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                placeholder="0.00"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data da Compra</label>
              <input
                type="date"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Categoria</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {isSplit ? (
                  <>
                    <option>Mercado</option>
                    <option>Alimentação</option>
                    <option>Casa</option>
                    <option>Saúde</option>
                    <option>Lazer</option>
                    <option>Transporte</option>
                    <option>Assinaturas</option>
                    <option>Pet</option>
                    <option>Outros</option>
                  </>
                ) : (
                  <>
                    <option>Passagem</option>
                    <option>Hospedagem</option>
                    <option>Alimentação</option>
                    <option>Passeios</option>
                    <option>Transporte</option>
                    <option>Presentes</option>
                    <option>Outros</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quem Pagou?</label>
              <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payer: 'person1' })}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                    formData.payer === 'person1'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {settings.person1}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, payer: 'person2' })}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                    formData.payer === 'person2'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {settings.person2}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Forma de Pagamento</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              >
                <option>Cartão de Crédito</option>
                <option>Cartão de Débito</option>
                <option>Pix</option>
                <option>Dinheiro</option>
                <option>Wise/Nomad</option>
              </select>
            </div>
            {formData.method === 'Cartão de Crédito' && (
              <>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Apelido do Cartão</label>
                  <input
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                    placeholder="Ex: Nubank Roxo"
                    value={formData.cardName}
                    onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    Dia de Vencimento da Fatura
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                    placeholder="Ex: 5"
                    value={formData.cardDueDate}
                    onChange={(e) => setFormData({ ...formData, cardDueDate: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Usado para calcular em qual mês cai a primeira parcela.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="parcelado"
                className="w-5 h-5 accent-teal-500"
                checked={formData.isInstallment}
                onChange={(e) => setFormData({ ...formData, isInstallment: e.target.checked })}
              />
              <label htmlFor="parcelado" className="text-white font-medium cursor-pointer">
                Compra Parcelada?
              </label>
            </div>

            {formData.isInstallment && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nº Parcelas</label>
                  <input
                    type="number"
                    min="2"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                    value={formData.installmentsCount}
                    onChange={(e) =>
                      setFormData({ ...formData, installmentsCount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Valor da 1ª Parcela (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                    placeholder="Se diferente das outras"
                    value={formData.firstInstallmentValue}
                    onChange={(e) =>
                      setFormData({ ...formData, firstInstallmentValue: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 font-bold py-3 rounded-lg transition shadow-lg text-white ${
                isEditing
                  ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50'
                  : 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/50'
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

export default ExpenseForm;
