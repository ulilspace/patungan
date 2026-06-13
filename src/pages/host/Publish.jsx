import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBill, getItems, updateBill } from '../../firebase/bills.js';
import { useMembers } from '../../hooks/useMembers.js';
import { formatIDR } from '../../utils/currency.js';

export default function Publish() {
  const navigate = useNavigate();
  const billId = sessionStorage.getItem('billId');
  const { members } = useMembers(billId);
  const [bill, setBill] = useState(null);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    Promise.all([getBill(billId), getItems(billId)]).then(([b, items]) => {
      setBill(b);
      setItemCount(items.length);
      setLoading(false);
    });
  }, [billId]);

  const checks = [
    { label: 'Item tagihan tersimpan', ok: itemCount > 0 },
    { label: 'Detail transfer diisi', ok: !!bill?.transfer?.bankName },
    { label: 'Minimal 1 anggota ditambahkan', ok: members.length > 0 },
  ];
  const allOk = checks.every(c => c.ok);

  async function handlePublish() {
    setPublishing(true);
    await updateBill(billId, { state: 'active' });
    navigate(`/host/dashboard/${billId}`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Memuat...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500">←</button>
          <h1 className="text-xl font-bold text-gray-800">Publikasikan Tagihan</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">Ringkasan</h2>
          {bill && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Judul</span><span className="font-medium">{bill.title}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tipe</span><span className="font-medium">{bill.billType === 'shared' ? 'Shared' : 'Individual'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-bold text-green-600">{formatIDR(bill.grandTotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Anggota</span><span className="font-medium">{members.length} orang</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Item</span><span className="font-medium">{itemCount} item</span></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">Checklist</h2>
          <div className="space-y-2">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={c.ok ? 'text-green-500' : 'text-red-400'}>{c.ok ? '✓' : '✗'}</span>
                <span className={c.ok ? 'text-gray-700' : 'text-red-500'}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handlePublish}
          disabled={!allOk || publishing}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl py-3 text-sm"
        >
          {publishing ? 'Mempublikasikan...' : '🚀 Publikasikan Tagihan'}
        </button>
        {!allOk && <p className="text-xs text-center text-red-500 mt-2">Lengkapi semua checklist terlebih dahulu</p>}
      </div>
    </div>
  );
}
