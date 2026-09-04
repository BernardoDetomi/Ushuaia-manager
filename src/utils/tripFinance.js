export const getTripMembers = (trip) => {
  const profiles = trip?.memberProfiles || [];
  const byUid = new Map();
  profiles.forEach((profile) => {
    if (profile?.uid) byUid.set(profile.uid, profile);
  });
  (trip?.memberUids || []).forEach((uid) => {
    if (!byUid.has(uid)) byUid.set(uid, { uid, name: 'Participante', email: '' });
  });
  return [...byUid.values()].map((profile, index) => ({
    ...profile,
    name: profile.name || profile.email?.split('@')[0] || `Participante ${index + 1}`,
  }));
};

export const getMemberName = (uid, members) =>
  members.find((member) => member.uid === uid)?.name || 'Participante';

export const getExpensePayerUid = (expense, members, settings = {}) => {
  if (expense.paidByUid) return expense.paidByUid;
  if (expense.quem_pagou && !['person1', 'person2'].includes(expense.quem_pagou)) return expense.quem_pagou;
  if (expense.quem_pagou === 'person2') {
    return members.find((member) => member.name === settings.person2)?.uid || members[1]?.uid;
  }
  return members.find((member) => member.name === settings.person1)?.uid || members[0]?.uid;
};

export const getExpenseParticipantUids = (expense, members, settings = {}) => {
  if (expense.splitBetweenUids?.length) return expense.splitBetweenUids;
  // Registros da versão original sempre eram divididos entre as duas pessoas configuradas.
  const legacy = [
    members.find((member) => member.name === settings.person1)?.uid || members[0]?.uid,
    members.find((member) => member.name === settings.person2)?.uid || members[1]?.uid,
  ].filter(Boolean);
  return [...new Set(legacy)];
};

export const getExpenseShares = (expense, members, settings = {}) => {
  if (expense.splitShares && Object.keys(expense.splitShares).length) return expense.splitShares;
  const participants = getExpenseParticipantUids(expense, members, settings);
  const total = Number(expense.valor_total) || 0;
  const share = participants.length ? total / participants.length : 0;
  return Object.fromEntries(participants.map((uid) => [uid, share]));
};

export const getPaymentKey = (installmentIndex, uid) => `${installmentIndex}_${uid}`;

export const isInstallmentPaid = (expense, installmentIndex, uid, members, settings = {}) => {
  const paidMap = expense.parcelas_pagas_v2 || {};
  if (paidMap[getPaymentKey(installmentIndex, uid)]) return true;
  const legacyIndex = members.findIndex((member) => member.uid === uid);
  const legacyKey = legacyIndex === 0 ? `${installmentIndex}_person1` : legacyIndex === 1 ? `${installmentIndex}_person2` : null;
  if (legacyKey && paidMap[legacyKey]) return true;
  return !expense.parcelas_pagas_v2 && (expense.parcelas_pagas || []).includes(installmentIndex);
};
