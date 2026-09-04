import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Plus, Users, Calendar, Briefcase, Home, X, Check, UserPlus } from 'lucide-react';
import { GROUP_TYPES } from './splitUtils';

const typeIcons = { mensal: Calendar, viagem: Briefcase, fixo: Home };

const GroupList = ({ groups, user, onSelectGroup }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('mensal');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [budget, setBudget] = useState('');

  // Fetch all users when modal opens
  useEffect(() => {
    if (!showCreate) return;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const snap = await getDocs(collection(db, 'users'));
        const users = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter((u) => u.approved !== false);
        setAllUsers(users);
        // Auto-select current user
        setSelectedUsers([user.uid]);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [showCreate, user.uid]);

  const resetForm = () => {
    setName('');
    setType('mensal');
    setSelectedUsers([]);
    setBudget('');
  };

  const toggleUser = (uid) => {
    // Can't deselect yourself
    if (uid === user.uid) return;
    setSelectedUsers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const getDisplayName = (u) => {
    if (u.name) return u.name;
    // Use part before @ in email
    return u.email ? u.email.split('@')[0] : 'Usuário';
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedUsers.length < 1) return;
    // Build participants list (display names) and memberUids
    const participantNames = selectedUsers.map((uid) => {
      const u = allUsers.find((usr) => usr.uid === uid);
      return u ? getDisplayName(u) : uid;
    });

    try {
      await addDoc(collection(db, 'split_groups'), {
        name: name.trim(),
        type,
        participants: participantNames,
        memberUids: selectedUsers,
        createdBy: user.uid,
        ownerUid: user.uid,
        createdAt: new Date().toISOString(),
        monthlyBudget: budget ? parseFloat(budget) : null,
        closedMonths: [],
      });
      setShowCreate(false);
      resetForm();
    } catch (err) {
      console.error('Error creating group:', err);
      alert('Erro ao criar grupo.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="text-indigo-400" /> Meus Grupos
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition hover:scale-105"
        >
          <Plus size={18} /> Novo Grupo
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 bg-slate-800 rounded-2xl border border-slate-700">
          <div className="bg-slate-700/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-slate-500" size={36} />
          </div>
          <p className="text-slate-300 text-lg font-medium mb-1">Nenhum grupo criado</p>
          <p className="text-slate-500 text-sm mb-6">
            Crie um grupo para começar a dividir despesas
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-bold inline-flex items-center gap-2 transition"
          >
            <Plus size={18} /> Criar Primeiro Grupo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const typeInfo = GROUP_TYPES[group.type] || GROUP_TYPES.mensal;
            const TypeIcon = typeIcons[group.type] || Calendar;

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className="bg-slate-800 rounded-xl border border-slate-700 p-5 cursor-pointer hover:border-indigo-500/50 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${typeInfo.bgClass}`}>
                    <TypeIcon className={typeInfo.textClass} size={22} />
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${typeInfo.badgeBg} ${typeInfo.textClass}`}
                  >
                    {typeInfo.label}
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-1 group-hover:text-indigo-300 transition">
                  {group.name}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-2">
                    {(group.participants || []).slice(0, 4).map((p, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold"
                        title={p}
                      >
                        {p.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {(group.participants || []).length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-600 border-2 border-slate-800 flex items-center justify-center text-[10px] text-slate-300">
                        +{group.participants.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {group.participants?.length || 0} participantes
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="text-indigo-400" /> Novo Grupo
              </h2>
              <button
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
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
                  placeholder="Ex: Casa Março 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Tipo de Grupo</label>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                  {Object.entries(GROUP_TYPES).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setType(key)}
                      className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${
                        type === key
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {info.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Participantes ({selectedUsers.length} selecionados)
                </label>
                {loadingUsers ? (
                  <div className="text-center py-6">
                    <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-slate-500 text-sm">Carregando usuários...</p>
                  </div>
                ) : allUsers.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4 text-center">Nenhum usuário encontrado</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {allUsers.map((u) => {
                      const isSelected = selectedUsers.includes(u.uid);
                      const isMe = u.uid === user.uid;
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => toggleUser(u.uid)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition text-left ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/10'
                              : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                          } ${isMe ? 'opacity-90' : ''}`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 text-slate-400'
                            }`}
                          >
                            {isSelected ? (
                              <Check size={16} />
                            ) : (
                              getDisplayName(u).charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {getDisplayName(u)} {isMe && <span className="text-indigo-400 text-xs">(você)</span>}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                          {isMe && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium shrink-0">
                              Obrigatório
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedUsers.length < 1 && (
                  <p className="text-xs text-amber-400/80 mt-2">
                    Selecione pelo menos 1 participante
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Meta Mensal de Gastos (Opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  placeholder="R$ 0.00"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
                <p className="text-xs text-slate-600 mt-1">
                  Defina um limite para acompanhar o orçamento do grupo
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    setShowCreate(false);
                    resetForm();
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={
                    !name.trim() || selectedUsers.length < 1
                  }
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3 rounded-lg transition"
                >
                  Criar Grupo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupList;
