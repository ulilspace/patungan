import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateBill } from '../../firebase/bills.js';

export default function BillType() {
  const navigate = useNavigate();
  const billId = sessionStorage.getItem('billId');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSelect(type) {
    setSelected(type);
    setLoading(true);
    await updateBill(billId, { billType: type });
    navigate('/host/transfer');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500">←</button>
          <h1 className="text-xl font-bold text-gray-800">Tipe Pembagian</h1>
        </div>

        <p className="text-sm text-gray-500 mb-6">Pilih cara pembagian tagihan untuk grup ini</p>

        <div className="space-y-4">
          <button
            onClick={() => handleSelect('shared')}
            disabled={loading}
            className="w-full bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-400 rounded-2xl p-6 text-left transition-all"
          >
            <div className="text-3xl mb-3">🤝</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Shared (Pilih Bersama)</h2>
            <p className="text-sm text-gray-500">Setiap item dibagi oleh semua orang yang memilihnya. Cocok untuk makanan yang dishare.</p>
            <div className="mt-3 text-xs text-green-600 font-medium">✓ Pilih item yang kamu makan</div>
          </button>

          <button
            onClick={() => handleSelect('individual')}
            disabled={loading}
            className="w-full bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-400 rounded-2xl p-6 text-left transition-all"
          >
            <div className="text-3xl mb-3">👤</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Individual (Klaim Duluan)</h2>
            <p className="text-sm text-gray-500">Setiap orang bayar item yang diklaim duluan. Cocok untuk pesanan masing-masing.</p>
            <div className="mt-3 text-xs text-blue-600 font-medium">✓ Klaim item kamu sebelum orang lain</div>
          </button>
        </div>
      </div>
    </div>
  );
}
