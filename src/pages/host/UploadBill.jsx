import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { parseBillImage, expandItems } from '../../services/claude.js';
import { uploadReceiptImage } from '../../firebase/storage.js';

export default function UploadBill() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const billId = searchParams.get('billId') || sessionStorage.getItem('billId');
  const fileRef = useRef();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualItems, setManualItems] = useState([{ name: '', price: 0 }]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }

  async function handleAnalyze() {
    if (!imageFile) {
      setError('Pilih gambar terlebih dahulu');
      return;
    }
    const token = localStorage.getItem('claudeApiToken');
    if (!token) {
      setError('Claude API Token belum diisi. Kembali ke halaman awal.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(',')[1];
        const mimeType = imageFile.type;
        try {
          const parsed = await parseBillImage(base64, mimeType);
          const items = expandItems(parsed.items || []);
          const parsedBillData = {
            title: parsed.suggestedTitle || parsed.restaurantName || 'Tagihan',
            items,
            subtotal: parsed.subtotal || 0,
            tax: parsed.tax || 0,
            taxRate: parsed.taxRate || 0,
            taxBase: parsed.taxBase || 0,
            serviceCharge: parsed.serviceCharge || 0,
            serviceRate: parsed.serviceRate || 0,
            serviceBase: parsed.serviceBase || 0,
            grandTotal: parsed.grandTotal || 0,
          };
          // Upload receipt image to Firebase Storage
          if (billId && imageFile) {
            try {
              const receiptImageUrl = await uploadReceiptImage(billId, imageFile);
              parsedBillData.receiptImageUrl = receiptImageUrl;
            } catch (uploadErr) {
              console.error('Failed to upload receipt image:', uploadErr);
            }
          }
          sessionStorage.setItem('parsedBill', JSON.stringify(parsedBillData));
          navigate('/host/review');
        } catch (err) {
          setError('Gagal menganalisis struk: ' + err.message + '. Coba input manual.');
          setLoading(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (err) {
      setError('Gagal membaca file: ' + err.message);
      setLoading(false);
    }
  }

  function handleManualSubmit() {
    const validItems = manualItems.filter(i => i.name.trim());
    if (!manualTitle.trim() || validItems.length === 0) {
      setError('Isi judul dan minimal satu item');
      return;
    }
    const subtotal = validItems.reduce((s, i) => s + Number(i.price), 0);
    sessionStorage.setItem('parsedBill', JSON.stringify({
      title: manualTitle,
      items: validItems.map(i => ({ ...i, price: Number(i.price) })),
      subtotal,
      tax: 0,
      serviceCharge: 0,
      grandTotal: subtotal,
    }));
    navigate('/host/review');
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700">←</button>
          <h1 className="text-xl font-bold text-gray-800">Upload Struk</h1>
        </div>

        {!manualMode ? (
          <div className="bg-white rounded-lg border border-dashed border-amber-200 shadow-sm p-6 space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <>
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-sm text-gray-500">Ketuk untuk pilih foto struk</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              onChange={handleFileChange}
            />

            {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

            <button
              onClick={handleAnalyze}
              disabled={loading || !imageFile}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold rounded-xl py-3 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Menganalisis...
                </span>
              ) : '🔍 Analisis Struk'}
            </button>

            <button
              onClick={() => setManualMode(true)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              Input manual tanpa foto
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-dashed border-amber-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-700">Input Manual</h2>
              <button onClick={() => setManualMode(false)} className="text-sm text-green-600">Pakai foto</button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Judul Tagihan</label>
              <input
                className="w-full border rounded-xl px-3 py-2 text-sm"
                placeholder="Contoh: Makan Siang di Warung Bu Sari"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
              {manualItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    className="flex-1 border rounded-xl px-3 py-2 text-sm"
                    placeholder="Nama item"
                    value={item.name}
                    onChange={e => {
                      const updated = [...manualItems];
                      updated[idx] = { ...item, name: e.target.value };
                      setManualItems(updated);
                    }}
                  />
                  <input
                    className="w-28 border rounded-xl px-3 py-2 text-sm"
                    type="number"
                    placeholder="Harga"
                    value={item.price}
                    onChange={e => {
                      const updated = [...manualItems];
                      updated[idx] = { ...item, price: Number(e.target.value) };
                      setManualItems(updated);
                    }}
                  />
                  {manualItems.length > 1 && (
                    <button
                      onClick={() => setManualItems(manualItems.filter((_, i) => i !== idx))}
                      className="text-red-500 font-bold px-2"
                    >×</button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setManualItems([...manualItems, { name: '', price: 0 }])}
                className="text-sm text-green-600 hover:text-green-700 mt-1"
              >
                + Tambah Item
              </button>
            </div>

            {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

            <button
              onClick={handleManualSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3 text-sm"
            >
              Lanjut →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
