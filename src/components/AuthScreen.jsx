import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { AlertCircle, ArrowLeft, CheckCircle, Snowflake } from 'lucide-react';
import { auth, db } from '../config/firebase';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9.1L6.5 14Z" />
    <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.8A9.8 9.8 0 0 0 3.1 7.5l3.4 2.6A5.9 5.9 0 0 1 12 5.9Z" />
  </svg>
);

const getAuthMessage = (error) => {
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'].includes(error.code)) {
    return 'E-mail ou senha incorretos.';
  }
  if (error.code === 'auth/email-already-in-use') return 'Este e-mail já possui uma conta.';
  if (error.code === 'auth/account-exists-with-different-credential') {
    return 'Este e-mail já está cadastrado com outro método de acesso.';
  }
  if (error.code === 'auth/popup-blocked') return 'O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente.';
  if (error.code === 'auth/network-request-failed') return 'Falha de conexão. Verifique sua internet e tente novamente.';
  return 'Erro ao autenticar. Verifique os dados e tente novamente.';
};

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: fullName.trim() });
        await setDoc(doc(db, 'users', credential.user.uid), {
          email: credential.user.email.toLowerCase(),
          name: fullName.trim(),
          approved: true,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setError(getAuthMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    resetMessages();
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(getAuthMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess('Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
    } catch (err) {
      if (err.code === 'auth/invalid-email') setError('Digite um endereço de e-mail válido.');
      else setError(getAuthMessage(err));
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
          <p className="text-slate-400">{forgotPassword ? 'Recupere o acesso à sua conta' : 'Planeje e compartilhe seus gastos'}</p>
        </div>

        {forgotPassword ? (
          <form onSubmit={requestPasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">E-mail cadastrado</label>
              <input type="email" required autoFocus value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {error && <Message type="error">{error}</Message>}
            {success && <Message type="success">{success}</Message>}
            <button disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg">{loading ? 'Enviando...' : 'Enviar link de recuperação'}</button>
            <button type="button" onClick={() => { setForgotPassword(false); resetMessages(); }} className="w-full text-slate-400 hover:text-white text-sm flex justify-center items-center gap-2"><ArrowLeft size={15} /> Voltar para o login</button>
          </form>
        ) : (
          <>
            <button type="button" onClick={signInWithGoogle} disabled={loading} className="w-full bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-800 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition">
              <GoogleIcon /> Continuar com Google
            </button>

            <div className="flex items-center gap-3 my-5"><div className="h-px bg-slate-700 flex-1" /><span className="text-xs text-slate-500 uppercase">ou</span><div className="h-px bg-slate-700 flex-1" /></div>

            <form onSubmit={submit} className="space-y-4">
              {!isLogin && <div><label className="block text-sm text-slate-300 mb-1">Nome completo</label><input type="text" required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-teal-500" /></div>}
              <div><label className="block text-sm text-slate-300 mb-1">E-mail</label><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-teal-500" /></div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm text-slate-300">Senha</label>
                  {isLogin && <button type="button" onClick={() => { setForgotPassword(true); resetMessages(); }} className="text-xs text-teal-400 hover:text-teal-300">Esqueci minha senha</button>}
                </div>
                <input type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              {error && <Message type="error">{error}</Message>}
              <button disabled={loading} className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-3 rounded-lg">{loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar conta'}</button>
            </form>
            <button onClick={() => { setIsLogin(!isLogin); resetMessages(); }} className="mt-6 w-full text-teal-400 hover:text-teal-300 text-sm">{isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}</button>
          </>
        )}
      </div>
    </div>
  );
};

const Message = ({ type, children }) => {
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle;
  return <div className={`p-3 rounded-lg border flex gap-2 text-sm ${isError ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}><Icon size={16} className="shrink-0 mt-0.5" />{children}</div>;
};

export default AuthScreen;
