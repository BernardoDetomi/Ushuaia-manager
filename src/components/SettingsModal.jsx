import React, { useState } from 'react';
import { Settings } from 'lucide-react';

const SettingsModal = ({ onClose, settings, onSave }) => {
  const [names, setNames] = useState(settings || { person1: 'Eu', person2: 'Ela' });

  const handleSave = () => {
    onSave(names);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Settings className="text-teal-400" /> Configurar Nomes
        </h2>
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
      </div>
    </div>
  );
};

export default SettingsModal;
