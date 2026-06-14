import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMemberByToken, subscribeBill, subscribeClaims } from '../../firebase/bills.js';
import { auth } from '../../firebase/config.js';
import { signInAnonymously } from 'firebase/auth';
import IdentityConfirm from './IdentityConfirm.jsx';
import ItemPicker from './ItemPicker.jsx';
import WaitingRoom from './WaitingRoom.jsx';
import FinalBill from './FinalBill.jsx';
import MemberSummary from './MemberSummary.jsx';

export default function MemberRouter() {
  const { billId, memberToken } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState(null);
  const [billReady, setBillReady] = useState(false);
  const [claims, setClaims] = useState([]);
  const [claimsReady, setClaimsReady] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    let unsubBill = null;
    let unsubClaims = null;

    async function init() {
      // Auth MUST complete before any Firestore read
      await signInAnonymously(auth);

      // Now set up bill subscription (auth token is ready)
      unsubBill = subscribeBill(billId, (data) => {
        setBill(data);
        setBillReady(true);
      });

      const m = await getMemberByToken(billId, memberToken);
      setMember(m);
      setLoading(false);

      if (!m) return;

      // Subscribe to claims; always fires (empty array for non-individual) → claimsReady
      unsubClaims = subscribeClaims(billId, m.id, (data) => {
        setClaims(data);
        setClaimsReady(true);
      });
    }

    init();
    return () => {
      if (unsubBill) unsubBill();
      if (unsubClaims) unsubClaims();
    };
  }, [billId, memberToken]);

  // Re-fetch member periodically to detect state changes from host actions
  useEffect(() => {
    if (!billId || !memberToken) return;
    const interval = setInterval(async () => {
      const m = await getMemberByToken(billId, memberToken);
      if (m) setMember(m);
    }, 5000);
    return () => clearInterval(interval);
  }, [billId, memberToken]);

  if (loading || !billReady || !claimsReady) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🧾</div>
        <p className="text-gray-500">Memuat...</p>
      </div>
    </div>
  );

  if (!member) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-4xl mb-3">❌</div>
        <p className="text-red-500 font-medium">Link tidak valid</p>
        <p className="text-gray-400 text-sm mt-1">Minta link baru ke host</p>
      </div>
    </div>
  );

  const state = member.state;

  if (state === 'pending' || state === 'identified') {
    return <IdentityConfirm member={member} billId={billId} onStateChange={setMember} />;
  }

  // Individual bill flow: claim-based
  if (bill?.billType === 'individual' && (state === 'selecting' || state === 'confirmed')) {
    if (showPicker || claims.length === 0) {
      return (
        <ItemPicker
          member={member}
          billId={billId}
          bill={bill}
          onStateChange={setMember}
          onClaimSaved={() => setShowPicker(false)}
        />
      );
    }
    return (
      <MemberSummary
        member={member}
        billId={billId}
        bill={bill}
        claims={claims}
        onNewClaim={() => setShowPicker(true)}
      />
    );
  }

  // Shared bill flow
  if (state === 'selecting') return <ItemPicker member={member} billId={billId} bill={bill} onStateChange={setMember} />;
  if (state === 'confirmed') return <WaitingRoom member={member} billId={billId} bill={bill} />;
  if (state === 'billed' || state === 'paid') return <FinalBill member={member} billId={billId} bill={bill} />;

  return <IdentityConfirm member={member} billId={billId} onStateChange={setMember} />;
}
