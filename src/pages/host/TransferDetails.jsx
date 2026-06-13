import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateBill } from '../../firebase/bills.js';

export default function TransferDetails() {
  const navigate = useNavigate();
  const billId = sessionStorage.getItem('billId');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleNext() {
    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      setError('Isi semua detail transfer');
      return;
    }
    setLoading(true);
    try {
      await updateBill(billId, {
        transfer: { bankName, accountNumber, accountHolder, notes }
      });
      navigate('/host/members');
    } catch (err) {
      setError('Gagal menyimpan: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500">←</button>
          <h1 className="text-xl font-bold text-gray-800">Detail Transfer</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <p className="text-sm text-gray-500">Info rekening untuk anggota melakukan transfer tagihan</p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nama Bank</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="Contoh: BCA, Mandiri, BNI"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nomor Rekening</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="Contoh: 1234567890"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Atas Nama</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="Nama pemilik rekening"
              value={accountHolder}
              onChange={e => setAccountHolder(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Catatan (opsional)</label>
            <textarea
              className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
              rows={3}
              placeholder="Contoh: Transfer dengan berita nama kamu"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl py-3 text-sm"
          >
            {loading ? 'Menyimpan...' : 'Lanjut →'}
          </button>
        </div>
      </div>
    </div>
  );
}
