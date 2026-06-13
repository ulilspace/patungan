import { useState, useEffect } from 'react';
import { subscribeItems } from '../firebase/bills.js';

export function useItems(billId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;
    const unsub = subscribeItems(billId, (data) => {
      setItems(data);
      setLoading(false);
    });
    return unsub;
  }, [billId]);

  return { items, loading };
}
