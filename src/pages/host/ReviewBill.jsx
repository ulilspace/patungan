import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveItems, updateBill } from '../../firebase/bills.js';
import { formatIDR } from '../../utils/currency.js';
import ItemRow from '../../components/ItemRow.jsx';

export default function ReviewBill() {
  const navigate = useNavigate();
  const billId = sessionStorage.getItem('billId');
  const raw = sessionStorage.getItem('parsedBill');
  const parsed = raw ? JSON.parse(raw) : null;

  const [title, setTitle] = useState(parsed?.title || '');
  const [items, setItems] = useState(parsed?.items || []);
  const [tax, setTax] = useState(parsed?.tax || 0);
  const [taxRate] = useState(parsed?.taxRate || 0);
  const [taxBase] = useState(parsed?.taxBase || 0);
  const [serviceCharge, setServiceCharge] = useState(parsed?.serviceCharge || 0);
  const [serviceRate] = useState(parsed?.serviceRate || 0);
  const [serviceBase] = useState(parsed?.serviceBase || 0);
  const [grandTotal, setGrandTotal] = useState(parsed?.grandTotal || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = items.reduce((s, i) => s + Number(i.price), 0);

  function handleItemChange(idx, updated) {
    const newItems = [...items];
    newItems[idx] = updated;
    setItems(newItems);
  }

  function handleRemoveItem(idx) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function handleAddItem() {
    setItems([...items, { name: '', price: 0 }]);
  }

  async function handleNext() {
    if (!billId) { setError('Bill ID tidak ditemukan'); return; }
    if (items.length === 0) { setError('Tambah minimal satu item'); return; }
    setLoading(true);
    try {
      await saveItems(billId, items);
      const billData = {
        title,
        tax: Number(tax),
        taxRate: Number(taxRate),
        taxBase: Number(taxBase),
        serviceCharge: Number(serviceCharge),
        serviceRate: Number(serviceRate),
        serviceBase: Number(serviceBase),
        subtotal,
        grandTotal: Number(grandTotal) || subtotal + Number(tax) + Number(serviceCharge),
      };
      if (parsed?.receiptImageUrl) {
        billData.receiptImageUrl = parsed.receiptImageUrl;
      }
      await updateBill(billId, billData);
      navigate('/host/type');
    } catch (err) {
      setError('Gagal menyimpan: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500">←</button>
          <h1 className="text-xl font-bold text-gray-800">Review Tagihan</h1>
        </div>

        <div className="bg-white rounded-lg border border-dashed border-amber-200 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Judul Tagihan</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm font-medium"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Judul tagihan"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-gray-600">Item ({items.length})</label>
              <button onClick={handleAddItem} className="text-xs text-green-600 hover:text-green-700">+ Tambah</button>
            </div>
            {items.map((item, idx) => (
              <ItemRow
                key={idx}
                item={item}
                editable
                onChange={updated => handleItemChange(idx, updated)}
                onRemove={() => handleRemoveItem(idx)}
              />
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-600">Pajak</span>
              <input
                type="number"
                className="w-32 border rounded px-2 py-1 text-right text-sm"
                value={tax}
                onChange={e => setTax(e.target.value)}
              />
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-600">Biaya Layanan</span>
              <input
                type="number"
                className="w-32 border rounded px-2 py-1 text-right text-sm"
                value={serviceCharge}
                onChange={e => setServiceCharge(e.target.value)}
              />
            </div>
            <div className="flex justify-between text-sm items-center font-bold border-t pt-2">
              <span>Grand Total</span>
              <input
                type="number"
                className="w-32 border rounded px-2 py-1 text-right text-sm font-bold"
                value={grandTotal}
                onChange={e => setGrandTotal(e.target.value)}
              />
            </div>
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
