import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { Calendar, CheckCircle, Circle } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const MonthlyView = ({ expenses, settings }) => {
  const [expandedMonths, setExpandedMonths] = useState({});

  const toggleMonth = (monthKey) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  const togglePayment = async (expenseId, installmentIndex, currentPaidList) => {
    const isPaid = currentPaidList.includes(installmentIndex);
    let newPaidList;
    if (isPaid) {
      newPaidList = currentPaidList.filter((i) => i !== installmentIndex);
    } else {
      newPaidList = [...currentPaidList, installmentIndex];
    }

    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'expenses', expenseId);
      await updateDoc(docRef, { parcelas_pagas: newPaidList });
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

        const isPaid = expense.parcelas_pagas?.includes(i);

        data[monthKey].items.push({
          ...expense,
          installmentIndex: i,
          installmentAmount: amount,
          isPaid,
          installmentLabel: expense.parcelado ? `${i + 1}/${count}` : 'À vista',
        });

        data[monthKey].total += amount;
        if (!isPaid) data[monthKey].pending += amount;
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
                  {items.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="p-4 flex items-center justify-between hover:bg-slate-800/50"
                    >
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
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold">
                          {formatCurrency(item.installmentAmount)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePayment(
                              item.id,
                              item.installmentIndex,
                              item.parcelas_pagas || []
                            );
                          }}
                          className={`p-2 rounded-full transition ${
                            item.isPaid
                              ? 'text-teal-400 bg-teal-400/10 hover:bg-teal-400/20'
                              : 'text-slate-500 hover:text-white hover:bg-slate-700'
                          }`}
                          title={item.isPaid ? 'Pago' : 'Marcar como Pago'}
                        >
                          {item.isPaid ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </button>
                      </div>
                    </div>
                  ))}
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
