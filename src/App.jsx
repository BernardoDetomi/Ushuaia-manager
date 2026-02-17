import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { Plus, MapPin } from 'lucide-react';

import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import Countdown from './components/Countdown';
import SummaryCards from './components/SummaryCards';
import ChartsSection from './components/ChartsSection';
import ExpenseList from './components/ExpenseList';
import MonthlyView from './components/MonthlyView';
import ExpenseForm from './components/ExpenseForm';
import SettingsModal from './components/SettingsModal';
import ActivitiesList from './components/ActivitiesList';
import ActivityForm from './components/ActivityForm';
import PendingApproval from './components/PendingApproval';
import PackingChecklist from './components/PackingChecklist';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [settings, setSettings] = useState({ person1: 'Eu', person2: 'Namorada' });
  const [isApproved, setIsApproved] = useState(null); // null = loading, true/false

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setIsApproved(null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Data (Expenses & Settings)
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setActivities([]);
      setChecklistItems([]);
      setIsApproved(null);
      return;
    }

    // Check user approval status
    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsApproved(docSnap.data().approved === true);
      } else {
        // User doc doesn't exist (old user before approval system) — auto-approve
        setDoc(userDocRef, {
          email: user.email,
          approved: true,
          createdAt: new Date().toISOString(),
        });
        setIsApproved(true);
      }
    });

    // Usando coleção pública para compartilhar dados entre contas diferentes
    const expenseQuery = query(
      collection(db, 'expenses'),
      orderBy('data', 'desc')
    );

    const unsubExpenses = onSnapshot(expenseQuery, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setExpenses(docs);
    });

    // Load Activities
    const activitiesQuery = query(
      collection(db, 'activities'),
      orderBy('criado_em', 'desc')
    );

    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setActivities(docs);
    });

    // Load Checklist Items
    const checklistQuery = query(
      collection(db, 'checklist'),
      orderBy('createdAt', 'asc')
    );

    const unsubChecklist = onSnapshot(checklistQuery, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChecklistItems(docs);
    });

    // Load Settings
    const settingsRef = doc(db, 'settings', 'config');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        setDoc(settingsRef, { person1: 'Eu', person2: 'Ela' });
      }
    });

    return () => {
      unsubUser();
      unsubExpenses();
      unsubActivities();
      unsubChecklist();
      unsubSettings();
    };
  }, [user]);

  const saveSettings = async (newSettings) => {
    await setDoc(
      doc(db, 'settings', 'config'),
      newSettings
    );
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este gasto?')) {
      await deleteDoc(doc(db, 'expenses', id));
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-teal-500">
        Carregando...
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  if (isApproved === null || isApproved === false) {
    if (isApproved === null) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-teal-500">
          Verificando acesso...
        </div>
      );
    }
    return <PendingApproval />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-12 font-sans">
      <Header onOpenSettings={() => setShowSettings(true)} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Countdown />

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          {/* Tabs */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full scrollbar-hide">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'monthly'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Faturas / Mensal
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'activities'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Passeios
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'checklist'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bagagem
            </button>
          </div>

          {activeTab === 'activities' ? (
            <button
              onClick={() => setShowActivityForm(true)}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-orange-900/40 transition hover:scale-105"
            >
              <MapPin size={20} />
              <span>Novo Passeio</span>
            </button>
          ) : activeTab !== 'checklist' ? (
            <button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-500 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-teal-900/40 transition hover:scale-105"
            >
              <Plus size={20} />
              <span>Adicionar Gasto</span>
            </button>
          ) : null}
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <SummaryCards expenses={expenses} settings={settings} />
            <ChartsSection expenses={expenses} settings={settings} />
            <ExpenseList expenses={expenses} onDelete={handleDelete} onEdit={(exp) => { setEditingExpense(exp); setShowForm(true); }} settings={settings} />
          </div>
        )}
        {activeTab === 'monthly' && (
          <div>
            <MonthlyView expenses={expenses} settings={settings} />
          </div>
        )}
        {activeTab === 'activities' && (
          <div>
            <ActivitiesList activities={activities} />
          </div>
        )}
        {activeTab === 'checklist' && (
          <div>
            <PackingChecklist items={checklistItems} settings={settings} />
          </div>
        )}
      </main>

      {/* Modals */}
      {showForm && <ExpenseForm onClose={() => { setShowForm(false); setEditingExpense(null); }} settings={settings} editingExpense={editingExpense} />}
      {showActivityForm && <ActivityForm onClose={() => setShowActivityForm(false)} />}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSave={saveSettings}
        />
      )}
    </div>
  );
}
