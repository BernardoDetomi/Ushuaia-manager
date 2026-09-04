import React, { useMemo } from 'react';
import { TrendingUp, User, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';
import { getExpensePayerUid, getExpenseShares, getMemberName, getTripMembers } from '../utils/tripFinance';

const SummaryCards = ({ expenses, trip }) => {
  const members = useMemo(() => getTripMembers(trip), [trip]);
  const summary = useMemo(() => {
    const people = Object.fromEntries(members.map((member) => [member.uid, { ...member, paid: 0, share: 0 }]));
    let total = 0;
    expenses.forEach((expense) => {
      const value = Number(expense.valor_total) || 0;
      total += value;
      const payerUid = getExpensePayerUid(expense, members, trip.settings);
      if (people[payerUid]) people[payerUid].paid += value;
      Object.entries(getExpenseShares(expense, members, trip.settings)).forEach(([uid, share]) => {
        if (people[uid]) people[uid].share += Number(share) || 0;
      });
    });
    return { total, people: Object.values(people) };
  }, [expenses, members, trip.settings]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
        <div className="p-2 bg-blue-500/20 rounded-lg inline-flex mb-3"><Wallet className="text-blue-400" size={20} /></div>
        <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.total)}</h3>
        <p className="text-sm text-slate-400 mt-1">Custo total da viagem</p>
      </div>
      {summary.people.map((person) => {
        const balance = person.paid - person.share;
        return (
          <div key={person.uid} className={`bg-slate-800 p-5 rounded-xl border ${balance >= 0 ? 'border-teal-500/30' : 'border-orange-500/30'}`}>
            <div className="flex justify-between gap-3"><div className="p-2 bg-teal-500/20 rounded-lg"><User className="text-teal-400" size={20} /></div><span className="text-xs text-slate-400 truncate">{person.name}</span></div>
            <p className="text-lg font-bold text-white mt-3">Pagou {formatCurrency(person.paid)}</p>
            <p className="text-xs text-slate-500">Parte: {formatCurrency(person.share)}</p>
            <p className={`text-sm font-semibold mt-2 flex items-center gap-1 ${balance >= 0 ? 'text-teal-400' : 'text-orange-400'}`}><TrendingUp size={14} />{balance >= 0 ? `Tem a receber ${formatCurrency(balance)}` : `Deve ${formatCurrency(Math.abs(balance))}`}</p>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
