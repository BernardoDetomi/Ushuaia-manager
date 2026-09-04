import React from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MapPin, Trash2, ExternalLink, Clock, CheckCircle, Bookmark } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

const STATUS_CONFIG = {
  pendente: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  reservado: { label: 'Reservado', color: 'text-blue-400 bg-blue-400/10', icon: Bookmark },
  confirmado: { label: 'Confirmado', color: 'text-teal-400 bg-teal-400/10', icon: CheckCircle },
};

const PRIORITY_CONFIG = {
  alta: { label: '🔥 Imperdível', color: 'border-red-500/40' },
  média: { label: '⭐ Queremos fazer', color: 'border-orange-500/40' },
  baixa: { label: '💭 Se der tempo', color: 'border-slate-600' },
};

const ActivitiesList = ({ activities, tripId, canManage }) => {
  const handleStatusChange = async (activityId, newStatus) => {
    if (!canManage) return;
    try {
      const docRef = doc(db, 'trips', tripId, 'activities', activityId);
      await updateDoc(docRef, { status: newStatus });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este passeio?')) {
      await deleteDoc(doc(db, 'trips', tripId, 'activities', id));
    }
  };

  const totalEstimated = activities.reduce((acc, a) => acc + (a.custo_estimado || 0), 0);

  // Sort: alta first, then média, then baixa; within same priority, by date
  const sorted = [...activities].sort((a, b) => {
    const priorityOrder = { alta: 0, média: 1, baixa: 2 };
    const pA = priorityOrder[a.prioridade] ?? 1;
    const pB = priorityOrder[b.prioridade] ?? 1;
    if (pA !== pB) return pA - pB;
    if (a.data_prevista && b.data_prevista) return a.data_prevista.localeCompare(b.data_prevista);
    if (a.data_prevista) return -1;
    if (b.data_prevista) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="text-orange-400" /> Passeios & Atividades
        </h3>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-sm">
          <span className="text-slate-400">Custo estimado total: </span>
          <span className="text-orange-400 font-bold">{formatCurrency(totalEstimated)}</span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-slate-500 py-12 bg-slate-800 rounded-xl border border-slate-700">
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum passeio adicionado ainda.</p>
          <p className="text-sm mt-1">Comece a planejar as aventuras em Ushuaia!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((activity) => {
            const status = STATUS_CONFIG[activity.status] || STATUS_CONFIG.pendente;
            const priority = PRIORITY_CONFIG[activity.prioridade] || PRIORITY_CONFIG.média;
            const StatusIcon = status.icon;

            return (
              <div
                key={activity.id}
                className={`bg-slate-800 rounded-xl border-l-4 ${priority.color} border border-slate-700 p-5 hover:bg-slate-750 transition relative group`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-lg leading-tight">{activity.nome}</h4>
                    {activity.descricao && (
                      <p className="text-slate-400 text-sm mt-1">{activity.descricao}</p>
                    )}
                  </div>
                  {canManage && <button
                    onClick={() => handleDelete(activity.id)}
                    className="text-slate-600 hover:text-red-400 p-1 rounded transition opacity-0 group-hover:opacity-100"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>}
                </div>

                {/* Info tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {activity.local && (
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1">
                      <MapPin size={12} /> {activity.local}
                    </span>
                  )}
                  {activity.data_prevista && (
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1">
                      <Clock size={12} />{' '}
                      {new Date(activity.data_prevista + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {activity.custo_estimado > 0 && (
                    <span className="text-xs bg-orange-500/10 text-orange-300 px-2 py-1 rounded font-medium">
                      {formatCurrency(activity.custo_estimado)}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{priority.label}</span>
                </div>

                {/* Notes */}
                {activity.notas && (
                  <p className="text-xs text-slate-500 italic mb-3 bg-slate-900/50 p-2 rounded">
                    {activity.notas}
                  </p>
                )}

                {/* Footer: status + link */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <select
                    disabled={!canManage}
                    value={activity.status}
                    onChange={(e) => handleStatusChange(activity.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded cursor-pointer outline-none border-0 ${status.color}`}
                  >
                    <option value="pendente">⏳ Pendente</option>
                    <option value="reservado">📋 Reservado</option>
                    <option value="confirmado">✅ Confirmado</option>
                  </select>

                  {activity.link && (
                    <a
                      href={activity.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                    >
                      <ExternalLink size={12} /> Ver site
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActivitiesList;
