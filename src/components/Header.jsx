import React from 'react';
import { Snowflake, Settings, LogOut } from 'lucide-react';

const Header = ({ onOpenSettings, onLogout }) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-teal-500/20 p-2 rounded-lg">
            <Snowflake className="text-teal-400" size={24} />
          </div>
          <h1 className="text-xl font-bold text-white hidden sm:block">Ushuaia Manager</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition"
            title="Configurações"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
