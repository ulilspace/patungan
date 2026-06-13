import { useState } from 'react';
import { lockMemberIdentity } from '../../firebase/locks.js';
import { updateMember, getBill } from '../../firebase/bills.js';
import { auth } from '../../firebase/config.js';

export default function IdentityConfirm({ member, billId, onStateChange }) {
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const [error, setError] = useState('');
  const [billTitle, setBillTitle] = useState('');

  useState(() => {
    getBill(billId).then(b => b && setBillTitle(b.title));
  }, [billId]);

  async function handleConfirm() {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Tidak terautentikasi');
      await lockMemberIdentity(billId, member.id, uid);
      await updateMember(billId, member.id, { state: 'selecting' });
      onStateChange({ ...member, state: 'selecting' });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (denied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-3">🙅</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Bukan Kamu?</h1>
        <p className="text-gray-500 text-sm">Hubungi host untuk mendapat link undangan yang benar untukmu.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Halo!</h1>
          {billTitle && <p className="text-sm text-gray-500 mb-2">Tagihan: {billTitle}</p>}
          <p className="text-gray-600">Apakah kamu</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{member.name}?</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl py-4 text-base"
          >
            {loading ? 'Memproses...' : '✅ Ya, itu aku!'}
          </button>
          <button
            onClick={() => setDenied(true)}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 font-medium rounded-xl py-4 text-base"
          >
            ❌ Bukan aku
          </button>
        </div>
      </div>
    </div>
  );
}
