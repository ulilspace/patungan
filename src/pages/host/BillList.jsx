import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBillsByIds } from '../../firebase/bills.js';
import { getLocalBillIds } from '../../utils/localBills.js';
import { formatIDR } from '../../utils/currency.js';

function StateBadge({ state }) {
  const map = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
    active: { label: 'Aktif', cls: 'bg-green-100 text-green-700' },
    closed: { label: 'Ditutup', cls: 'bg-amber-100 text-amber-700' },
  };
  const { label, cls } = map[state] || { label: state, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

export default function BillList() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = getLocalBillIds();
    if (ids.length === 0) { setLoading(false); return; }
    getBillsByIds(ids).then(data => {
      setBills(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">←</button>
          <h1 className="text-xl font-bold text-gray-800">Tagihan Saya</h1>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Memuat...</div>
        ) : bills.length === 0 ? (
          <div className="bg-white border border-dashed border-amber-200 rounded-lg shadow-sm p-8 text-center text-gray-400">
            <div className="text-4xl mb-3">🧾</div>
            <p className="text-sm">Belum ada tagihan tersimpan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map(bill => (
              <button
                key={bill.id}
                onClick={() => navigate(`/host/dashboard/${bill.id}`)}
                className="w-full bg-white border border-dashed border-amber-200 rounded-lg shadow-sm p-4 text-left hover:bg-amber-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{bill.title || 'Tagihan'}</span>
                  <StateBadge state={bill.state} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-amber-700 uppercase tracking-widest">
                    {bill.billType === 'shared' ? 'Bersama' : bill.billType === 'individual' ? 'Individual' : '-'}
                  </span>
                  {bill.grandTotal > 0 && (
                    <span className="text-xs font-medium text-gray-600">{formatIDR(bill.grandTotal)}</span>
                  )}
                </div>
                {bill.createdAt?.seconds && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(bill.createdAt.seconds * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg py-3 text-sm"
        >
          + Buat Tagihan Baru
        </button>
      </div>
    </div>
  );
}
