import React, { useMemo, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ArrowRightLeft, Calendar, CheckCircle, Circle } from 'lucide-react';
import { db } from '../config/firebase';
import { formatCurrency } from '../utils/formatCurrency';
import { getExpensePayerUid, getExpenseShares, getMemberName, getPaymentKey, getTripMembers, isInstallmentPaid } from '../utils/tripFinance';

const simplifyBalances = (balances, members) => {
  const debtors = Object.entries(balances).filter(([, value]) => value < -0.01).map(([uid, value]) => ({ uid, amount: -value }));
  const creditors = Object.entries(balances).filter(([, value]) => value > 0.01).map(([uid, value]) => ({ uid, amount: value }));
  const result = [];
  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount);
    result.push({ from: getMemberName(debtors[debtorIndex].uid, members), to: getMemberName(creditors[creditorIndex].uid, members), amount });
    debtors[debtorIndex].amount -= amount;
    creditors[creditorIndex].amount -= amount;
    if (debtors[debtorIndex].amount < 0.01) debtorIndex += 1;
    if (creditors[creditorIndex].amount < 0.01) creditorIndex += 1;
  }
  return result;
};

const MonthlyView = ({ expenses, trip, canManage }) => {
  const [expanded, setExpanded] = useState({});
  const members = useMemo(() => getTripMembers(trip), [trip]);

  const togglePayment = async (item, uid) => {
    if (!canManage) return;
    const key = getPaymentKey(item.installmentIndex, uid);
    const paidMap = { ...(item.parcelas_pagas_v2 || {}) };
    if (paidMap[key]) delete paidMap[key];
    else paidMap[key] = true;
    await updateDoc(doc(db, 'trips', trip.id, 'expenses', item.id), { parcelas_pagas_v2: paidMap });
  };

  const monthlyData = useMemo(() => {
    const months = {};
    expenses.forEach((expense) => {
      const date = new Date(expense.data);
      let startMonth = date.getMonth();
      const startYear = date.getFullYear();
      if (expense.forma_pagamento === 'Cartão de Crédito' && expense.dia_vencimento && date.getDate() >= expense.dia_vencimento) startMonth += 1;
      const count = expense.parcelado ? expense.detalhes_parcela?.count || 1 : 1;
      const totalShares = getExpenseShares(expense, members, trip.settings);
      for (let index = 0; index < count; index += 1) {
        const absoluteMonth = startMonth + index;
        const year = startYear + Math.floor(absoluteMonth / 12);
        const month = absoluteMonth % 12;
        const key = `${year}-${month}`;
        const amount = expense.parcelado
          ? index === 0 && expense.detalhes_parcela?.firstValue
            ? expense.detalhes_parcela.firstValue
            : expense.detalhes_parcela?.remainingValue || expense.detalhes_parcela?.valuePerMonth || expense.valor_total / count
          : expense.valor_total;
        const ratio = expense.valor_total ? amount / expense.valor_total : 0;
        const shares = Object.fromEntries(Object.entries(totalShares).map(([uid, value]) => [uid, Number(value) * ratio]));
        const paid = Object.fromEntries(Object.keys(shares).map((uid) => [uid, isInstallmentPaid(expense, index, uid, members, trip.settings)]));
        if (!months[key]) months[key] = { items: [], total: 0, pending: 0 };
        months[key].items.push({ ...expense, installmentIndex: index, installmentAmount: amount, installmentLabel: expense.parcelado ? `${index + 1}/${count}` : 'À vista', shares, paid });
        months[key].total += amount;
        Object.entries(shares).forEach(([uid, value]) => { if (!paid[uid]) months[key].pending += value; });
      }
    });
    return Object.entries(months).sort(([a], [b]) => {
      const [yearA, monthA] = a.split('-').map(Number);
      const [yearB, monthB] = b.split('-').map(Number);
      return yearA - yearB || monthA - monthB;
    });
  }, [expenses, members, trip.settings]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2"><Calendar className="text-teal-400" /> Controle mensal</h3>
      {!monthlyData.length && <div className="text-center text-slate-500 py-8 bg-slate-800 rounded-xl">Nenhuma parcela prevista.</div>}
      {monthlyData.map(([key, monthData]) => {
        const [year, month] = key.split('-').map(Number);
        const label = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const balances = Object.fromEntries(members.map((member) => [member.uid, 0]));
        monthData.items.forEach((item) => {
          const payerUid = getExpensePayerUid(item, members, trip.settings);
          Object.entries(item.shares).forEach(([uid, amount]) => {
            if (!item.paid[uid] && uid !== payerUid) {
              balances[uid] -= amount;
              balances[payerUid] = (balances[payerUid] || 0) + amount;
            }
          });
        });
        const settlements = simplifyBalances(balances, members);
        return (
          <section key={key} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <button onClick={() => setExpanded({ ...expanded, [key]: !expanded[key] })} className="w-full p-4 flex justify-between items-center hover:bg-slate-700/40">
              <div className="text-left"><h4 className="font-bold text-white capitalize">{label}</h4><p className="text-xs text-slate-500">{monthData.items.length} lançamento(s)</p></div>
              <div className="text-right"><p className="font-bold text-white">{formatCurrency(monthData.total)}</p><p className={monthData.pending ? 'text-xs text-orange-400' : 'text-xs text-teal-400'}>{monthData.pending ? `Pendente: ${formatCurrency(monthData.pending)}` : 'Mês quitado'}</p></div>
            </button>
            {expanded[key] && <div className="border-t border-slate-700 divide-y divide-slate-700/50">
              {monthData.items.map((item) => <div key={`${item.id}-${item.installmentIndex}`} className="p-4 bg-slate-900/30">
                <div className="flex justify-between gap-3"><div><p className="text-white font-medium">{item.descricao} <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">{item.installmentLabel}</span></p><p className="text-xs text-slate-500 mt-1">Pago por {getMemberName(getExpensePayerUid(item, members, trip.settings), members)} · {item.nome_cartao || item.forma_pagamento}</p></div><strong className="text-white">{formatCurrency(item.installmentAmount)}</strong></div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">{Object.entries(item.shares).map(([uid, amount]) => <button disabled={!canManage} key={uid} onClick={() => togglePayment(item, uid)} className={`flex justify-between items-center p-2.5 rounded-lg border text-xs ${item.paid[uid] ? 'border-teal-500/30 bg-teal-500/10 text-teal-300' : 'border-slate-700 bg-slate-800 text-slate-300'} disabled:cursor-default`}><span>{getMemberName(uid, members)}</span><span className="flex items-center gap-1">{formatCurrency(amount)} {item.paid[uid] ? <CheckCircle size={15} /> : <Circle size={15} />}</span></button>)}</div>
              </div>)}
              <div className="p-4 bg-slate-900/70"><h5 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3"><ArrowRightLeft size={15} /> Acerto do mês</h5>{settlements.length ? settlements.map((settlement, index) => <div key={index} className="flex justify-between text-sm text-slate-300 py-1"><span>{settlement.from} paga para {settlement.to}</span><strong className="text-amber-400">{formatCurrency(settlement.amount)}</strong></div>) : <p className="text-sm text-teal-400">Nenhum acerto pendente.</p>}</div>
            </div>}
          </section>
        );
      })}
    </div>
  );
};

export default MonthlyView;
