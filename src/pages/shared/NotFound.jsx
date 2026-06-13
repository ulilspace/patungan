import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">🤔</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Halaman tidak ditemukan</h1>
      <p className="text-gray-500 mb-6">Link ini tidak valid atau sudah tidak aktif.</p>
      <button onClick={() => navigate('/')} className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700">
        Kembali ke Beranda
      </button>
    </div>
  );
}
