import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Settings, UserCheck, UserX, Shield } from 'lucide-react';

const SettingsModal = ({ onClose, settings, onSave }) => {
  const [names, setNames] = useState(settings || { person1: 'Eu', person2: 'Ela' });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeSection, setActiveSection] = useState('names');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPendingUsers(users.filter((u) => !u.approved));
      }
    );
    return () => unsub();
  }, []);

  const handleSave = () => {
    onSave(names);
    onClose();
  };

  const handleApprove = async (userId) => {
    await updateDoc(doc(db, 'users', userId), {
      approved: true,
    });
  };

  const handleReject = async (userId) => {
    if (confirm('Tem certeza que deseja rejeitar e remover este usuário?')) {
      await deleteDoc(doc(db, 'users', userId));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="text-teal-400" /> Configurações
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Section Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-lg mb-4 border border-slate-700">
          <button
            onClick={() => setActiveSection('names')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              activeSection === 'names' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Nomes
          </button>
          <button
            onClick={() => setActiveSection('access')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition relative ${
              activeSection === 'access' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Acessos
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>

        {activeSection === 'names' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome da Pessoa 1 (Você)</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                value={names.person1}
                onChange={(e) => setNames({ ...names, person1: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nome da Pessoa 2 (Parceiro/a)</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-teal-500 outline-none"
                value={names.person2}
                onChange={(e) => setNames({ ...names, person2: e.target.value })}
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg mt-4 transition"
            >
              Salvar Configurações
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
              <Shield size={16} className="text-teal-400" />
              <span>Gerencie quem pode acessar o app</span>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <UserCheck size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma solicitação pendente.</p>
              </div>
            ) : (
              pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-medium text-sm">{u.email}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(u.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(u.id)}
                      className="bg-teal-600 hover:bg-teal-500 text-white p-2 rounded-lg transition"
                      title="Aprovar"
                    >
                      <UserCheck size={16} />
                    </button>
                    <button
                      onClick={() => handleReject(u.id)}
                      className="bg-red-600/20 hover:bg-red-600/40 text-red-400 p-2 rounded-lg transition"
                      title="Rejeitar"
                    >
                      <UserX size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
