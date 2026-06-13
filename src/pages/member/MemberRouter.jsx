import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMemberByToken, subscribeBill } from '../../firebase/bills.js';
import { auth } from '../../firebase/config.js';
import { signInAnonymously } from 'firebase/auth';
import IdentityConfirm from './IdentityConfirm.jsx';
import ItemPicker from './ItemPicker.jsx';
import WaitingRoom from './WaitingRoom.jsx';
import FinalBill from './FinalBill.jsx';

export default function MemberRouter() {
  const { billId, memberToken } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState(null);

  useEffect(() => {
    async function init() {
      await signInAnonymously(auth);
      const m = await getMemberByToken(billId, memberToken);
      setMember(m);
      setLoading(false);
    }
    init();
  }, [billId, memberToken]);

  useEffect(() => {
    if (!billId) return;
    const unsub = subscribeBill(billId, setBill);
    return unsub;
  }, [billId]);

  // Re-fetch member state periodically to detect state changes
  useEffect(() => {
    if (!billId || !memberToken) return;
    const interval = setInterval(async () => {
      const m = await getMemberByToken(billId, memberToken);
      if (m) setMember(m);
    }, 3000);
    return () => clearInterval(interval);
  }, [billId, memberToken]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🧾</div>
        <p className="text-gray-500">Memuat...</p>
      </div>
    </div>
  );

  if (!member) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-red-500 font-medium">Link tidak valid</p>
        <p className="text-gray-400 text-sm mt-1">Minta link baru ke host</p>
      </div>
    </div>
  );

  const state = member.state;
  if (state === 'pending' || state === 'identified') return <IdentityConfirm member={member} billId={billId} onStateChange={setMember} />;
  if (state === 'selecting') return <ItemPicker member={member} billId={billId} bill={bill} onStateChange={setMember} />;
  if (state === 'confirmed') return <WaitingRoom member={member} billId={billId} bill={bill} />;
  if (state === 'paid') return <FinalBill member={member} billId={billId} bill={bill} />;
  return <IdentityConfirm member={member} billId={billId} onStateChange={setMember} />;
}
