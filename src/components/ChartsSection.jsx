import React, { useMemo } from 'react';
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
import { formatCurrency } from '../utils/formatCurrency';
import { COLORS } from '../utils/constants';

const ChartsSection = ({ expenses, settings }) => {
  const categoryData = useMemo(() => {
    const data = {};
    expenses.forEach((exp) => {
      data[exp.categoria] = (data[exp.categoria] || 0) + parseFloat(exp.valor_total);
    });
    return Object.keys(data).map((key) => ({ name: key, value: data[key] }));
  }, [expenses]);

  const payerData = useMemo(() => {
    let p1 = 0,
      p2 = 0;
    expenses.forEach((exp) => {
      if (exp.quem_pagou === 'person1') p1 += parseFloat(exp.valor_total);
      else p2 += parseFloat(exp.valor_total);
    });
    return [
      { name: settings.person1, valor: p1 },
      { name: settings.person2, valor: p2 },
    ];
  }, [expenses, settings]);

  if (expenses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-white mb-4">Gastos por Categoria</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  color: '#fff',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
        <h3 className="text-lg font-bold text-white mb-4">Quem Pagou Mais?</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={payerData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(val) => `R$${val / 1000}k`} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  color: '#fff',
                }}
              />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={50}>
                {payerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#2dd4bf' : '#a855f7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
