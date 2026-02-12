import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Calendar, CheckCircle, Circle, User, Users } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const MonthlyView = ({ expenses, settings }) => {
  const [expandedMonths, setExpandedMonths] = useState({});

  const toggleMonth = (monthKey) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const togglePayment = async (expenseId, key, currentPaidMap) => {
    // key format: "installmentIndex_person1" or "installmentIndex_person2"
    const newPaidMap = { ...currentPaidMap };
    if (newPaidMap[key]) {
      delete newPaidMap[key];
    } else {
      newPaidMap[key] = true;
    }

    try {
      const docRef = doc(db, 'expenses', expenseId);
      await updateDoc(docRef, { parcelas_pagas_v2: newPaidMap });
    } catch (err) {
      console.error('Error updating payment:', err);
    }
  };

  const monthlyData = useMemo(() => {
    const data = {};

    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.data);
      let startMonth = expenseDate.getMonth();
      let startYear = expenseDate.getFullYear();

      // Ajuste de fatura: se comprou depois do dia de vencimento, joga pro próximo mês
      if (expense.forma_pagamento === 'Cartão de Crédito' && expense.dia_vencimento) {
        if (expenseDate.getDate() >= expense.dia_vencimento) {
          startMonth++;
        }
      }

      const count = expense.parcelado ? expense.detalhes_parcela?.count || 1 : 1;

      for (let i = 0; i < count; i++) {
        let currentMonth = startMonth + i;
        let year = startYear + Math.floor(currentMonth / 12);
        let month = currentMonth % 12;

        const monthKey = `${year}-${month}`;

        let amount = 0;
        if (expense.parcelado) {
          if (i === 0 && expense.detalhes_parcela?.firstValue) {
            amount = expense.detalhes_parcela.firstValue;
          } else if (expense.detalhes_parcela?.remainingValue) {
            amount = expense.detalhes_parcela.remainingValue;
          } else {
            amount = expense.detalhes_parcela?.valuePerMonth || expense.valor_total / count;
          }
        } else {
          amount = expense.valor_total;
        }

        if (!data[monthKey]) data[monthKey] = { items: [], total: 0, pending: 0 };

        const halfAmount = amount / 2;
        // Support both old (parcelas_pagas array) and new (parcelas_pagas_v2 map) format
        const paidMap = expense.parcelas_pagas_v2 || {};
        // Migrate old format: if old array has this index, treat both halves as paid
        const oldPaidList = expense.parcelas_pagas || [];
        const p1Key = `${i}_person1`;
        const p2Key = `${i}_person2`;
        const isPaidP1 = paidMap[p1Key] || (!expense.parcelas_pagas_v2 && oldPaidList.includes(i));
        const isPaidP2 = paidMap[p2Key] || (!expense.parcelas_pagas_v2 && oldPaidList.includes(i));

        data[monthKey].items.push({
          ...expense,
          installmentIndex: i,
          installmentAmount: amount,
          halfAmount,
          isPaidP1,
          isPaidP2,
          paidMap,
          installmentLabel: expense.parcelado ? `${i + 1}/${count}` : 'À vista',
        });

        data[monthKey].total += amount;
        if (!isPaidP1) data[monthKey].pending += halfAmount;
        if (!isPaidP2) data[monthKey].pending += halfAmount;
      }
    });

    // Sort months
    return Object.entries(data).sort((a, b) => {
      const [yearA, monthA] = a[0].split('-').map(Number);
      const [yearB, monthB] = b[0].split('-').map(Number);
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
  }, [expenses]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <Calendar className="text-teal-400" /> Controle Mensal (Faturas)
      </h3>

      {monthlyData.length === 0 ? (
        <div className="text-center text-slate-500 py-8 bg-slate-800 rounded-xl">
          Nenhuma parcela prevista.
        </div>
      ) : (
        monthlyData.map(([key, { items, total, pending }]) => {
          const [year, month] = key.split('-').map(Number);
          const date = new Date(year, month);
          const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const isExpanded = expandedMonths[key];
          const allPaid = pending === 0;

          return (
            <div
              key={key}
              className={`bg-slate-800 rounded-xl border transition overflow-hidden ${
                allPaid ? 'border-teal-900/50 opacity-70' : 'border-slate-700'
              }`}
            >
              <div
                onClick={() => toggleMonth(key)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/50 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      allPaid ? 'bg-teal-500/10 text-teal-500' : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white capitalize">{monthName}</h4>
                    <p className="text-xs text-slate-400">{items.length} lançamentos</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{formatCurrency(total)}</div>
                  <div
                    className={`text-xs ${pending === 0 ? 'text-teal-500' : 'text-orange-400'}`}
                  >
                    {pending === 0 ? 'Mês Quitado' : `Falta: ${formatCurrency(pending)}`}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-900/50 border-t border-slate-700 divide-y divide-slate-700/50">
                  {items.map((item, idx) => {
                    const p1Key = `${item.installmentIndex}_person1`;
                    const p2Key = `${item.installmentIndex}_person2`;
                    const bothPaid = item.isPaidP1 && item.isPaidP2;

                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        className={`p-4 hover:bg-slate-800/50 ${bothPaid ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{item.descricao}</span>
                              <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                                {item.installmentLabel}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>
                                {item.quem_pagou === 'person1' ? settings.person1 : settings.person2}
                              </span>
                              <span>&bull;</span>
                              <span>{item.nome_cartao || item.forma_pagamento}</span>
                              {item.dia_vencimento && (
                                <>
                                  <span>&bull;</span>
                                  <span className="text-orange-400">Venc. dia {item.dia_vencimento}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">
                              {formatCurrency(item.installmentAmount)}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {formatCurrency(item.halfAmount)} / pessoa
                            </div>
                          </div>
                        </div>

                        {/* Per-person payment toggles */}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePayment(item.id, p1Key, item.paidMap);
                            }}
                            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition border ${
                              item.isPaidP1
                                ? 'border-teal-500/30 bg-teal-500/10 text-teal-300'
                                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <User size={14} />
                              {settings.person1}
                            </span>
                            <span className="flex items-center gap-1.5">
                              {formatCurrency(item.halfAmount)}
                              {item.isPaidP1 ? <CheckCircle size={16} /> : <Circle size={16} />}
                            </span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePayment(item.id, p2Key, item.paidMap);
                            }}
                            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition border ${
                              item.isPaidP2
                                ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                                : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Users size={14} />
                              {settings.person2}
                            </span>
                            <span className="flex items-center gap-1.5">
                              {formatCurrency(item.halfAmount)}
                              {item.isPaidP2 ? <CheckCircle size={16} /> : <Circle size={16} />}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MonthlyView;
