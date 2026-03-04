export const SPLIT_CATEGORIES = [
  'Mercado', 'Aluguel', 'Energia', 'Água', 'Internet', 'Gás',
  'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Pet',
  'Assinaturas', 'Educação', 'Outros',
];

export const GROUP_TYPES = {
  mensal: {
    label: 'Mensal',
    bgClass: 'bg-indigo-500/20',
    textClass: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10',
  },
  viagem: {
    label: 'Viagem',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-400',
    badgeBg: 'bg-orange-500/10',
  },
  fixo: {
    label: 'Fixo',
    bgClass: 'bg-teal-500/20',
    textClass: 'text-teal-400',
    badgeBg: 'bg-teal-500/10',
  },
};

export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#64748b',
];

/**
 * Get the per-person split amounts for an expense.
 */
export function getExpenseSplits(expense) {
  const splits = {};
  const participants = expense.splitBetween || [];

  if (expense.splitType === 'percentage') {
    participants.forEach((p) => {
      splits[p] = expense.amount * ((expense.splitDetails?.[p] || 0) / 100);
    });
  } else if (expense.splitType === 'custom') {
    participants.forEach((p) => {
      splits[p] = expense.splitDetails?.[p] || 0;
    });
  } else {
    // equal
    const share = expense.amount / (participants.length || 1);
    participants.forEach((p) => {
      splits[p] = share;
    });
  }

  return splits;
}

/**
 * Calculate net balances for each participant.
 * Positive = is owed money. Negative = owes money.
 */
export function calculateBalances(expenses, payments, participants) {
  const balance = {};
  participants.forEach((p) => {
    balance[p] = 0;
  });

  expenses.forEach((exp) => {
    if (!balance.hasOwnProperty(exp.paidBy)) balance[exp.paidBy] = 0;
    balance[exp.paidBy] += exp.amount;

    const splits = getExpenseSplits(exp);
    Object.entries(splits).forEach(([person, share]) => {
      if (!balance.hasOwnProperty(person)) balance[person] = 0;
      balance[person] -= share;
    });
  });

  payments.forEach((pay) => {
    if (!balance.hasOwnProperty(pay.from)) balance[pay.from] = 0;
    if (!balance.hasOwnProperty(pay.to)) balance[pay.to] = 0;
    balance[pay.from] += pay.amount;
    balance[pay.to] -= pay.amount;
  });

  return balance;
}

/**
 * Simplify debts so the fewest transactions settle all balances.
 * Returns { balance, transactions } where transactions = [{ from, to, amount }].
 */
export function simplifyDebts(expenses, payments, participants) {
  const balance = calculateBalances(expenses, payments, participants);

  const creditors = [];
  const debtors = [];

  Object.entries(balance).forEach(([person, amount]) => {
    if (amount > 0.01) creditors.push({ person, amount });
    else if (amount < -0.01) debtors.push({ person, amount: -amount });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      transactions.push({
        from: debtors[i].person,
        to: creditors[j].person,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return { balance, transactions };
}
