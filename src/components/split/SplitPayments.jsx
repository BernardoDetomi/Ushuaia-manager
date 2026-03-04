import React, { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  ArrowRight,
  CheckCircle,
  X,
  Clock,
  Trash2,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const SplitPayments = ({
  group,
  payments,
  debtInfo,
  onPayDebt,
  onDeletePayment,
  showForm,
  onCloseForm,
  preset,
}) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const participants = group.participants || [];

  // Populate form when preset arrives
  useEffect(() => {
    if (preset) {
      setFrom(preset.from || '');
      setTo(preset.to || '');
      setAmount(preset.amount?.toString() || '');
    }
  }, [preset]);

  const resetForm = () => {
    setFrom('');
    setTo('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!from || !to || !amount) return;

    try {
      await addDoc(collection(db, 'split_groups', group.id, 'payments'), {
        from,
        to,
        amount: parseFloat(amount),
        date,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      });
      onCloseForm();
      resetForm();
    } catch (err) {
      console.error('Error saving payment:', err);
      alert('Erro ao registrar pagamento.');
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Pending Debts */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="text-amber-400" size={18} />
            Dívidas Pendentes
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Valores simplificados — mínimo de transferências necessárias
          </p>
        </div>
        <div className="p-5">
          {debtInfo.transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-teal-400" size={28} />
              </div>
              <p className="text-teal-400 font-bold text-lg">Tudo quitado!</p>
              <p className="text-slate-500 text-xs mt-1">Nenhuma dívida pendente no grupo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debtInfo.transactions.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900/60 rounded-xl p-4 border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {t.from.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white font-semibold">{t.from}</span>
                        <ArrowRight size={14} className="text-amber-400" />
                        <span className="text-white font-semibold">{t.to}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Valor pendente de pagamento
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-amber-400">
                      {formatCurrency(t.amount)}
                    </span>
                    <button
                      onClick={() => onPayDebt(t)}
                      className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="text-teal-400" size={18} />
              Histórico de Pagamentos
            </h3>
            {payments.length > 0 && (
              <p className="text-xs text-slate-500 mt-0.5">
                {payments.length} pagamento{payments.length !== 1 ? 's' : ''} —{' '}
                {formatCurrency(totalPaid)} total
              </p>
            )}
          </div>
        </div>
        <div className="p-5">
          {payments.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">
              Nenhum pagamento registrado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-700/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-[11px] font-bold">
                      {pay.from?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white">{pay.from}</span>
                        <ArrowRight size={12} className="text-teal-400" />
                        <span className="text-white">{pay.to}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {pay.date}
                        {pay.notes && ` • ${pay.notes}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400 font-bold text-sm">
                      {formatCurrency(pay.amount)}
                    </span>
                    <button
                      onClick={() => onDeletePayment(pay.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition"
                      title="Excluir pagamento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="text-teal-400" /> Registrar Pagamento
              </h2>
              <button
                onClick={() => {
                  onCloseForm();
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Quem Pagou (De)</label>
                <select
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {participants.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Para Quem</label>
                <select
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {participants
                    .filter((p) => p !== from)
                    .map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-slate-600 mt-1">
                  Pode ser parcial — registre o valor que realmente foi pago
                </p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Data</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Observação (opcional)
                </label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  placeholder="Ex: PIX, dinheiro, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onCloseForm();
                    resetForm();
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg transition shadow-lg"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitPayments;
