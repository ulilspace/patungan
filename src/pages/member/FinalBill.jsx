import { useState } from 'react';
import { updateMember } from '../../firebase/bills.js';
import { formatIDR } from '../../utils/currency.js';

export default function FinalBill({ member, billId, bill }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(member?.state === 'paid');

  const splitResult = bill?.splitResult;
  const myResult = splitResult?.[member?.id];

  async function handleConfirmTransfer() {
    setConfirming(true);
    await updateMember(billId, member.id, { state: 'paid' });
    setConfirmed(true);
    setConfirming(false);
  }

  if (bill?.state !== 'closed' && !myResult) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <p className="text-gray-600">Tagihan belum ditutup oleh host.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-800">Tagihan Kamu</h1>
        <p className="text-xs text-gray-400">{member?.name} · {bill?.title}</p>
      </div>

      <div className="flex-1 p-6 space-y-4 max-w-lg mx-auto w-full pb-32">
        {myResult ? (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <h3 className="font-semibold text-gray-800 mb-2">Pesananmu</h3>
              {myResult.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="font-medium">{formatIDR(item.sharedPrice || item.price)}</span>
                </div>
              ))}
              {myResult.extraShare > 0 && (
                <div className="flex justify-between text-sm py-1.5 text-gray-500">
                  <span>Pajak & layanan</span>
                  <span>{formatIDR(myResult.extraShare)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-800 pt-2 text-lg border-t">
                <span>Total</span>
                <span className="text-green-600">{formatIDR(myResult.total)}</span>
              </div>
            </div>

            {bill?.transfer && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-1">
                <p className="text-sm font-semibold text-gray-700">Transfer ke:</p>
                <p className="text-lg font-bold text-gray-800">🏦 {bill.transfer.bankName}</p>
                <p className="text-2xl font-bold text-green-700 tracking-wider">{bill.transfer.accountNumber}</p>
                <p className="text-sm text-gray-600">a.n. {bill.transfer.accountHolder}</p>
                {bill.transfer.notes && <p className="text-sm text-gray-500">{bill.transfer.notes}</p>}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-400">Rincian sedang dihitung...</div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
        {confirmed ? (
          <div className="text-center text-green-600 font-semibold py-3">✅ Transfer sudah dikonfirmasi</div>
        ) : (
          <button
            onClick={handleConfirmTransfer}
            disabled={confirming || !myResult}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 max-w-lg mx-auto block"
          >
            {confirming ? 'Mengonfirmasi...' : '✅ Konfirmasi Sudah Transfer'}
          </button>
        )}
      </div>
    </div>
  );
}
