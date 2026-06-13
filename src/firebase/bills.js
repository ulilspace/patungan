import { db } from './config.js';
import { doc, collection, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';

export async function createBill(billId, hostName) {
  await setDoc(doc(db, 'bills', billId), {
    hostName,
    state: 'draft',
    billType: null,
    title: '',
    tax: 0,
    serviceCharge: 0,
    subtotal: 0,
    grandTotal: 0,
    transfer: null,
    createdAt: serverTimestamp(),
  });
  return billId;
}

export async function updateBill(billId, data) {
  await updateDoc(doc(db, 'bills', billId), data);
}

export async function getBill(billId) {
  const snap = await getDoc(doc(db, 'bills', billId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeBill(billId, callback) {
  return onSnapshot(doc(db, 'bills', billId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function saveItems(billId, items) {
  const colRef = collection(db, 'bills', billId, 'items');
  for (const item of items) {
    await addDoc(colRef, { ...item, claimedBy: null, claimedByName: null });
  }
}

export async function getItems(billId) {
  const snap = await getDocs(collection(db, 'bills', billId, 'items'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeItems(billId, callback) {
  return onSnapshot(collection(db, 'bills', billId, 'items'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function addMember(billId, name, token) {
  const ref = doc(collection(db, 'bills', billId, 'members'));
  await setDoc(ref, { name, token, state: 'pending', uid: null, confirmedAt: null });
  return ref.id;
}

export async function getMembers(billId) {
  const snap = await getDocs(collection(db, 'bills', billId, 'members'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeMembers(billId, callback) {
  return onSnapshot(collection(db, 'bills', billId, 'members'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function getMemberByToken(billId, token) {
  const snap = await getDocs(collection(db, 'bills', billId, 'members'));
  const found = snap.docs.find(d => d.data().token === token);
  return found ? { id: found.id, ...found.data() } : null;
}

export async function updateMember(billId, memberId, data) {
  await updateDoc(doc(db, 'bills', billId, 'members', memberId), data);
}

export async function saveSelections(billId, memberId, memberName, itemIds) {
  const colRef = collection(db, 'bills', billId, 'selections');
  for (const itemId of itemIds) {
    await addDoc(colRef, { memberId, memberName, itemId });
  }
}

export async function getSelections(billId) {
  const snap = await getDocs(collection(db, 'bills', billId, 'selections'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function subscribeSelections(billId, callback) {
  return onSnapshot(collection(db, 'bills', billId, 'selections'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export async function claimItem(billId, itemId, memberId, memberName) {
  await updateDoc(doc(db, 'bills', billId, 'items', itemId), {
    claimedBy: memberId,
    claimedByName: memberName,
  });
}

export async function saveClaim(billId, memberId, claimData) {
  const colRef = collection(db, 'bills', billId, 'members', memberId, 'claims');
  const ref = await addDoc(colRef, { ...claimData, status: 'summary', createdAt: serverTimestamp() });
  return ref.id;
}

export async function getClaims(billId, memberId) {
  const snap = await getDocs(collection(db, 'bills', billId, 'members', memberId, 'claims'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
}

export function subscribeClaims(billId, memberId, callback) {
  return onSnapshot(collection(db, 'bills', billId, 'members', memberId, 'claims'), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)));
  });
}

export async function updateClaim(billId, memberId, claimId, data) {
  await updateDoc(doc(db, 'bills', billId, 'members', memberId, 'claims', claimId), data);
}

export async function deleteMember(billId, memberId) {
  await deleteDoc(doc(db, 'bills', billId, 'members', memberId));
}

export async function getBillsByIds(billIds) {
  const results = [];
  for (const id of billIds) {
    const snap = await getDoc(doc(db, 'bills', id));
    if (snap.exists()) results.push({ id: snap.id, ...snap.data() });
  }
  return results;
}
