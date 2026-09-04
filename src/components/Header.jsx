import React from 'react';
import { Snowflake, Settings, LogOut, ArrowLeftRight, LifeBuoy } from 'lucide-react';

const Header = ({ onOpenSettings, onOpenFeedback, onLogout, appMode, onToggleMode }) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mode Switch */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => onToggleMode('trips')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                appMode === 'trips'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Snowflake size={16} />
              <span className="hidden sm:inline">Viagens</span>
            </button>
            <button
              onClick={() => onToggleMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                appMode === 'split'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ArrowLeftRight size={16} />
              <span className="hidden sm:inline">Split</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onOpenFeedback}
            className="px-2 sm:px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition flex items-center gap-2"
            title="Ajuda, sugestão ou bug"
          >
            <LifeBuoy size={20} />
            <span className="hidden md:inline text-sm font-medium">Ajuda</span>
          </button>
          {onOpenSettings && <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition"
            title="Configurações"
          >
            <Settings size={20} />
          </button>}
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
