import { useState, useEffect } from 'react';
import { subscribeClaims } from '../../firebase/bills.js';
import { formatIDR } from '../../utils/currency.js';

export default function MemberDetail({ billId, member, bill, onClose }) {
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    if (!billId || !member?.id) return;
    const unsub = subscribeClaims(billId, member.id, setClaims);
    return unsub;
  }, [billId, member?.id]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        className="bg-amber-50 w-full max-h-[85vh] overflow-y-auto rounded-t-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-dashed border-amber-200 px-6 py-4 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{member.name}</h2>
            <p className="text-xs text-amber-600 uppercase tracking-widest">Rincian Klaim</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none w-8 h-8 flex items-center justify-center"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Claims list */}
        <div className="p-6 space-y-4 max-w-lg mx-auto w-full">
          {claims.length === 0 && (
            <div className="bg-white rounded-xl p-6 text-center text-gray-400 border border-dashed border-amber-200">
              Belum ada klaim
            </div>
          )}

          {claims.map((claim, idx) => (
            <div
              key={claim.id}
              className={`bg-white border border-dashed border-amber-200 rounded-lg shadow-sm p-4 space-y-2 ${claim.status === 'paid' ? 'opacity-75' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-gray-800">Klaim #{idx + 1}</h3>
                {claim.status === 'paid'
                  ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Sudah Bayar</span>
                  : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Belum Bayar</span>
                }
              </div>

              {claim.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-dashed border-amber-50 last:border-0">
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

              <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-dashed border-amber-100">
                <span>Total</span>
                <span className="text-green-600">{formatIDR(claim.total)}</span>
              </div>

              {claim.proofUrl && (
                <div className="mt-2">
                  <p className="text-xs text-amber-700 uppercase tracking-widest mb-1">Bukti Bayar</p>
                  <img
                    src={claim.proofUrl}
                    alt="Bukti bayar"
                    className="w-full max-h-48 object-contain rounded-lg border border-dashed border-amber-200"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
