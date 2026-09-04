import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query as fQuery,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  ChevronLeft,
  Plus,
  ArrowLeftRight,
  Receipt,
  RefreshCw,
  BarChart3,
  Settings,
  Users,
  X,
  Trash2,
  UserPlus,
  Share2,
} from 'lucide-react';
import { GROUP_TYPES, simplifyDebts } from './splitUtils';
import SplitDashboard from './SplitDashboard';
import SplitExpenseForm from './SplitExpenseForm';
import SplitExpenseList from './SplitExpenseList';
import SplitPayments from './SplitPayments';
import SplitRecurring from './SplitRecurring';
import AccessManager from '../AccessManager';

const GroupDetail = ({ group, user, settings, onBack }) => {
  const canManage = (group.ownerUid || group.createdBy) === user.uid;
  const [tab, setTab] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [recurringItems, setRecurringItems] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentPreset, setPaymentPreset] = useState(null);
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  // Group settings form state
  const [gsName, setGsName] = useState(group.name);
  const [gsParticipants, setGsParticipants] = useState([...(group.participants || [])]);
  const [gsBudget, setGsBudget] = useState(group.monthlyBudget?.toString() || '');
  const [gsInviteEmail, setGsInviteEmail] = useState('');

  // Load expenses
  useEffect(() => {
    const q = fQuery(
      collection(db, 'split_groups', group.id, 'expenses'),
      orderBy('date', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [group.id]);

  // Load payments
  useEffect(() => {
    const q = fQuery(
      collection(db, 'split_groups', group.id, 'payments'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [group.id]);

  // Load recurring
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'split_groups', group.id, 'recurring'),
      (snap) => {
        setRecurringItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, [group.id]);

  // Auto-generate recurring expenses
  useEffect(() => {
    if (!canManage || recurringItems.length === 0) return;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    recurringItems.forEach(async (item) => {
      if (!item.active) return;
      if (item.lastGenerated >= currentMonth) return;

      // Check if already generated for this month
      const existsForMonth = expenses.some(
        (e) => e.recurringId === item.id && e.date && e.date.startsWith(currentMonth)
      );
      if (existsForMonth) return;

      try {
        const day = item.dayOfMonth || 1;
        const expDate = `${currentMonth}-${String(day).padStart(2, '0')}`;

        await addDoc(collection(db, 'split_groups', group.id, 'expenses'), {
          description: item.description,
          amount: item.amount,
          paidBy: item.paidBy,
          splitBetween: item.splitBetween,
          splitType: item.splitType || 'equal',
          splitDetails: item.splitDetails || {},
          category: item.category,
          date: expDate,
          notes: `Gerado automaticamente (${item.frequency})`,
          recurringId: item.id,
          isRecurring: true,
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
        });

        await updateDoc(doc(db, 'split_groups', group.id, 'recurring', item.id), {
          lastGenerated: currentMonth,
        });
      } catch (err) {
        console.error('Error generating recurring:', err);
      }
    });
  }, [recurringItems, expenses, group.id]);

  const debtInfo = useMemo(() => {
    return simplifyDebts(expenses, payments, group.participants || []);
  }, [expenses, payments, group.participants]);

  const handleDeleteExpense = async (id) => {
    if (!canManage) return;
    if (confirm('Excluir esta despesa?')) {
      await deleteDoc(doc(db, 'split_groups', group.id, 'expenses', id));
    }
  };

  const handleDeletePayment = async (id) => {
    if (!canManage) return;
    if (confirm('Excluir este pagamento?')) {
      await deleteDoc(doc(db, 'split_groups', group.id, 'payments', id));
    }
  };

  const handlePayDebt = (transaction) => {
    setPaymentPreset(transaction);
    setShowPaymentForm(true);
  };

  const handleCloseMonth = async () => {
    if (!canManage) return;
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (
      confirm(
        `Fechar o mês de ${monthLabel}? Despesas deste mês não poderão mais ser editadas.`
      )
    ) {
      const closedMonths = [...(group.closedMonths || []), monthStr];
      await updateDoc(doc(db, 'split_groups', group.id), { closedMonths });
    }
  };

  const handleSaveGroupSettings = async () => {
    const clean = gsParticipants.filter((p) => p.trim()).map((p) => p.trim());
    if (!canManage || !gsName.trim() || clean.length < 1) return;

    try {
      await updateDoc(doc(db, 'split_groups', group.id), {
        name: gsName.trim(),
        participants: clean,
        monthlyBudget: gsBudget ? parseFloat(gsBudget) : null,
      });
      setShowGroupSettings(false);
    } catch (err) {
      console.error('Error updating group:', err);
    }
  };

  const handleInviteUser = async () => {
    if (!gsInviteEmail.trim()) return;
    try {
      const usersQ = fQuery(collection(db, 'users'), where('email', '==', gsInviteEmail.trim()));
      const snap = await getDocs(usersQ);
      if (snap.empty) {
        alert('Usuário não encontrado. Ele precisa ter uma conta no app.');
        return;
      }
      const invitedUid = snap.docs[0].id;
      if (group.memberUids?.includes(invitedUid)) {
        alert('Este usuário já tem acesso ao grupo.');
        return;
      }
      await updateDoc(doc(db, 'split_groups', group.id), {
        memberUids: [...(group.memberUids || []), invitedUid],
      });
      setGsInviteEmail('');
      alert('Usuário adicionado com sucesso!');
    } catch (err) {
      console.error('Error inviting user:', err);
      alert('Erro ao convidar usuário.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!canManage) return;
    if (
      confirm(
        'Tem certeza que deseja excluir este grupo? Todas as despesas e pagamentos serão perdidos.'
      )
    ) {
      try {
        await deleteDoc(doc(db, 'split_groups', group.id));
        onBack();
      } catch (err) {
        console.error('Error deleting group:', err);
      }
    }
  };

  const typeInfo = GROUP_TYPES[group.type] || GROUP_TYPES.mensal;

  const tabs = [
    { key: 'dashboard', label: 'Resumo', icon: BarChart3 },
    { key: 'expenses', label: 'Despesas', icon: Receipt },
    { key: 'payments', label: 'Acertos', icon: ArrowLeftRight },
    { key: 'recurring', label: 'Recorrentes', icon: RefreshCw },
  ];

  return (
    <div>
      {/* Group Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-3 transition"
        >
          <ChevronLeft size={16} /> Voltar aos grupos
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{group.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${typeInfo.badgeBg} ${typeInfo.textClass}`}
              >
                {typeInfo.label}
              </span>
              <span className="text-xs text-slate-500">
                {group.participants?.length} participantes
              </span>
              <div className="flex -space-x-1.5 ml-1">
                {(group.participants || []).slice(0, 5).map((p, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[9px] text-slate-300 font-bold"
                    title={p}
                  >
                    {p.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {canManage && <button
            onClick={() => {
              setGsName(group.name);
              setGsParticipants([...(group.participants || [])]);
              setGsBudget(group.monthlyBudget?.toString() || '');
              setShowGroupSettings(true);
            }}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            title="Configurações do grupo"
          >
            <Settings size={20} />
          </button>}
        </div>
      </div>

      {/* Tabs + Action */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full scrollbar-hide">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                tab === key
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'expenses' && (
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowExpenseForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition hover:scale-105"
          >
            <Plus size={18} /> Nova Despesa
          </button>
        )}
        {tab === 'payments' && (
          <button
            onClick={() => {
              setPaymentPreset(null);
              setShowPaymentForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition hover:scale-105"
          >
            <Plus size={18} /> Registrar Pagamento
          </button>
        )}
      </div>

      {/* Tab Content */}
      {tab === 'dashboard' && (
        <SplitDashboard
          group={group}
          expenses={expenses}
          payments={payments}
          debtInfo={debtInfo}
          onPayDebt={handlePayDebt}
          onCloseMonth={handleCloseMonth}
          canManage={canManage}
        />
      )}
      {tab === 'expenses' && (
        <SplitExpenseList
          expenses={expenses}
          group={group}
          onDelete={handleDeleteExpense}
          onEdit={(exp) => {
            if (canManage) {
              setEditingExpense(exp);
              setShowExpenseForm(true);
            }
          }}
          canManage={canManage}
        />
      )}
      {tab === 'payments' && (
        <SplitPayments
          group={group}
          payments={payments}
          debtInfo={debtInfo}
          onPayDebt={handlePayDebt}
          onDeletePayment={handleDeletePayment}
          canManage={canManage}
          showForm={showPaymentForm}
          onCloseForm={() => {
            setShowPaymentForm(false);
            setPaymentPreset(null);
          }}
          preset={paymentPreset}
          user={user}
        />
      )}
      {tab === 'recurring' && (
        <SplitRecurring group={group} recurringItems={recurringItems} user={user} canManage={canManage} />
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <SplitExpenseForm
          group={group}
          user={user}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          editingExpense={editingExpense}
        />
      )}

      {/* Group Settings Modal */}
      {showGroupSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="text-indigo-400" /> Configurações do Grupo
              </h2>
              <button
                onClick={() => setShowGroupSettings(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nome do Grupo</label>
                <input
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  value={gsName}
                  onChange={(e) => setGsName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Participantes</label>
                <div className="space-y-2">
                  {gsParticipants.map((p, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                        value={p}
                        onChange={(e) => {
                          const u = [...gsParticipants];
                          u[idx] = e.target.value;
                          setGsParticipants(u);
                        }}
                      />
                      {false && (
                        <button
                          onClick={() =>
                            setGsParticipants(gsParticipants.filter((_, i) => i !== idx))
                          }
                          className="p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {false && <button
                  onClick={() => setGsParticipants([...gsParticipants, ''])}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1"
                >
                  <UserPlus size={14} /> Adicionar participante
                </button>}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Meta Mensal (Opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  placeholder="R$ 0.00"
                  value={gsBudget}
                  onChange={(e) => setGsBudget(e.target.value)}
                />
              </div>

              <AccessManager resourceType="split" resource={group} user={user} accent="indigo" />

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setShowGroupSettings(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveGroupSettings}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition"
                >
                  Salvar
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <button
                  onClick={handleDeleteGroup}
                  className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 py-3 rounded-lg text-sm font-medium transition"
                >
                  <Trash2 size={14} /> Excluir Grupo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupDetail;
