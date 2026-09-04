import React, { useMemo } from 'react';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COLORS } from '../utils/constants';
import { formatCurrency } from '../utils/formatCurrency';
import { getExpensePayerUid, getMemberName, getTripMembers } from '../utils/tripFinance';

const ChartsSection = ({ expenses, trip }) => {
  const members = useMemo(() => getTripMembers(trip), [trip]);
  const categoryData = useMemo(() => {
    const totals = {};
    expenses.forEach((expense) => { totals[expense.categoria] = (totals[expense.categoria] || 0) + Number(expense.valor_total || 0); });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [expenses]);
  const payerData = useMemo(() => {
    const totals = Object.fromEntries(members.map((member) => [member.uid, 0]));
    expenses.forEach((expense) => {
      const uid = getExpensePayerUid(expense, members, trip.settings);
      totals[uid] = (totals[uid] || 0) + Number(expense.valor_total || 0);
    });
    return Object.entries(totals).map(([uid, valor]) => ({ name: getMemberName(uid, members), valor }));
  }, [expenses, members, trip.settings]);

  if (!expenses.length) return null;
  const tooltipStyle = { backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' };
  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <Chart title="Gastos por categoria"><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">{categoryData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={formatCurrency} contentStyle={tooltipStyle} /><Legend /></PieChart></Chart>
      <Chart title="Total pago por participante"><BarChart data={payerData}><XAxis dataKey="name" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip formatter={formatCurrency} contentStyle={tooltipStyle} /><Bar dataKey="valor" radius={[4, 4, 0, 0]}>{payerData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></Chart>
    </div>
  );
};

const Chart = ({ title, children }) => <div className="bg-slate-800 p-5 rounded-xl border border-slate-700"><h3 className="text-lg font-bold text-white mb-4">{title}</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div></div>;

export default ChartsSection;
