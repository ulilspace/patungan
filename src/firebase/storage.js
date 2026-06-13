// Store images as compressed base64 in Firestore (no Firebase Storage needed)
export function compressImage(file, maxWidth = 900, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Returns a compressed base64 data URL
export async function uploadReceiptImage(_billId, file) {
  return compressImage(file, 900, 0.65);
}

export async function uploadPaymentProof(_billId, _memberId, _claimId, file) {
  return compressImage(file, 700, 0.6);
}
