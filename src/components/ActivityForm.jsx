import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MapPin } from 'lucide-react';

const ActivityForm = ({ onClose, tripId, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedCost: '',
    date: '',
    location: '',
    link: '',
    priority: 'média',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'trips', tripId, 'activities'), {
        nome: formData.name,
        descricao: formData.description,
        custo_estimado: formData.estimatedCost ? parseFloat(formData.estimatedCost) : 0,
        data_prevista: formData.date || null,
        local: formData.location,
        link: formData.link,
        prioridade: formData.priority,
        notas: formData.notes,
        status: 'pendente',
        criado_em: new Date().toISOString(),
        createdBy: user.uid,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      alert('Erro ao salvar atividade.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-orange-400" /> Novo Passeio
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Nome do Passeio</label>
              <input
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                placeholder="Ex: Trekking no Glaciar Martial"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Descrição</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                placeholder="Ex: Caminhada guiada de 3h com vista para o canal"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Custo Estimado (R$)</label>
              <input
                type="number"
                step="0.01"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                placeholder="0.00"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Data Prevista</label>
              <input
                type="date"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Local</label>
              <input
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                placeholder="Ex: Parque Nacional Tierra del Fuego"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Prioridade</label>
              <select
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="alta">🔥 Alta - Imperdível</option>
                <option value="média">⭐ Média - Queremos fazer</option>
                <option value="baixa">💭 Baixa - Se der tempo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Link (reserva/site)</label>
            <input
              type="url"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
              placeholder="https://..."
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Notas / Observações</label>
            <textarea
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-orange-500 outline-none resize-none"
              placeholder="Ex: Precisa reservar com antecedência, levar roupa térmica..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-orange-900/50"
            >
              Adicionar Passeio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;
