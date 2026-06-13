import { useState, useEffect } from 'react';
import { subscribeMembers } from '../firebase/bills.js';

export function useMembers(billId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;
    const unsub = subscribeMembers(billId, (data) => {
      setMembers(data);
      setLoading(false);
    });
    return unsub;
  }, [billId]);

  return { members, loading };
}
