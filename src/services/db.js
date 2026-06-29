import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';
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
    // Sort by createdAt descending so the most recent job wins
    const jobs = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(j => ACTIVE.includes(j.status))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(jobs[0] || null);
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

export async function acceptJob(jobId, mechanicId, mechanicName) {
  await updateDoc(doc(db, 'jobs', jobId), { mechanicId, mechanicName: mechanicName || 'Mechanic', status: 'accepted' });
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

// ==========================================
// PARTS MARKETPLACE
// ==========================================

export async function getParts(category) {
  let q;
  if (category && category !== 'all') {
    q = query(collection(db, 'parts'), where('category', '==', category));
  } else {
    q = collection(db, 'parts');
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function listenToParts(callback) {
  return onSnapshot(collection(db, 'parts'), snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function listenToMyListings(sellerId, callback) {
  const q = query(collection(db, 'parts'), where('sellerId', '==', sellerId));
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function addPart(sellerId, sellerName, data) {
  const ref = await addDoc(collection(db, 'parts'), {
    sellerId,
    sellerName,
    ...data,
    stock: Number(data.stock) || 1,
    price: Number(data.price) || 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deletePart(partId) {
  await deleteDoc(doc(db, 'parts', partId));
}

export async function createOrder(buyerId, part, quantity) {
  const total = part.price * quantity;
  const ref = await addDoc(collection(db, 'orders'), {
    buyerId,
    partId: part.id,
    partName: part.name,
    sellerId: part.sellerId,
    sellerName: part.sellerName,
    quantity,
    total,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  // Decrement stock
  const newStock = Math.max(0, (part.stock || 0) - quantity);
  await updateDoc(doc(db, 'parts', part.id), { stock: newStock });
  return ref.id;
}

