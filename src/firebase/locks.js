import { db } from './config.js';
import { doc, runTransaction } from 'firebase/firestore';

export async function lockMemberIdentity(billId, memberId, uid) {
  const memberRef = doc(db, 'bills', billId, 'members', memberId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(memberRef);
    if (!snap.exists()) throw new Error('Member not found');
    if (snap.data().uid && snap.data().uid !== uid) throw new Error('Already claimed');
    transaction.update(memberRef, { uid, state: 'identified' });
  });
}
