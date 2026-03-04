import React, { useMemo } from 'react';
import { Wallet, Users, TrendingUp, ArrowRight, Lock, Target } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';
import { CATEGORY_COLORS, getExpenseSplits } from './splitUtils';

const SplitDashboard = ({ group, expenses, payments, debtInfo, onPayDebt, onCloseMonth }) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const isMonthClosed = (group.closedMonths || []).includes(currentMonth);

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => e.date && e.date.startsWith(currentMonth));
  }, [expenses, currentMonth]);

  const stats = useMemo(() => {
    let total = 0;
    const perPerson = {};
    const perCategory = {};

    (group.participants || []).forEach((p) => {
      perPerson[p] = { paid: 0, owes: 0 };
    });

    monthlyExpenses.forEach((exp) => {
      total += exp.amount;
      if (!perPerson[exp.paidBy]) perPerson[exp.paidBy] = { paid: 0, owes: 0 };
      perPerson[exp.paidBy].paid += exp.amount;

      const splits = getExpenseSplits(exp);
      Object.entries(splits).forEach(([person, share]) => {
        if (!perPerson[person]) perPerson[person] = { paid: 0, owes: 0 };
        perPerson[person].owes += share;
      });

      const cat = exp.category || 'Outros';
      perCategory[cat] = (perCategory[cat] || 0) + exp.amount;
    });

    return { total, perPerson, perCategory };
  }, [monthlyExpenses, group.participants]);

  // All-time stats
  const allTimeStats = useMemo(() => {
    let total = 0;
    expenses.forEach((exp) => {
      total += exp.amount;
    });
    return { total, count: expenses.length };
  }, [expenses]);

  const categoryData = Object.entries(stats.perCategory)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const personData = Object.entries(stats.perPerson).map(([name, data]) => ({
    name,
    Pagou: Math.round(data.paid * 100) / 100,
    Deve: Math.round(data.owes * 100) / 100,
  }));

  const budgetProgress = group.monthlyBudget ? (stats.total / group.monthlyBudget) * 100 : null;

  const personColors = ['#6366f1', '#a855f7', '#ec4899', '#f97316', '#22c55e', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Wallet className="text-indigo-400" size={18} />
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
              Mês
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(stats.total)}
          </h3>
          <p className="text-xs text-slate-500 mt-1 capitalize">{currentMonthLabel}</p>
        </div>

        <div className="bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wallet className="text-blue-400" size={18} />
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
              Total
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(allTimeStats.total)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{allTimeStats.count} despesas</p>
        </div>

        {(group.participants || []).slice(0, 2).map((person, idx) => (
          <div key={person} className="bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-700">
            <div className="flex justify-between items-start mb-2">
              <div
                className={`p-2 ${idx === 0 ? 'bg-teal-500/20' : 'bg-purple-500/20'} rounded-lg`}
              >
                <Users
                  className={idx === 0 ? 'text-teal-400' : 'text-purple-400'}
                  size={18}
                />
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-700 px-2 py-0.5 rounded truncate max-w-[80px]">
                {person}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              {formatCurrency(stats.perPerson[person]?.paid || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Deve: {formatCurrency(stats.perPerson[person]?.owes || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Budget Progress */}
      {budgetProgress !== null && (
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="text-amber-400" size={18} />
              <span className="text-sm font-bold text-white">Meta Mensal</span>
            </div>
            <span className="text-sm text-slate-400">
              {formatCurrency(stats.total)} / {formatCurrency(group.monthlyBudget)}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                budgetProgress > 100
                  ? 'bg-red-500'
                  : budgetProgress > 80
                    ? 'bg-amber-500'
                    : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
          {budgetProgress > 80 && (
            <p
              className={`text-xs mt-2 ${budgetProgress > 100 ? 'text-red-400' : 'text-amber-400'}`}
            >
              {budgetProgress > 100
                ? `Orçamento estourado em ${formatCurrency(stats.total - group.monthlyBudget)}`
                : `${Math.round(budgetProgress)}% do orçamento utilizado`}
            </p>
          )}
        </div>
      )}

      {/* Simplified Debts — "Quem deve quem" */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-amber-400" size={18} />
            Quem Deve Quem
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Saldo simplificado entre todos</p>
        </div>
        <div className="p-5">
          {debtInfo.transactions.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="text-teal-400" size={24} />
              </div>
              <p className="text-teal-400 font-medium">Tudo quitado!</p>
              <p className="text-slate-500 text-xs">Nenhuma dívida pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debtInfo.transactions.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900/60 rounded-xl p-4 border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                      {t.from.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white font-semibold">{t.from}</span>
                        <ArrowRight size={14} className="text-amber-400" />
                        <span className="text-white font-semibold">{t.to}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Pagamento pendente</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-amber-400">
                      {formatCurrency(t.amount)}
                    </span>
                    <button
                      onClick={() => onPayDebt(t)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-person balance summary */}
        {(group.participants || []).length > 0 && (
          <div className="px-5 pb-5">
            <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700/50">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-bold">
                Saldo por pessoa
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(debtInfo.balance).map(([person, bal]) => (
                  <div key={person} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                      {person.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">{person}</span>
                      <span
                        className={`block text-xs font-bold ${
                          bal >= 0 ? 'text-teal-400' : 'text-red-400'
                        }`}
                      >
                        {bal >= 0 ? '+' : ''}
                        {formatCurrency(bal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {categoryData.length > 0 && (
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <h4 className="text-sm font-bold text-white mb-4">Gastos por Categoria (Mês)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {categoryData.map((item, i) => (
                <span
                  key={item.name}
                  className="text-[10px] text-slate-400 flex items-center gap-1"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  {item.name}: {formatCurrency(item.value)}
                </span>
              ))}
            </div>
          </div>
        )}

        {personData.length > 0 && (
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
            <h4 className="text-sm font-bold text-white mb-4">Pagou vs Deve (Mês)</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={personData}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Pagou" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Deve" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Monthly Close */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        {!isMonthClosed ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-white font-bold flex items-center gap-2">
                <Lock size={16} className="text-slate-400" />
                Fechamento Mensal
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Congele as despesas de{' '}
                <span className="capitalize">{currentMonthLabel}</span> e gere o resumo final
              </p>
            </div>
            <button
              onClick={onCloseMonth}
              className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition whitespace-nowrap"
            >
              Fechar Mês
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 text-teal-400">
              <Lock size={16} />
              <span className="font-medium text-sm">
                {currentMonthLabel} — mês fechado, despesas congeladas
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitDashboard;
