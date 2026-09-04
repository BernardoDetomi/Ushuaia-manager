import React, { useState } from 'react';
import { Calendar, Plus, Plane, X } from 'lucide-react';
import { createTrip } from '../services/workspaces';

const TripList = ({ trips, user, onSelectTrip }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');

  const create = async () => {
    const id = await createTrip(user, name, startDate);
    setShowCreate(false);
    setName('');
    setStartDate('');
    onSelectTrip(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Plane className="text-teal-400" /> Minhas viagens</h2>
        <button onClick={() => setShowCreate(true)} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-2"><Plus size={18} /> Nova viagem</button>
      </div>
      {trips.length === 0 ? (
        <div className="text-center py-20 bg-slate-800 rounded-2xl border border-slate-700 text-slate-400">Nenhuma viagem criada.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <button key={trip.id} onClick={() => onSelectTrip(trip.id)} className="text-left bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-teal-500/60 transition">
              <Plane className="text-teal-400 mb-4" />
              <h3 className="text-lg font-bold text-white">{trip.name}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5"><Calendar size={13} /> {trip.startDate ? new Date(`${trip.startDate}T12:00:00`).toLocaleDateString('pt-BR') : 'Data não definida'} · {trip.memberUids?.length || 1} membro(s)</p>
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5"><h3 className="text-xl font-bold text-white">Nova viagem</h3><button onClick={() => setShowCreate(false)}><X /></button></div>
            <div className="space-y-3">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da viagem" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" />
              <button onClick={create} disabled={!name.trim()} className="w-full bg-teal-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg">Criar viagem</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripList;
