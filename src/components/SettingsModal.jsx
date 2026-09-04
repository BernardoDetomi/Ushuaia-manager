import React, { useState } from 'react';
import { Crown, Settings, User, Users, X } from 'lucide-react';
import AccessManager from './AccessManager';
import { getTripMembers } from '../utils/tripFinance';

const SettingsModal = ({ onClose, trip, user }) => {
  const [section, setSection] = useState('names');
  const members = getTripMembers(trip);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings className="text-teal-400" /> Configurações da viagem</h2><button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button></div>
        <div className="flex bg-slate-900 p-1 rounded-lg mb-5 border border-slate-700">
          <button onClick={() => setSection('names')} className={`flex-1 py-2 rounded-md text-sm ${section === 'names' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}>Participantes</button>
          <button onClick={() => setSection('access')} className={`flex-1 py-2 rounded-md text-sm flex items-center justify-center gap-2 ${section === 'access' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}><Users size={15} /> Acessos</button>
        </div>
        {section === 'names' ? (
          <div>
            <p className="text-sm text-slate-400 mb-3">Os nomes são preenchidos pelo cadastro de cada participante.</p>
            <div className="space-y-2">{members.map((member) => <div key={member.uid} className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg p-3"><div className="w-9 h-9 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center"><User size={18} /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-white truncate">{member.name}</p><p className="text-xs text-slate-500 truncate">{member.email}</p></div>{member.uid === trip.ownerUid && <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-full flex items-center gap-1"><Crown size={11} /> Líder</span>}</div>)}</div>
          </div>
        ) : <AccessManager resourceType="trip" resource={trip} user={user} />}
      </div>
    </div>
  );
};

export default SettingsModal;
