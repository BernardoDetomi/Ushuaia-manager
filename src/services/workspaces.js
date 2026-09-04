import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const LEGACY_OWNER_EMAIL = 'bernardomd01@gmail.com';
export const LEGACY_MEMBER_EMAIL = 'maysavieira13@gmail.com';
export const LEGACY_TRIP_ID = 'ushuaia-2026';

const now = () => new Date().toISOString();
const displayName = (user) =>
  user?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';

async function resolveUser(user) {
  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  return profileSnap.exists() ? { ...user, ...profileSnap.data(), uid: user.uid } : user;
}

export async function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', normalized)));
  if (snap.empty) return null;
  return { uid: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function createTrip(user, name, startDate = '') {
  const resolvedUser = await resolveUser(user);
  const ref = await addDoc(collection(db, 'trips'), {
    name: name.trim(),
    startDate: startDate || null,
    ownerUid: user.uid,
    memberUids: [user.uid],
    memberProfiles: [{ uid: user.uid, email: user.email, name: displayName(resolvedUser) }],
    settings: { person1: displayName(resolvedUser), person2: 'Parceiro/a' },
    createdAt: now(),
  });
  return ref.id;
}

export async function createSplit(user, name, type = 'mensal') {
  const resolvedUser = await resolveUser(user);
  const participant = displayName(resolvedUser);
  const ref = await addDoc(collection(db, 'split_groups'), {
    name: name.trim(),
    type,
    participants: [participant],
    memberUids: [user.uid],
    memberProfiles: [{ uid: user.uid, email: user.email, name: participant }],
    ownerUid: user.uid,
    createdBy: user.uid,
    createdAt: now(),
    monthlyBudget: null,
    closedMonths: [],
  });
  return ref.id;
}

export async function addMemberByEmail(resourceType, resource, email) {
  const invited = await findUserByEmail(email);
  if (!invited) throw new Error('user-not-found');
  if (resource.memberUids?.includes(invited.uid)) throw new Error('already-member');

  const isTrip = resourceType === 'trip';
  const collectionName = isTrip ? 'trips' : 'split_groups';
  const name = displayName(invited);
  const changes = {
    memberUids: [...(resource.memberUids || []), invited.uid],
    memberProfiles: [
      ...(resource.memberProfiles || []),
      { uid: invited.uid, email: invited.email, name },
    ],
  };
  if (!isTrip) changes.participants = [...(resource.participants || []), name];
  await updateDoc(doc(db, collectionName, resource.id), changes);
}

export async function createInviteLink(resourceType, resource) {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
  await setDoc(doc(db, 'invite_links', token), {
    resourceType,
    resourceId: resource.id,
    resourceName: resource.name,
    ownerUid: resource.ownerUid || resource.createdBy,
    active: true,
    createdAt: now(),
  });
  return `${window.location.origin}${window.location.pathname}?invite=${token}`;
}

export async function requestAccessFromLink(token, user) {
  const resolvedUser = await resolveUser(user);
  const linkSnap = await getDoc(doc(db, 'invite_links', token));
  if (!linkSnap.exists() || linkSnap.data().active !== true) throw new Error('invalid-link');
  const invite = linkSnap.data();
  const requestId = `${token}_${user.uid}`;
  const requestRef = doc(db, 'join_requests', requestId);
  const existing = await getDoc(requestRef);
  if (!existing.exists()) {
    await setDoc(requestRef, {
      token,
      resourceType: invite.resourceType,
      resourceId: invite.resourceId,
      resourceName: invite.resourceName,
      ownerUid: invite.ownerUid,
      userUid: user.uid,
      userEmail: user.email,
      userName: displayName(resolvedUser),
      status: 'pending',
      createdAt: now(),
    });
    return { status: 'pending', invite, requestId };
  }
  return { status: existing.data().status, invite, requestId };
}

export async function decideJoinRequest(request, accepted) {
  const requestRef = doc(db, 'join_requests', request.id);
  if (!accepted) {
    await updateDoc(requestRef, { status: 'rejected', decidedAt: now() });
    return;
  }

  const resourceCollection = request.resourceType === 'trip' ? 'trips' : 'split_groups';
  const resourceRef = doc(db, resourceCollection, request.resourceId);
  const resourceSnap = await getDoc(resourceRef);
  if (!resourceSnap.exists()) throw new Error('resource-not-found');
  const resource = resourceSnap.data();
  if (!resource.memberUids?.includes(request.userUid)) {
    const changes = {
      memberUids: [...(resource.memberUids || []), request.userUid],
      memberProfiles: [
        ...(resource.memberProfiles || []),
        { uid: request.userUid, email: request.userEmail, name: request.userName },
      ],
    };
    if (request.resourceType === 'split') {
      changes.participants = [...(resource.participants || []), request.userName];
    }
    await updateDoc(resourceRef, changes);
  }
  await updateDoc(requestRef, { status: 'accepted', decidedAt: now() });
}

async function copyCollection(sourcePath, targetPath, ownerUid) {
  let sourceSnap;
  try {
    sourceSnap = await getDocs(collection(db, ...sourcePath));
  } catch (error) {
    throw new Error(`Falha ao ler a coleção antiga "${sourcePath.join('/')}": ${error.message}`, { cause: error });
  }
  let batch = writeBatch(db);
  let count = 0;
  for (const sourceDoc of sourceSnap.docs) {
    batch.set(doc(db, ...targetPath, sourceDoc.id), {
      ...sourceDoc.data(),
      createdBy: sourceDoc.data().createdBy || ownerUid,
    });
    count += 1;
    if (count % 450 === 0) {
      try {
        await batch.commit();
      } catch (error) {
        throw new Error(`Falha ao copiar "${sourcePath.join('/')}": ${error.message}`, { cause: error });
      }
      batch = writeBatch(db);
    }
  }
  if (count % 450 !== 0) {
    try {
      await batch.commit();
    } catch (error) {
      throw new Error(`Falha ao copiar "${sourcePath.join('/')}": ${error.message}`, { cause: error });
    }
  }
  return count;
}

export async function migrateLegacyData(user) {
  if (user.email?.toLowerCase() !== LEGACY_OWNER_EMAIL) return false;
  const tripRef = doc(db, 'trips', LEGACY_TRIP_ID);
  const ownerProfile = { uid: user.uid, email: user.email, name: 'Bernardo' };
  const baseTrip = {
    name: 'Ushuaia 2026',
    startDate: '2026-08-16',
    ownerUid: user.uid,
    memberUids: [user.uid],
    memberProfiles: [ownerProfile],
    settings: { person1: 'Bernardo', person2: 'Maysa' },
    createdAt: now(),
    migrationStartedAt: now(),
  };

  // Updating first preserves any members already present. On the very first
  // run the document does not exist, so the update is rejected and we create it.
  try {
    await updateDoc(tripRef, {
      name: baseTrip.name,
      startDate: baseTrip.startDate,
      ownerUid: user.uid,
      memberUids: arrayUnion(user.uid),
      memberProfiles: arrayUnion(ownerProfile),
      migrationStartedAt: now(),
    });
  } catch (error) {
    await setDoc(tripRef, baseTrip);
  }

  const existing = await getDoc(tripRef);
  if (existing.data()?.legacyMigratedAt) return false;

  const maysa = await findUserByEmail(LEGACY_MEMBER_EMAIL);
  if (maysa && maysa.uid !== user.uid) {
    await updateDoc(tripRef, {
      memberUids: arrayUnion(maysa.uid),
      memberProfiles: arrayUnion({ uid: maysa.uid, email: maysa.email, name: 'Maysa' }),
    });
  }

  const expenses = await copyCollection(['expenses'], ['trips', LEGACY_TRIP_ID, 'expenses'], user.uid);
  const activities = await copyCollection(['activities'], ['trips', LEGACY_TRIP_ID, 'activities'], user.uid);
  const checklist = await copyCollection(['checklist'], ['trips', LEGACY_TRIP_ID, 'checklist'], user.uid);
  let legacySettings;
  try {
    legacySettings = await getDoc(doc(db, 'settings', 'config'));
  } catch (error) {
    throw new Error(`Falha ao ler as configurações antigas: ${error.message}`, { cause: error });
  }
  const settings = legacySettings.exists()
    ? legacySettings.data()
    : { person1: 'Bernardo', person2: 'Maysa' };

  await setDoc(tripRef, {
    settings,
    legacyMigratedAt: now(),
    legacyCounts: { expenses, activities, checklist },
  }, { merge: true });
  return true;
}
