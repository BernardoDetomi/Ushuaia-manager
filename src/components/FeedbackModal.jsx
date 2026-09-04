import React, { useState } from 'react';
import { AlertCircle, CheckCircle, LifeBuoy, Send, X } from 'lucide-react';

const FeedbackModal = ({ user, onClose }) => {
  const [form, setForm] = useState({
    type: 'suggestion',
    title: '',
    description: '',
    contactEmail: user?.email || '',
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, pageUrl: window.location.href }),
      });
      const data = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(data.error || 'Não foi possível enviar a mensagem.');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Não foi possível enviar a mensagem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <h2 id="feedback-title" className="text-xl font-bold text-white flex items-center gap-2"><LifeBuoy className="text-teal-400" /> Ajuda, sugestão ou bug</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Fechar"><X /></button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto text-emerald-400 mb-4" size={44} />
            <h3 className="text-xl font-bold text-white">Mensagem enviada!</h3>
            <p className="text-slate-400 mt-2">Obrigado pelo contato. Sua mensagem será analisada.</p>
            <button onClick={onClose} className="mt-6 bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 py-2.5 rounded-lg">Fechar</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <label className="block"><span className="block text-sm text-slate-400 mb-1">Tipo</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="input"><option value="help">Ajuda</option><option value="suggestion">Sugestão</option><option value="bug">Bug</option></select></label>
            <label className="block"><span className="block text-sm text-slate-400 mb-1">Título</span><input required minLength={3} maxLength={120} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input" placeholder="Resuma sua mensagem" /></label>
            <label className="block"><span className="block text-sm text-slate-400 mb-1">Descrição</span><textarea required minLength={10} maxLength={5000} rows={6} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input resize-y" placeholder="Conte o que aconteceu ou descreva sua sugestão..." /></label>
            <label className="block"><span className="block text-sm text-slate-400 mb-1">E-mail para contato</span><input required type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} className="input" /></label>
            <label className="absolute -left-[9999px]" aria-hidden="true">Website<input tabIndex="-1" autoComplete="off" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} /></label>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex gap-2"><AlertCircle size={16} className="shrink-0 mt-0.5" />{error}</div>}
            <div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg">Cancelar</button><button disabled={loading} className="flex-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><Send size={16} />{loading ? 'Enviando...' : 'Enviar'}</button></div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
