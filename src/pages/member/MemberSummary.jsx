import { useState } from 'react';
import { updateClaim, updateMember } from '../../firebase/bills.js';
import { formatIDR } from '../../utils/currency.js';

export default function MemberSummary({ member, billId, bill, claims, onNewClaim }) {
  const [confirming, setConfirming] = useState(null);

  const hasPendingClaim = claims.some(c => c.status === 'summary');
  const allPaid = claims.length > 0 && claims.every(c => c.status === 'paid');

  async function handleConfirmPaid(claim) {
    setConfirming(claim.id);
    await updateClaim(billId, member.id, claim.id, { status: 'paid' });
    // Check if all claims are now paid (optimistic)
    const remaining = claims.filter(c => c.id !== claim.id && c.status !== 'paid');
    if (remaining.length === 0) {
      await updateMember(billId, member.id, { state: 'confirmed' });
    }
    setConfirming(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-800">Tagihanmu</h1>
        <p className="text-xs text-gray-400">{member?.name} · {bill?.title}</p>
      </div>

      <div className="flex-1 p-6 space-y-4 max-w-lg mx-auto w-full pb-32">
        {claims.map((claim, idx) => (
          <div
            key={claim.id}
            className={`bg-white rounded-2xl p-4 shadow-sm space-y-2 ${claim.status === 'paid' ? 'opacity-75' : ''}`}
          >
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold text-gray-800">Klaim #{idx + 1}</h3>
              {claim.status === 'paid'
                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Sudah Bayar</span>
                : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Belum Bayar</span>
              }
            </div>

            {claim.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{item.name}</span>
                <span className="font-medium">{formatIDR(item.price)}</span>
              </div>
            ))}

            {(claim.taxShare > 0 || claim.serviceShare > 0) && (
              <div className="flex justify-between text-sm py-1 text-gray-500">
                <span>Pajak & layanan</span>
                <span>{formatIDR((claim.taxShare || 0) + (claim.serviceShare || 0))}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-gray-800 pt-2 border-t">
              <span>Total</span>
              <span className="text-green-600">{formatIDR(claim.total)}</span>
            </div>

            {claim.status !== 'paid' && (
              <>
                {bill?.transfer && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-0.5 mt-2">
                    <p className="text-xs font-semibold text-gray-600">Transfer ke:</p>
                    <p className="text-sm font-bold text-gray-800">🏦 {bill.transfer.bankName}</p>
                    <p className="text-lg font-bold text-green-700 tracking-wider">{bill.transfer.accountNumber}</p>
                    <p className="text-xs text-gray-600">a.n. {bill.transfer.accountHolder}</p>
                    {bill.transfer.notes && <p className="text-xs text-gray-500">{bill.transfer.notes}</p>}
                  </div>
                )}
                <button
                  onClick={() => handleConfirmPaid(claim)}
                  disabled={confirming === claim.id}
                  className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 text-sm mt-1"
                >
                  {confirming === claim.id ? 'Mengonfirmasi...' : '✅ Sudah Transfer'}
                </button>
              </>
            )}
          </div>
        ))}

        {claims.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-400">Belum ada klaim</div>
        )}

        {allPaid && (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-green-600 font-semibold">Semua sudah dibayar!</p>
          </div>
        )}
      </div>

      {!hasPendingClaim && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
          <button
            onClick={onNewClaim}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 max-w-lg mx-auto block"
          >
            + Tambah Klaim Baru
          </button>
        </div>
      )}
    </div>
  );
}
