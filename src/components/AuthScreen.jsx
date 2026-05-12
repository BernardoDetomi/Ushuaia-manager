import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Snowflake, AlertCircle, CheckCircle } from 'lucide-react';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Check if this is the first user (auto-approve)
        const usersSnap = await getDocs(collection(db, 'users'));
        const isFirstUser = usersSnap.empty;
        // Register user doc
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          approved: isFirstUser,
          createdAt: new Date().toISOString(),
        });
        
        // Log out immediately so user doesn't get automatic login
        if (!isFirstUser) {
          await signOut(auth);
          setSuccessMessage('Conta criada com sucesso! Aguarde aprovação de um administrador para acessar o app.');
          setEmail('');
          setPassword('');
          setIsLogin(true);
        }
      }
    } catch (err) {
      setError(
        err.message.includes('auth/invalid-credential')
          ? 'E-mail ou senha incorretos.'
          : 'Erro ao autenticar. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-teal-500/20 p-4 rounded-full">
              <Snowflake className="w-10 h-10 text-teal-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ushuaia 2026</h1>
          <p className="text-slate-400">Controle Financeiro Compartilhado</p>
        </div>

        {successMessage && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2 text-green-400 text-sm mb-4">
            <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-teal-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-teal-900/50 disabled:opacity-50"
          >
            {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
            }}
            className="text-teal-400 hover:text-teal-300 text-sm font-medium transition"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
