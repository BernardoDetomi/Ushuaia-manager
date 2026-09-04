import React, { useMemo, useState } from 'react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { Check, Pencil, Plus, X } from 'lucide-react';
import { db } from '../config/firebase';
import { getExpenseParticipantUids, getExpensePayerUid, getTripMembers } from '../utils/tripFinance';

const categories = ['Passagem', 'Hospedagem', 'Alimentação', 'Passeios', 'Transporte', 'Presentes', 'Outros'];
const paymentMethods = ['Cartão de Crédito', 'Cartão de Débito', 'Pix', 'Dinheiro', 'Wise/Nomad'];

const ExpenseForm = ({ onClose, editingExpense, trip, user }) => {
  const members = useMemo(() => getTripMembers(trip), [trip]);
  const settings = trip.settings || {};
  const isEditing = Boolean(editingExpense);
  const today = new Date().toISOString().split('T')[0];
  const initialParticipants = editingExpense
    ? getExpenseParticipantUids(editingExpense, members, settings)
    : members.map((member) => member.uid);

  const [formData, setFormData] = useState({
    description: editingExpense?.descricao || '',
    category: editingExpense?.categoria || 'Alimentação',
    value: editingExpense?.valor_total?.toString() || '',
    payerUid: editingExpense ? getExpensePayerUid(editingExpense, members, settings) : user.uid,
    splitBetweenUids: initialParticipants,
    method: editingExpense?.forma_pagamento || 'Cartão de Crédito',
    cardName: editingExpense?.nome_cartao || '',
    cardDueDate: editingExpense?.dia_vencimento?.toString() || '',
    purchaseDate: editingExpense?.data?.split('T')[0] || today,
    isInstallment: editingExpense?.parcelado || false,
    installmentsCount: editingExpense?.detalhes_parcela?.count?.toString() || '2',
    firstInstallmentValue: editingExpense?.detalhes_parcela?.firstValue?.toString() || '',
  });

  const toggleParticipant = (uid) => {
    setFormData((current) => ({
      ...current,
      splitBetweenUids: current.splitBetweenUids.includes(uid)
        ? current.splitBetweenUids.filter((item) => item !== uid)
        : [...current.splitBetweenUids, uid],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const total = Number(formData.value);
    if (!formData.payerUid || !formData.splitBetweenUids.length || total <= 0) return;
    const count = formData.isInstallment ? Number(formData.installmentsCount) : 1;
    let installmentDetails = null;
    if (formData.isInstallment) {
      installmentDetails = formData.firstInstallmentValue
        ? { count, firstValue: Number(formData.firstInstallmentValue), remainingValue: (total - Number(formData.firstInstallmentValue)) / (count - 1) }
        : { count, valuePerMonth: total / count };
    }
    const equalShare = total / formData.splitBetweenUids.length;
    const data = {
      descricao: formData.description.trim(),
      categoria: formData.category,
      valor_total: total,
      quem_pagou: formData.payerUid,
      paidByUid: formData.payerUid,
      splitBetweenUids: formData.splitBetweenUids,
      splitShares: Object.fromEntries(formData.splitBetweenUids.map((uid) => [uid, equalShare])),
      forma_pagamento: formData.method,
      nome_cartao: formData.cardName.trim(),
      dia_vencimento: formData.method === 'Cartão de Crédito' && formData.cardDueDate ? Number(formData.cardDueDate) : null,
      parcelado: formData.isInstallment,
      detalhes_parcela: installmentDetails,
      data: new Date(`${formData.purchaseDate}T12:00:00`).toISOString(),
    };
    try {
      if (isEditing) await updateDoc(doc(db, 'trips', trip.id, 'expenses', editingExpense.id), data);
      else await addDoc(collection(db, 'trips', trip.id, 'expenses'), { ...data, parcelas_pagas: [], createdBy: user.uid });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar gasto:', error);
      alert('Não foi possível salvar o gasto.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">{isEditing ? <><Pencil className="text-yellow-400" /> Editar gasto</> : <><Plus className="text-teal-400" /> Novo gasto</>}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Descrição"><input required value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} className="input" placeholder="Ex: Hospedagem" /></Field>
            <Field label="Valor total (R$)"><input required type="number" min="0.01" step="0.01" value={formData.value} onChange={(event) => setFormData({ ...formData, value: event.target.value })} className="input" placeholder="0,00" /></Field>
            <Field label="Data da compra"><input required type="date" value={formData.purchaseDate} onChange={(event) => setFormData({ ...formData, purchaseDate: event.target.value })} className="input" /></Field>
            <Field label="Categoria"><select value={formData.category} onChange={(event) => setFormData({ ...formData, category: event.target.value })} className="input">{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Quem pagou?"><select required value={formData.payerUid} onChange={(event) => setFormData({ ...formData, payerUid: event.target.value })} className="input">{members.map((member) => <option key={member.uid} value={member.uid}>{member.name}</option>)}</select></Field>
            <Field label="Forma de pagamento"><select value={formData.method} onChange={(event) => setFormData({ ...formData, method: event.target.value })} className="input">{paymentMethods.map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">Dividir igualmente entre</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {members.map((member) => {
                const selected = formData.splitBetweenUids.includes(member.uid);
                return <button type="button" key={member.uid} onClick={() => toggleParticipant(member.uid)} className={`flex items-center gap-3 p-3 rounded-lg border text-left ${selected ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-700 bg-slate-900 text-slate-400'}`}><span className={`w-6 h-6 rounded-full flex items-center justify-center ${selected ? 'bg-teal-600' : 'bg-slate-700'}`}>{selected && <Check size={14} />}</span><span><strong className="block text-sm">{member.name}</strong><small className="text-slate-500">{member.email}</small></span></button>;
              })}
            </div>
            {!formData.splitBetweenUids.length && <p className="text-xs text-red-400 mt-2">Selecione pelo menos uma pessoa.</p>}
          </div>

          {formData.method === 'Cartão de Crédito' && <div className="grid md:grid-cols-2 gap-4"><Field label="Apelido do cartão"><input value={formData.cardName} onChange={(event) => setFormData({ ...formData, cardName: event.target.value })} className="input" /></Field><Field label="Dia de vencimento"><input type="number" min="1" max="31" value={formData.cardDueDate} onChange={(event) => setFormData({ ...formData, cardDueDate: event.target.value })} className="input" /></Field></div>}

          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <label className="flex items-center gap-3 text-white"><input type="checkbox" checked={formData.isInstallment} onChange={(event) => setFormData({ ...formData, isInstallment: event.target.checked })} className="w-5 h-5 accent-teal-500" /> Compra parcelada?</label>
            {formData.isInstallment && <div className="grid md:grid-cols-2 gap-4 mt-4"><Field label="Número de parcelas"><input required type="number" min="2" value={formData.installmentsCount} onChange={(event) => setFormData({ ...formData, installmentsCount: event.target.value })} className="input" /></Field><Field label="Valor da primeira parcela (opcional)"><input type="number" min="0" step="0.01" value={formData.firstInstallmentValue} onChange={(event) => setFormData({ ...formData, firstInstallmentValue: event.target.value })} className="input" /></Field></div>}
          </div>

          <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg">Cancelar</button><button disabled={!formData.splitBetweenUids.length} className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg">{isEditing ? 'Salvar alterações' : 'Adicionar'}</button></div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => <label className="block"><span className="block text-sm text-slate-400 mb-1">{label}</span>{children}</label>;

export default ExpenseForm;
