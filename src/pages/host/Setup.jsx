import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../../firebase/config.js';
import { createBill } from '../../firebase/bills.js';
import { generateBillId } from '../../utils/tokenGenerator.js';

export default function Setup() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState(() => localStorage.getItem('hostName') || '');
  const [claudeToken, setClaudeToken] = useState(() => localStorage.getItem('claudeApiToken') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleTokenChange(val) {
    setClaudeToken(val);
    localStorage.setItem('claudeApiToken', val);
  }

  function handleNameChange(val) {
    setHostName(val);
    localStorage.setItem('hostName', val);
  }

  async function handleCreate() {
    if (!hostName.trim()) {
      setError('Masukkan nama kamu terlebih dahulu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
      const billId = generateBillId();
      await createBill(billId, hostName.trim());
      sessionStorage.setItem('billId', billId);
      navigate(`/host/upload?billId=${billId}`);
    } catch (err) {
      setError('Gagal membuat tagihan: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🧾</div>
          <h1 className="text-4xl font-bold text-green-700 mb-2">Patungan</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Aplikasi pembagi tagihan yang mudah dan cepat.<br />
            Upload struk, tambah anggota, dan hitung otomatis!
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kamu (Host)</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Contoh: Budi"
              value={hostName}
              onChange={e => handleNameChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claude API Token
              <span className="text-gray-400 font-normal"> (untuk analisis struk)</span>
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="sk-ant-..."
              value={claudeToken}
              onChange={e => handleTokenChange(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Token disimpan di browser kamu saja</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
          >
            {loading ? 'Memuat...' : '✨ Buat Tagihan Baru'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-2xl mb-1">📸</div>
            <p className="text-xs text-gray-600">Upload struk restoran</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-2xl mb-1">👥</div>
            <p className="text-xs text-gray-600">Tambah anggota grup</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="text-2xl mb-1">💰</div>
            <p className="text-xs text-gray-600">Hitung tagihan otomatis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
