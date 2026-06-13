import { storage } from './config.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadReceiptImage(billId, file) {
  const storageRef = ref(storage, `receipts/${billId}/receipt`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadPaymentProof(billId, memberId, claimId, file) {
  const storageRef = ref(storage, `receipts/${billId}/payments/${memberId}_${claimId}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
