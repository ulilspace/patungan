import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { getBill, getMember, updateMember } from '../../firebase/bills';

export default function IdentityConfirm() {
  const { billId, memberToken } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      await signInAnonymously(auth);
      const b = await getBill(billId);
      if (!b || b.state === 'draft') {
        setError('Tagihan belum siap.');
        setLoading(false);
        return;
      }
      setBill(b);

      // Find member by token
      const { getMembers } = await import('../../firebase/bills');
      const members = await getMembers(billId);
      const m = members.find(mem => mem.token === memberToken);
      if (!m) {
        setError('Link tidak valid.');
        setLoading(false);
        return;
      }

      // Already confirmed on another device
      if (m.uid && m.uid !== auth.currentUser.uid) {
        setError('Sesi ini sudah aktif di perangkat lain.');
        setLoading(false);
        return;
      }

      // Already confirmed on this device → go to appropriate page
      if (m.uid && m.uid === auth.currentUser.uid) {
        sessionStorage.setItem('memberId', m.id);
        sessionStorage.setItem('memberName', m.name);
        redirectByState(m.state, billId, b.type);
        return;
      }

      setMember(m);
      setLoading(false);
    }
    init();
  }, [billId, memberToken]);

  function redirectByState(state, bid, type) {
    if (state === 'invited' || state === 'identity_confirmed' || state === 'selecting') {
      navigate(`/member/${bid}/pick`);
    } else if (state === 'order_confirmed' && type === 'shared') {
      navigate(`/member/${bid}/waiting`);
    } else if (state === 'billed' || state === 'order_confirmed' || state === 'transfer_confirmed') {
      navigate(`/member/${bid}/final`);
    } else {
      navigate(`/member/${bid}/pick`);
    }
  }

  async function handleYes() {
    setConfirming(true);
    await updateMember(billId, member.id, {
      uid: auth.currentUser.uid,
      deviceBound: true,
      state: 'identity_confirmed',
    });
    sessionStorage.setItem('memberId', member.id);
    sessionStorage.setItem('memberName', member.name);
    navigate(`/member/${billId}/pick`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <p className="text-gray-600">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-sm w-full space-y-6">
        <div className="text-5xl">👋</div>
        <div>
          <p className="text-gray-500 text-sm mb-1">{bill?.title}</p>
          <h2 className="text-2xl font-bold text-gray-800">Apakah kamu</h2>
          <h2 className="text-2xl font-bold text-green-600">{member?.name}?</h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleYes}
            disabled={confirming}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {confirming ? 'Mengonfirmasi...' : 'Ya, itu aku!'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50"
          >
            Bukan aku
          </button>
        </div>
        {!confirming && <p className="text-xs text-gray-400">Link ini hanya untukmu. Jangan bagikan ke orang lain.</p>}
      </div>
    </div>
  );
}
