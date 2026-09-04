import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Check, Copy, Link, UserPlus, X } from 'lucide-react';
import { db } from '../config/firebase';
import {
  addMemberByEmail,
  createInviteLink,
  decideJoinRequest,
} from '../services/workspaces';

const AccessManager = ({ resourceType, resource, user, accent = 'teal' }) => {
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const ownerUid = resource.ownerUid || resource.createdBy;
  const isOwner = ownerUid === user.uid;
  const buttonClass = accent === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-teal-600 hover:bg-teal-500';

  useEffect(() => {
    if (!isOwner) return undefined;
    const q = query(collection(db, 'join_requests'), where('ownerUid', '==', user.uid));
    return onSnapshot(q, (snap) => {
      setRequests(
        snap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => item.resourceType === resourceType && item.resourceId === resource.id && item.status === 'pending')
      );
    });
  }, [isOwner, resource.id, resourceType, user.uid]);

  if (!isOwner) {
    return <p className="text-sm text-slate-500">Somente o líder pode gerenciar membros e convites.</p>;
  }

  const inviteByEmail = async () => {
    setMessage('');
    try {
      await addMemberByEmail(resourceType, resource, email);
      setEmail('');
      setMessage('Usuário adicionado com sucesso.');
    } catch (error) {
      if (error.message === 'user-not-found') setMessage('Usuário não encontrado. Ele precisa criar uma conta primeiro.');
      else if (error.message === 'already-member') setMessage('Esse usuário já participa.');
      else setMessage('Não foi possível adicionar o usuário.');
    }
  };

  const generateLink = async () => {
    const link = await createInviteLink(resourceType, resource);
    setInviteLink(link);
    await navigator.clipboard?.writeText(link);
    setMessage('Link criado e copiado. A entrada dependerá da sua aprovação.');
  };

  const decide = async (request, accepted) => {
    await decideJoinRequest(request, accepted);
    setMessage(accepted ? 'Solicitação aprovada.' : 'Solicitação recusada.');
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
        <label className="block text-sm text-slate-300 mb-2 flex items-center gap-2">
          <UserPlus size={15} /> Adicionar usuário cadastrado
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@exemplo.com"
            className="min-w-0 flex-1 bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none"
          />
          <button onClick={inviteByEmail} disabled={!email.trim()} className={`${buttonClass} disabled:opacity-50 text-white px-4 rounded-lg text-sm font-medium`}>
            Adicionar
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300 flex items-center gap-2"><Link size={15} /> Link de convite</p>
            <p className="text-xs text-slate-500 mt-1">Quem abrir o link enviará uma solicitação ao líder.</p>
          </div>
          <button onClick={generateLink} className={`${buttonClass} text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5`}>
            <Copy size={14} /> Criar link
          </button>
        </div>
        {inviteLink && <input readOnly value={inviteLink} className="mt-3 w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-400" />}
      </div>

      {requests.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-2">Solicitações pendentes</p>
          <div className="space-y-2">
            {requests.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-700 rounded-lg p-3">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{request.userName}</p>
                  <p className="text-xs text-slate-500 truncate">{request.userEmail}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => decide(request, true)} title="Aprovar" className="p-2 rounded-lg bg-emerald-600 text-white"><Check size={15} /></button>
                  <button onClick={() => decide(request, false)} title="Recusar" className="p-2 rounded-lg bg-red-500/20 text-red-400"><X size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && <p className="text-xs text-slate-300 bg-slate-700/60 rounded-lg p-3">{message}</p>}
    </div>
  );
};

export default AccessManager;
