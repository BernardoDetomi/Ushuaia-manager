import React, { useMemo } from 'react';
import { Wallet, User, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const SummaryCards = ({ expenses, settings, subtitle = 'Custo total da viagem' }) => {
  const summary = useMemo(() => {
    let total = 0;
    let paidByMe = 0;
    let paidByHer = 0;

    expenses.forEach((exp) => {
      const val = parseFloat(exp.valor_total);
      total += val;
      if (exp.quem_pagou === 'person1') paidByMe += val;
      else paidByHer += val;
    });

    const halfTotal = total / 2;
    const myBalance = paidByMe - halfTotal;

    return { total, paidByMe, paidByHer, myBalance };
  }, [expenses]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Wallet className="text-blue-400" size={20} />
          </div>
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">Total</span>
        </div>
        <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.total)}</h3>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </div>

      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <User className="text-teal-400" size={20} />
          </div>
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded truncate max-w-[120px]">
            {settings.person1} pagou
          </span>
        </div>
        <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.paidByMe)}</h3>
      </div>

      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Users className="text-purple-400" size={20} />
          </div>
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded truncate max-w-[120px]">
            {settings.person2} pagou
          </span>
        </div>
        <h3 className="text-2xl font-bold text-white">{formatCurrency(summary.paidByHer)}</h3>
      </div>

      <div
        className={`bg-slate-800 p-5 rounded-xl border shadow-sm ${
          summary.myBalance >= 0 ? 'border-teal-500/50' : 'border-red-500/50'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div
            className={`p-2 rounded-lg ${
              summary.myBalance >= 0 ? 'bg-teal-500/20' : 'bg-red-500/20'
            }`}
          >
            <TrendingUp
              className={summary.myBalance >= 0 ? 'text-teal-400' : 'text-red-400'}
              size={20}
            />
          </div>
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">Acerto</span>
        </div>
        <h3
          className={`text-2xl font-bold ${
            summary.myBalance >= 0 ? 'text-teal-400' : 'text-red-400'
          }`}
        >
          {formatCurrency(Math.abs(summary.myBalance))}
        </h3>
        <p className="text-sm text-slate-300 mt-1 truncate">
          {summary.myBalance === 0
            ? 'Tudo quitado!'
            : summary.myBalance > 0
              ? `${settings.person2} deve`
              : `${settings.person1} deve`}
        </p>
      </div>
    </div>
  );
};

export default SummaryCards;
