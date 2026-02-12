import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Snowflake, Clock, LogOut } from 'lucide-react';

const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-500/20 p-4 rounded-full">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Aguardando Aprovação</h1>
        <p className="text-slate-400 mb-2">
          Sua conta foi criada com sucesso!
        </p>
        <p className="text-slate-500 text-sm mb-6">
          Um administrador precisa liberar seu acesso antes de você poder usar o app. Peça para quem já tem acesso aprovar sua conta nas configurações.
        </p>

        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
          <div className="flex items-center justify-center gap-3">
            <Snowflake className="text-teal-400 animate-spin" size={20} style={{ animationDuration: '3s' }} />
            <span className="text-slate-300 text-sm">Esperando liberação...</span>
          </div>
        </div>

        <button
          onClick={() => signOut(auth)}
          className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mx-auto transition"
        >
          <LogOut size={16} /> Sair e usar outra conta
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
