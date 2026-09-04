import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Link, LogOut } from 'lucide-react';
import { auth, db } from './config/firebase';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import Onboarding from './components/Onboarding';
import TripList from './components/TripList';
import TripWorkspace from './components/TripWorkspace';
import SplitMain from './components/split/SplitMain';
import { migrateLegacyData, requestAccessFromLink } from './services/workspaces';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [migrationReady, setMigrationReady] = useState(false);
  const [trips, setTrips] = useState([]);
  const [groups, setGroups] = useState([]);
  const [appMode, setAppMode] = useState('trips');
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [settingsSignal, setSettingsSignal] = useState(0);
  const [inviteStatus, setInviteStatus] = useState(null);

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setAuthLoading(false);
  }), []);

  useEffect(() => {
    if (!user) {
      setMigrationReady(false);
      return;
    }
    setMigrationReady(false);
    const normalizedEmail = user.email?.toLowerCase();
    setDoc(doc(db, 'users', user.uid), {
      email: normalizedEmail,
      name: user.displayName || normalizedEmail?.split('@')[0],
      approved: true,
      lastLoginAt: new Date().toISOString(),
    }, { merge: true })
      .then(() => migrateLegacyData(user))
      .catch((error) => console.error('Legacy migration failed:', error))
      .finally(() => setMigrationReady(true));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTrips([]);
      setGroups([]);
      setResourcesLoading(false);
      return undefined;
    }
    if (!migrationReady) return undefined;

    setResourcesLoading(true);

    let tripsReady = false;
    let groupsReady = false;
    const finishLoading = () => {
      if (tripsReady && groupsReady) setResourcesLoading(false);
    };
    const tripsQuery = query(collection(db, 'trips'), where('memberUids', 'array-contains', user.uid));
    const groupsQuery = query(collection(db, 'split_groups'), where('memberUids', 'array-contains', user.uid));
    const unsubTrips = onSnapshot(tripsQuery, (snap) => {
      setTrips(snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      tripsReady = true;
      finishLoading();
    }, (error) => { console.error(error); tripsReady = true; finishLoading(); });
    const unsubGroups = onSnapshot(groupsQuery, (snap) => {
      setGroups(snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      groupsReady = true;
      finishLoading();
    }, (error) => { console.error(error); groupsReady = true; finishLoading(); });
    return () => { unsubTrips(); unsubGroups(); };
  }, [user, migrationReady]);

  useEffect(() => {
    if (!user) return;
    const token = new URLSearchParams(window.location.search).get('invite');
    if (!token) return;
    let unsubscribeRequest;
    requestAccessFromLink(token, user)
      .then((result) => {
        setInviteStatus(result);
        if (result.status === 'pending' && result.requestId) {
          unsubscribeRequest = onSnapshot(doc(db, 'join_requests', result.requestId), (snap) => {
            if (!snap.exists()) return;
            const status = snap.data().status;
            setInviteStatus((current) => ({ ...current, status }));
            if (status === 'accepted') window.history.replaceState({}, '', window.location.pathname);
          });
        }
        if (result.status === 'member' || result.status === 'accepted') {
          window.history.replaceState({}, '', window.location.pathname);
        }
      })
      .catch(() => setInviteStatus({ status: 'invalid' }));
    return () => unsubscribeRequest?.();
  }, [user]);

  const selectedTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId), [trips, selectedTripId]);
  const needsOnboarding = !resourcesLoading && trips.length === 0 && groups.length === 0 && inviteStatus?.status !== 'pending';

  if (authLoading || (user && (!migrationReady || resourcesLoading))) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-teal-400">Carregando...</div>;
  if (!user) return <AuthScreen />;

  if (inviteStatus?.status === 'pending' && trips.length === 0 && groups.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-slate-200">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <Link className="mx-auto text-teal-400 mb-4" size={36} />
          <h1 className="text-xl font-bold text-white">Solicitação enviada</h1>
          <p className="text-slate-400 mt-2">O líder de “{inviteStatus.invite.resourceName}” precisa aprovar sua entrada.</p>
          <button onClick={() => signOut(auth)} className="mt-6 text-slate-400 hover:text-white inline-flex items-center gap-2"><LogOut size={16} /> Sair</button>
        </div>
      </div>
    );
  }

  if (inviteStatus?.status === 'invalid' && trips.length === 0 && groups.length === 0) {
    window.history.replaceState({}, '', window.location.pathname);
  }

  if (needsOnboarding) {
    return <Onboarding user={user} onComplete={() => updateDoc(doc(db, 'users', user.uid), { onboardingCompleted: true })} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-12 font-sans">
      <Header
        onOpenSettings={selectedTrip ? () => setSettingsSignal((value) => value + 1) : null}
        onLogout={() => signOut(auth)}
        appMode={appMode}
        onToggleMode={(mode) => { setAppMode(mode); setSelectedTripId(null); }}
      />
      {appMode === 'trips' ? (
        selectedTrip
          ? <TripWorkspace trip={selectedTrip} user={user} onBack={() => setSelectedTripId(null)} openSettingsSignal={settingsSignal} />
          : <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><TripList trips={trips} user={user} onSelectTrip={setSelectedTripId} /></main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"><SplitMain user={user} groups={groups} /></main>
      )}
    </div>
  );
}
