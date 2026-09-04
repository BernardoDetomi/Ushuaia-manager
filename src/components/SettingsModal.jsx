import React, { useState } from 'react';
import { Settings, Users, X } from 'lucide-react';
import AccessManager from './AccessManager';

const SettingsModal = ({ onClose, settings, onSave, trip, user }) => {
  const [names, setNames] = useState(settings || { person1: 'Eu', person2: 'Parceiro/a' });
  const [section, setSection] = useState('names');
  const isOwner = trip.ownerUid === user.uid;

  const save = async () => {
    await onSave(names);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-teal-400" /> Configurações da viagem</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg mb-5 border border-slate-700">
          <button onClick={() => setSection('names')} className={`flex-1 py-2 rounded-md text-sm ${section === 'names' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}>Nomes</button>
          <button onClick={() => setSection('access')} className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${section === 'access' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}><Users size={15} /> Acessos</button>
        </div>
        {section === 'names' ? (
          <div className="space-y-4">
            <input disabled={!isOwner} value={names.person1 || ''} onChange={(event) => setNames({ ...names, person1: event.target.value })} placeholder="Pessoa 1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white disabled:opacity-60" />
            <input disabled={!isOwner} value={names.person2 || ''} onChange={(event) => setNames({ ...names, person2: event.target.value })} placeholder="Pessoa 2" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white disabled:opacity-60" />
            {isOwner ? <button onClick={save} className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg">Salvar</button> : <p className="text-sm text-slate-500">Somente o líder pode alterar estas configurações.</p>}
          </div>
        ) : <AccessManager resourceType="trip" resource={trip} user={user} />}
      </div>
    </div>
  );
};

export default SettingsModal;
