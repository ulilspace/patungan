import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBill } from '../../hooks/useBill.js';
import { useMembers } from '../../hooks/useMembers.js';
import { useItems } from '../../hooks/useItems.js';
import { updateBill, updateMember, getSelections } from '../../firebase/bills.js';
import { calculateSplit } from '../../utils/splitCalculator.js';
import { formatIDR } from '../../utils/currency.js';
import { buildWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { serverTimestamp } from 'firebase/firestore';

export default function Dashboard() {
  const { billId } = useParams();
  const { bill, loading } = useBill(billId);
  const { members } = useMembers(billId);
  const { items } = useItems(billId);
  const [closing, setClosing] = useState(false);
  const [splitResult, setSplitResult] = useState(null);

  useEffect(() => {
    if (bill?.splitResult) setSplitResult(bill.splitResult);
  }, [bill]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;
  if (!bill) return <div className="min-h-screen flex items-center justify-center text-gray-400">Tagihan tidak ditemukan</div>;

  const allConfirmed = members.length > 0 && members.every(m =>
    m.state === 'order_confirmed' || m.state === 'billed' || m.state === 'transfer_confirmed' || m.state === 'confirmed'
  );

  async function handleClose() {
    setClosing(true);
    try {
      const selections = await getSelections(billId);
      const result = calculateSplit(bill, items, members, selections);
      const resultMap = {};
      result.forEach(r => { resultMap[r.id] = r; });
      setSplitResult(resultMap);
      await updateBill(billId, { state: 'closed', closedAt: serverTimestamp(), splitResult: resultMap });
      await Promise.all(members.map(m => updateMember(billId, m.id, { state: 'billed' })));
    } catch (e) {
      console.error(e);
    }
    setClosing(false);
  }

  async function markReceived(memberId) {
    await updateMember(billId, memberId, { state: 'transfer_confirmed' });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{bill.title || 'Tagihan'}</h1>
            <p className="text-xs text-gray-400">
              {bill.billType === 'shared' ? 'Bersama' : 'Individual'} ·{' '}
              {bill.state === 'active' ? 'Aktif' : bill.state === 'closed' ? 'Ditutup' : 'Draft'}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${bill.state === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {bill.state === 'active' ? '🟢 Aktif' : '🔒 Ditutup'}
          </span>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-4 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Anggota ({members.length})</h3>
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-700">{m.name}</span>
                <StatusBadge state={m.state} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Item ({items.length})</h3>
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center py-1.5 text-sm">
                <div>
                  <span className="text-gray-700">{item.name}</span>
                  {item.claimedByName && <span className="text-xs text-gray-400 ml-2">→ {item.claimedByName}</span>}
                </div>
                <span className="text-gray-600 font-medium">{formatIDR(item.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {bill.state === 'active' && allConfirmed && (
          <button
            onClick={handleClose}
            disabled={closing}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {closing ? 'Menghitung...' : '🧮 Tutup & Hitung'}
          </button>
        )}

        {bill.state === 'active' && !allConfirmed && (
          <p className="text-center text-sm text-gray-400">Menunggu semua anggota konfirmasi pesanan...</p>
        )}

        {splitResult && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Rincian per Anggota</h3>
            {members.map(m => {
              const r = splitResult[m.id];
              if (!r) return null;
              const waMsg = buildWhatsAppMessage(r, bill);
              const memberData = members.find(mem => mem.id === m.id);
              return (
                <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">{m.name}</span>
                    <span className="font-bold text-green-600">{formatIDR(r.total)}</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-0.5 mb-3">
                    {r.items.map((it, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{it.name}</span>
                        <span>{formatIDR(it.sharedPrice || it.price)}</span>
                      </div>
                    ))}
                    {r.extraShare > 0 && (
                      <div className="flex justify-between">
                        <span>Pajak & layanan</span>
                        <span>{formatIDR(r.extraShare)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openWhatsApp(waMsg)}
                      className="flex-1 text-sm bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      WhatsApp
                    </button>
                    {memberData?.state !== 'transfer_confirmed' ? (
                      <button
                        onClick={() => markReceived(m.id)}
                        className="flex-1 text-sm border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50"
                      >
                        Tandai Lunas
                      </button>
                    ) : (
                      <span className="flex-1 text-center text-sm text-green-600 py-2">✓ Lunas</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
