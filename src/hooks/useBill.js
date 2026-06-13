import { useState, useEffect } from 'react';
import { subscribeBill } from '../firebase/bills.js';

export function useBill(billId) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;
    const unsub = subscribeBill(billId, (data) => {
      setBill(data);
      setLoading(false);
    });
    return unsub;
  }, [billId]);

  return { bill, loading };
}
