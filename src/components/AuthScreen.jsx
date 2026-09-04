import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AlertCircle, Snowflake } from 'lucide-react';
import { auth, db } from '../config/firebase';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, 'users', credential.user.uid), {
          email: credential.user.email.toLowerCase(),
          name: credential.user.email.split('@')[0],
          approved: true,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      const invalidCredential = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found';
      const emailInUse = err.code === 'auth/email-already-in-use';
      setError(invalidCredential ? 'E-mail ou senha incorretos.' : emailInUse ? 'Este e-mail já possui uma conta.' : 'Erro ao autenticar. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <div className="bg-teal-500/20 p-4 rounded-full inline-flex mb-4"><Snowflake className="w-10 h-10 text-teal-400" /></div>
          <h1 className="text-3xl font-bold text-white mb-2">Viagens & Split</h1>
          <p className="text-slate-400">Planeje e compartilhe seus gastos</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="block text-sm text-slate-300 mb-1">E-mail</label><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-teal-500" /></div>
          <div><label className="block text-sm text-slate-300 mb-1">Senha</label><input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-teal-500" /></div>
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2 text-red-400 text-sm"><AlertCircle size={16} className="shrink-0 mt-0.5" />{error}</div>}
          <button disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg">{loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar conta'}</button>
        </form>
        <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="mt-6 w-full text-teal-400 hover:text-teal-300 text-sm">{isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}</button>
      </div>
    </div>
  );
};

export default AuthScreen;
