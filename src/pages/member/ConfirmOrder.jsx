import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBill } from '../../hooks/useBill.js';
import { getSelections, getItems } from '../../firebase/bills.js';
import { formatIDR } from '../../utils/currency.js';

export default function ConfirmOrder() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const memberId = sessionStorage.getItem('memberId');
  const memberName = sessionStorage.getItem('memberName');
  const { bill } = useBill(billId);
  const [myItems, setMyItems] = useState([]);

  useEffect(() => {
    async function load() {
      const [allItems, sels] = await Promise.all([getItems(billId), getSelections(billId)]);
      const mySelIds = sels.filter(s => s.memberId === memberId).map(s => s.itemId);
      setMyItems(allItems.filter(i => mySelIds.includes(i.id)));
    }
    load();
  }, [billId, memberId]);

  const subtotal = myItems.reduce((s, i) => s + i.price, 0);

  function handleNext() {
    if (bill?.billType === 'shared') {
      navigate(`/member/${billId}/waiting`);
    } else {
      navigate(`/member/${billId}/final`);
    }
  }

  if (!bill) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-800">Konfirmasi Pesanan</h1>
        <p className="text-xs text-gray-400">{memberName}</p>
      </div>

      <div className="flex-1 p-6 space-y-4 max-w-lg mx-auto w-full pb-32">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="font-semibold text-gray-800 mb-2">Pesananmu</h3>
          {myItems.map(item => (
            <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-gray-700">{item.name}</span>
              <span className="font-medium text-gray-700">{formatIDR(item.price)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-gray-800 pt-2">
            <span>Subtotal</span>
            <span className="text-green-600">{formatIDR(subtotal)}</span>
          </div>
          {bill.billType === 'shared' && (
            <p className="text-xs text-gray-400 pt-1">* Pajak & biaya layanan dihitung setelah semua konfirmasi</p>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          ⚠️ Setelah dikonfirmasi, pesanan tidak bisa diubah.
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
        <button
          onClick={handleNext}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 max-w-lg mx-auto block"
        >
          Pesanan Dikonfirmasi ✓
        </button>
      </div>
    </div>
  );
}
