import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import GroupList from './GroupList';
import GroupDetail from './GroupDetail';

const SplitMain = ({ user, settings }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'split_groups'),
      where('memberUids', 'array-contains', user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setGroups(docs);
        setLoading(false);
      },
      (err) => {
        console.error('Error loading groups:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 animate-pulse">Carregando grupos...</div>
      </div>
    );
  }

  if (selectedGroup) {
    return (
      <GroupDetail
        group={selectedGroup}
        user={user}
        settings={settings}
        onBack={() => setSelectedGroupId(null)}
      />
    );
  }

  return <GroupList groups={groups} user={user} onSelectGroup={setSelectedGroupId} />;
};

export default SplitMain;
