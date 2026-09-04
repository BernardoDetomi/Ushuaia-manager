import React, { useState } from 'react';
import { ArrowLeftRight, Check, Plane } from 'lucide-react';
import { createSplit, createTrip } from '../services/workspaces';

const choices = [
  { id: 'trip', title: 'Criar uma viagem', icon: Plane, color: 'teal' },
  { id: 'split', title: 'Criar um Split', icon: ArrowLeftRight, color: 'indigo' },
  { id: 'both', title: 'Criar os dois', icon: Check, color: 'violet' },
];

const Onboarding = ({ user, onComplete }) => {
  const [choice, setChoice] = useState('trip');
  const [tripName, setTripName] = useState('Minha viagem');
  const [tripDate, setTripDate] = useState('');
  const [splitName, setSplitName] = useState('Meu Split');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      if (choice === 'trip' || choice === 'both') await createTrip(user, tripName, tripDate);
      if (choice === 'split' || choice === 'both') await createSplit(user, splitName);
      await onComplete();
    } catch (err) {
      console.error(err);
      setError('Não foi possível criar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Como você quer começar?</h1>
        <p className="text-slate-400 mt-2 mb-6">Você poderá criar outras viagens e Splits depois.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {choices.map(({ id, title, icon: Icon }) => (
            <button key={id} onClick={() => setChoice(id)} className={`p-4 rounded-xl border text-left transition ${choice === id ? 'border-teal-500 bg-teal-500/10' : 'border-slate-700 bg-slate-900 hover:border-slate-600'}`}>
              <Icon className={choice === id ? 'text-teal-400' : 'text-slate-500'} />
              <span className="block mt-3 font-semibold text-white">{title}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {(choice === 'trip' || choice === 'both') && (
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={tripName} onChange={(event) => setTripName(event.target.value)} placeholder="Nome da viagem" className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" />
              <input type="date" value={tripDate} onChange={(event) => setTripDate(event.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" />
            </div>
          )}
          {(choice === 'split' || choice === 'both') && (
            <input value={splitName} onChange={(event) => setSplitName(event.target.value)} placeholder="Nome do Split" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" />
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={submit} disabled={loading || ((choice === 'trip' || choice === 'both') && !tripName.trim()) || ((choice === 'split' || choice === 'both') && !splitName.trim())} className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg">
            {loading ? 'Criando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
