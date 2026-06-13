import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../firebase/config.js';
import { getBill, getMemberByToken, updateMember } from '../../firebase/bills.js';

export default function MemberRouter() {
  const { billId, memberToken } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await signInAnonymously(auth);
        const b = await getBill(billId);
        if (!b) { setError('Tagihan tidak ditemukan.'); setLoading(false); return; }
        if (b.state === 'draft') { setError('Tagihan belum dipublikasikan.'); setLoading(false); return; }
        setBill(b);

        const m = await getMemberByToken(billId, memberToken);
        if (!m) { setError('Link tidak valid.'); setLoading(false); return; }

        const uid = auth.currentUser.uid;

        if (m.uid && m.uid !== uid) {
          setError('Sesi ini sudah aktif di perangkat lain.');
          setLoading(false);
          return;
        }

        if (m.uid === uid) {
          sessionStorage.setItem('memberId', m.id);
          sessionStorage.setItem('memberName', m.name);
          redirect(m.state, b.state, b.billType);
          return;
        }

        setMember(m);
        setLoading(false);
      } catch (e) {
        setError('Terjadi kesalahan: ' + e.message);
        setLoading(false);
      }
    }
    init();
  }, [billId, memberToken]);

  function redirect(state, billState, billType) {
    if (billState === 'closed' || state === 'billed' || state === 'transfer_confirmed') {
      navigate(`/member/${billId}/final`);
    } else if (state === 'order_confirmed' && billType === 'shared') {
      navigate(`/member/${billId}/waiting`);
    } else if (state === 'order_confirmed') {
      navigate(`/member/${billId}/final`);
    } else {
      navigate(`/member/${billId}/pick`);
    }
  }

  async function handleYes() {
    setConfirming(true);
    try {
      const uid = auth.currentUser.uid;
      await updateMember(billId, member.id, { uid, state: 'selecting', deviceBound: true });
      sessionStorage.setItem('memberId', member.id);
      sessionStorage.setItem('memberName', member.name);
      navigate(`/member/${billId}/pick`);
    } catch (e) {
      setError('Gagal mengonfirmasi: ' + e.message);
      setConfirming(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <p className="text-gray-600 text-lg">{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-sm w-full space-y-6">
        <div className="text-5xl">👋</div>
        <div>
          <p className="text-gray-500 text-sm mb-2">{bill?.title}</p>
          <h2 className="text-2xl font-bold text-gray-800">Apakah kamu</h2>
          <h2 className="text-2xl font-bold text-green-600">{member?.name}?</h2>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleYes}
            disabled={confirming}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {confirming ? 'Mengonfirmasi...' : 'Ya, itu aku! 👍'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50"
          >
            Bukan aku
          </button>
        </div>
        <p className="text-xs text-gray-400">Link ini hanya untukmu. Jangan bagikan ke orang lain.</p>
      </div>
    </div>
  );
}
