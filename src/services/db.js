import { collection, addDoc, doc, updateDoc, query, where, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// ==========================================
// JOBS & MECHANICS
// ==========================================

export async function getAvailableMechanics() {
  const q = query(collection(db, 'users'), where('role', '==', 'mech'), where('status', '==', 'online'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createJobRequest(customerId, serviceData, targetMechanicId) {
  const jobRef = await addDoc(collection(db, 'jobs'), {
    customerId,
    service: serviceData,
    status: 'pending',
    mechanicId: null,
    targetMechanicId: targetMechanicId || null,
    cost: { items: [], notes: '', total: 0 },
    createdAt: serverTimestamp(),
  });
  return jobRef.id;
}

export function listenToActiveJob(jobId, callback) {
  return onSnapshot(doc(db, 'jobs', jobId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// Single-field query – no composite index needed
export function listenToActiveJobForCustomer(customerId, callback) {
  const q = query(collection(db, 'jobs'), where('customerId', '==', customerId));
  return onSnapshot(q, (snapshot) => {
    const ACTIVE = ['pending','accepted','diagnosing','repairing','completed','approved'];
    const active = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .find(j => ACTIVE.includes(j.status));
    callback(active || null);
  });
}

// Single-field query – no composite index needed
export function listenToActiveJobForMechanic(mechanicId, callback) {
  const q = query(collection(db, 'jobs'), where('mechanicId', '==', mechanicId));
  return onSnapshot(q, (snapshot) => {
    const ACTIVE = ['accepted','diagnosing','repairing','completed','approved'];
    const active = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .find(j => ACTIVE.includes(j.status));
    callback(active || null);
  });
}

// All pending jobs for mechanic dashboard (targeted)
export function listenToPendingJobs(mechanicId, callback) {
  const q = query(collection(db, 'jobs'), where('status', '==', 'pending'), where('targetMechanicId', '==', mechanicId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function acceptJob(jobId, mechanicId) {
  await updateDoc(doc(db, 'jobs', jobId), { mechanicId, status: 'accepted' });
}

export async function updateJobStatus(jobId, newStatus) {
  await updateDoc(doc(db, 'jobs', jobId), { status: newStatus });
}

// ==========================================
// USERS
// ==========================================
export async function updateMechanicStatus(mechanicId, status) {
  await updateDoc(doc(db, 'users', mechanicId), { status });
}
