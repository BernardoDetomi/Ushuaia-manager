import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { ChevronLeft, MapPin, Plus } from 'lucide-react';
import { db } from '../config/firebase';
import Countdown from './Countdown';
import SummaryCards from './SummaryCards';
import ChartsSection from './ChartsSection';
import ExpenseList from './ExpenseList';
import MonthlyView from './MonthlyView';
import ExpenseForm from './ExpenseForm';
import ActivitiesList from './ActivitiesList';
import ActivityForm from './ActivityForm';
import PackingChecklist from './PackingChecklist';
import SettingsModal from './SettingsModal';

const TripWorkspace = ({ trip, user, onBack, openSettingsSignal = 0 }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const canManage = trip.ownerUid === user.uid;

  useEffect(() => {
    if (openSettingsSignal > 0) setShowSettings(true);
  }, [openSettingsSignal]);

  useEffect(() => {
    const unsubExpenses = onSnapshot(query(collection(db, 'trips', trip.id, 'expenses'), orderBy('data', 'desc')), (snap) => setExpenses(snap.docs.map((item) => ({ id: item.id, ...item.data() }))));
    const unsubActivities = onSnapshot(query(collection(db, 'trips', trip.id, 'activities'), orderBy('criado_em', 'desc')), (snap) => setActivities(snap.docs.map((item) => ({ id: item.id, ...item.data() }))));
    const unsubChecklist = onSnapshot(collection(db, 'trips', trip.id, 'checklist'), (snap) => setChecklist(snap.docs.map((item) => ({ id: item.id, ...item.data() }))));
    return () => { unsubExpenses(); unsubActivities(); unsubChecklist(); };
  }, [trip.id]);

  const removeExpense = async (id) => {
    if (!canManage) return;
    if (confirm('Tem certeza que deseja excluir este gasto?')) await deleteDoc(doc(db, 'trips', trip.id, 'expenses', id));
  };

  const tabs = [
    ['dashboard', 'Visão Geral'],
    ['monthly', 'Faturas / Mensal'],
    ['activities', 'Passeios'],
    ['checklist', 'Bagagem'],
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={onBack} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 mb-4"><ChevronLeft size={16} /> Voltar às viagens</button>
      <Countdown trip={trip} />
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full">
          {tabs.map(([key, label]) => <button key={key} onClick={() => setActiveTab(key)} className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap ${activeTab === key ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`}>{label}</button>)}
        </div>
        {activeTab === 'activities' ? (
          <button onClick={() => setShowActivityForm(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"><MapPin size={20} /> Novo passeio</button>
        ) : activeTab !== 'checklist' ? (
          <button onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }} className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"><Plus size={20} /> Adicionar gasto</button>
        ) : null}
      </div>

      {activeTab === 'dashboard' && <><SummaryCards expenses={expenses} trip={trip} /><ChartsSection expenses={expenses} trip={trip} /><ExpenseList expenses={expenses} onDelete={removeExpense} onEdit={(expense) => { if (canManage) { setEditingExpense(expense); setShowExpenseForm(true); } }} trip={trip} canManage={canManage} /></>}
      {activeTab === 'monthly' && <MonthlyView expenses={expenses} trip={trip} canManage={canManage} />}
      {activeTab === 'activities' && <ActivitiesList activities={activities} tripId={trip.id} canManage={canManage} />}
      {activeTab === 'checklist' && <PackingChecklist items={checklist} trip={trip} user={user} canManage={canManage} />}

      {showExpenseForm && <ExpenseForm onClose={() => { setShowExpenseForm(false); setEditingExpense(null); }} editingExpense={editingExpense} trip={trip} user={user} />}
      {showActivityForm && <ActivityForm onClose={() => setShowActivityForm(false)} tripId={trip.id} user={user} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} trip={trip} user={user} />}
    </main>
  );
};

export default TripWorkspace;
