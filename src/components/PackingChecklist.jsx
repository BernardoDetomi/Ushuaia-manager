import React, { useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Luggage,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  CheckCircle2,
  Circle,
  Briefcase,
  ShoppingBag,
} from 'lucide-react';

const PersonSection = ({ personName, items, color }) => {
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editItem, setEditItem] = useState('');
  const [editQty, setEditQty] = useState('');

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    await addDoc(collection(db, 'checklist'), {
      person: personName,
      item: newItem.trim(),
      quantity: newQty.trim() || '1',
      handBag: false,
      suitcase: false,
      createdAt: new Date().toISOString(),
    });
    setNewItem('');
    setNewQty('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const toggleField = async (id, field, currentValue) => {
    await updateDoc(doc(db, 'checklist', id), { [field]: !currentValue });
  };

  const handleDelete = async (id) => {
    if (confirm('Excluir este item?')) {
      await deleteDoc(doc(db, 'checklist', id));
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditItem(item.item);
    setEditQty(item.quantity);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditItem('');
    setEditQty('');
  };

  const saveEdit = async (id) => {
    if (!editItem.trim()) return;
    await updateDoc(doc(db, 'checklist', id), {
      item: editItem.trim(),
      quantity: editQty.trim() || '1',
    });
    cancelEdit();
  };

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') saveEdit(id);
    if (e.key === 'Escape') cancelEdit();
  };

  const fullyPacked = (i) => i.handBag && i.suitcase;
  const packedCount = items.filter(fullyPacked).length;
  const totalCount = items.length;

  const colorMap = {
    teal: {
      border: 'border-teal-500/40',
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      btn: 'bg-teal-600 hover:bg-teal-500',
      ring: 'focus:ring-teal-500',
      badge: 'bg-teal-500/20 text-teal-300',
      progress: 'bg-teal-500',
    },
    pink: {
      border: 'border-pink-500/40',
      bg: 'bg-pink-500/10',
      text: 'text-pink-400',
      btn: 'bg-pink-600 hover:bg-pink-500',
      ring: 'focus:ring-pink-500',
      badge: 'bg-pink-500/20 text-pink-300',
      progress: 'bg-pink-500',
    },
  };
  const c = colorMap[color] || colorMap.teal;

  return (
    <div className={`bg-slate-800 rounded-xl border ${c.border} overflow-hidden`}>
      {/* Header */}
      <div className={`px-5 py-4 ${c.bg} border-b ${c.border}`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-bold ${c.text} flex items-center gap-2`}>
            <Luggage size={20} />
            {personName}
          </h3>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${c.badge}`}>
            {packedCount}/{totalCount} pronto
          </span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <ShoppingBag size={12} className="text-amber-400" /> Bolsa de mão
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={12} className="text-blue-400" /> Mala
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="px-5 pt-3">
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`${c.progress} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${(packedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Add item row */}
      <div className="px-5 py-4 flex gap-2">
        <input
          type="text"
          placeholder="Nome do item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${c.ring} transition`}
        />
        <input
          type="text"
          placeholder="Qtd"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-24 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 ${c.ring} transition`}
        />
        <button
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className={`${c.btn} text-white p-2 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105`}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Items list */}
      <div className="px-5 pb-4 space-y-1">
        {items.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">
            Nenhum item adicionado ainda
          </p>
        )}

        {items.map((item) => {
          const allPacked = item.handBag && item.suitcase;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition group ${
                allPacked
                  ? 'bg-slate-700/30'
                  : 'bg-slate-700/60 hover:bg-slate-700'
              }`}
            >
              {editingId === item.id ? (
                /* Editing mode */
                <>
                  <input
                    type="text"
                    value={editItem}
                    onChange={(e) => setEditItem(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                    autoFocus
                    className={`flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 ${c.ring}`}
                  />
                  <input
                    type="text"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                    className={`w-20 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 ${c.ring}`}
                  />
                  <button
                    onClick={() => saveEdit(item.id)}
                    className="text-green-400 hover:text-green-300 p-1"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-slate-400 hover:text-slate-300 p-1"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                /* Normal mode */
                <>
                  {/* Item name */}
                  <span
                    className={`flex-1 text-sm transition ${
                      allPacked
                        ? 'line-through text-slate-500'
                        : 'text-slate-200'
                    }`}
                  >
                    {item.item}
                  </span>

                  {/* Quantity badge */}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      allPacked
                        ? 'bg-slate-700 text-slate-500'
                        : 'bg-slate-600 text-slate-300'
                    }`}
                  >
                    {item.quantity}
                  </span>

                  {/* Bolsa de mão check */}
                  <button
                    onClick={() => toggleField(item.id, 'handBag', item.handBag)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition ${
                      item.handBag
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-500 hover:text-slate-300'
                    }`}
                    title="Bolsa de mão"
                  >
                    {item.handBag ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    <ShoppingBag size={14} />
                  </button>

                  {/* Mala check */}
                  <button
                    onClick={() => toggleField(item.id, 'suitcase', item.suitcase)}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition ${
                      item.suitcase
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-700 text-slate-500 hover:text-slate-300'
                    }`}
                    title="Mala"
                  >
                    {item.suitcase ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    <Briefcase size={14} />
                  </button>

                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-slate-400 hover:text-blue-400 p-1 transition"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PackingChecklist = ({ items, settings }) => {
  const allPacked = (i) => i.handBag && i.suitcase;

  const person1Items = items
    .filter((i) => i.person === settings.person1)
    .sort((a, b) => {
      const aPacked = allPacked(a);
      const bPacked = allPacked(b);
      if (aPacked !== bPacked) return aPacked ? 1 : -1;
      return a.createdAt?.localeCompare(b.createdAt) || 0;
    });

  const person2Items = items
    .filter((i) => i.person === settings.person2)
    .sort((a, b) => {
      const aPacked = allPacked(a);
      const bPacked = allPacked(b);
      if (aPacked !== bPacked) return aPacked ? 1 : -1;
      return a.createdAt?.localeCompare(b.createdAt) || 0;
    });

  const totalPacked = items.filter(allPacked).length;
  const totalItems = items.length;

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Luggage className="text-purple-400" /> Checklist de Bagagem
        </h3>
        {totalItems > 0 && (
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-sm">
            <span className="text-slate-400">Progresso total: </span>
            <span className="text-purple-400 font-bold">
              {totalPacked}/{totalItems} itens na mala
            </span>
          </div>
        )}
      </div>

      {/* Two person sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PersonSection
          personName={settings.person1}
          items={person1Items}
          color="teal"
        />
        <PersonSection
          personName={settings.person2}
          items={person2Items}
          color="pink"
        />
      </div>
    </div>
  );
};

export default PackingChecklist;
