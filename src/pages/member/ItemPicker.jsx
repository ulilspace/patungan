import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBill } from '../../hooks/useBill.js';
import { useItems } from '../../hooks/useItems.js';
import { useMembers } from '../../hooks/useMembers.js';
import { saveSelections, updateMember, claimItem } from '../../firebase/bills.js';
import { formatIDR } from '../../utils/currency.js';

export default function ItemPicker() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const memberId = sessionStorage.getItem('memberId');
  const memberName = sessionStorage.getItem('memberName');
  const { bill } = useBill(billId);
  const { items } = useItems(billId);
  const { members } = useMembers(billId);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleToggle(item) {
    if (!bill || bill.state === 'closed') return;
    const isSelected = selected.has(item.id);

    if (bill.billType === 'individual') {
      if (isSelected) {
        setSelected(prev => { const s = new Set(prev); s.delete(item.id); return s; });
      } else {
        if (item.claimedBy && item.claimedBy !== memberId) {
          showToast(`Sudah diambil oleh ${item.claimedByName}`);
          return;
        }
        await claimItem(billId, item.id, memberId, memberName);
        setSelected(prev => new Set([...prev, item.id]));
      }
    } else {
      setSelected(prev => {
        const s = new Set(prev);
        if (s.has(item.id)) s.delete(item.id); else s.add(item.id);
        return s;
      });
    }
  }

  async function handleConfirm() {
    if (selected.size === 0) { showToast('Pilih minimal 1 item'); return; }
    setSaving(true);
    try {
      await saveSelections(billId, memberId, memberName, [...selected]);
      await updateMember(billId, memberId, { state: 'order_confirmed' });
      navigate(`/member/${billId}/confirm`);
    } catch (e) {
      showToast('Gagal menyimpan: ' + e.message);
      setSaving(false);
    }
  }

  const total = [...selected].reduce((s, id) => {
    const item = items.find(i => i.id === id);
    return s + (item?.price || 0);
  }, 0);

  if (!bill) return <div className="min-h-screen flex items-center justify-center text-gray-400">Memuat...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-800">{bill.title}</h1>
        <p className="text-xs text-gray-400">Pilih pesananmu, {memberName}</p>
      </div>

      {toast && (
        <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{toast}</div>
      )}

      <div className="flex-1 p-6 space-y-2 pb-36 max-w-lg mx-auto w-full">
        {items.map(item => {
          const isClaimed = bill.billType === 'individual' && item.claimedBy && item.claimedBy !== memberId;
          const isSelected = selected.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => !isClaimed && handleToggle(item)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all
                ${isClaimed ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' : 'cursor-pointer'}
                ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
            >
              <div>
                <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                {isClaimed && <div className="text-xs text-gray-400">Diambil oleh {item.claimedByName}</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">{formatIDR(item.price)}</span>
                {!isClaimed && (
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                    ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6">
        <div className="flex justify-between items-center mb-3 max-w-lg mx-auto">
          <span className="text-sm text-gray-500">{selected.size} item dipilih</span>
          <span className="font-bold text-green-600">{formatIDR(total)}</span>
        </div>
        <button
          onClick={handleConfirm}
          disabled={saving || selected.size === 0}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 max-w-lg mx-auto block"
        >
          {saving ? 'Menyimpan...' : 'Konfirmasi Pesanan →'}
        </button>
      </div>
    </div>
  );
}
