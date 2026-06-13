import { useState, useEffect } from 'react';
import { useItems } from '../../hooks/useItems.js';
import { useMembers } from '../../hooks/useMembers.js';
import { saveSelections, updateMember, claimItemAtomic, saveClaim, getClaims, unclaimItem } from '../../firebase/bills.js';
import { calcExtrasForSubtotal } from '../../utils/splitCalculator.js';
import { formatIDR } from '../../utils/currency.js';

export default function ItemPicker({ member, billId, bill, onStateChange, onClaimSaved }) {
  const { items } = useItems(billId);
  const { members } = useMembers(billId);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [claiming, setClaiming] = useState(null);
  const [paidItemIds, setPaidItemIds] = useState(new Set());

  useEffect(() => {
    if (bill?.billType !== 'individual') return;
    getClaims(billId, member.id).then(claims => {
      const paid = claims.filter(c => c.status === 'paid').flatMap(c => c.items.map(i => i.id));
      setPaidItemIds(new Set(paid));
    });
  }, [billId, member.id, bill?.billType]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleToggle(item) {
    if (!bill || bill.state === 'closed') return;
    const isSelected = selected.has(item.id);
    const isClaimed = bill.billType === 'individual' && item.claimedBy && item.claimedBy !== member.id;

    if (bill.billType === 'individual') {
      // Show toast if item already taken by someone else
      if (isClaimed) {
        showToast(`Item sudah diambil oleh ${item.claimedByName}`);
        return;
      }
      if (isSelected) {
        // Deselect: release claim in Firestore so others can take it
        setSelected(prev => { const s = new Set(prev); s.delete(item.id); return s; });
        await unclaimItem(billId, item.id);
      } else {
        setClaiming(item.id);
        try {
          await claimItemAtomic(billId, item.id, member.id, member.name);
          setSelected(prev => new Set([...prev, item.id]));
          setClaiming(null);
        } catch (err) {
          setClaiming(null);
          showToast(err.message);
        }
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
      if (bill?.billType === 'individual') {
        const claimedItems = [...selected].map(id => {
          const item = items.find(i => i.id === id);
          return { id, name: item.name, price: item.price };
        });
        const subtotal = claimedItems.reduce((s, i) => s + i.price, 0);
        const extras = calcExtrasForSubtotal(bill, subtotal);
        await saveClaim(billId, member.id, {
          items: claimedItems,
          subtotal,
          taxShare: extras.tax,
          serviceShare: extras.service,
          total: subtotal + extras.total,
        });
        if (onClaimSaved) onClaimSaved();
      } else {
        await saveSelections(billId, member.id, member.name, [...selected]);
        await updateMember(billId, member.id, { state: 'confirmed' });
        onStateChange({ ...member, state: 'confirmed' });
      }
    } catch (e) {
      showToast('Gagal menyimpan: ' + e.message);
      setSaving(false);
    }
  }

  const total = [...selected].reduce((s, id) => {
    const item = items.find(i => i.id === id);
    return s + (item?.price || 0);
  }, 0);

  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      <div className="bg-white border-b border-dashed border-amber-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-800">{bill?.title || 'Pilih Pesanan'}</h1>
        <p className="text-xs text-amber-700 uppercase tracking-widest">Halo {member.name}, pilih yang kamu pesan</p>
      </div>

      {toast && (
        <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{toast}</div>
      )}

      <div className="flex-1 p-6 space-y-2 pb-36 max-w-lg mx-auto w-full">
        {sortedItems.map(item => {
          const isClaimed = bill?.billType === 'individual' && item.claimedBy && item.claimedBy !== member.id;
          const isSelected = selected.has(item.id);
          const isClaiming = claiming === item.id;
          const isAlreadyPaid = paidItemIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => !isClaiming && !isAlreadyPaid && handleToggle(item)}
              className={`flex items-center justify-between p-3 rounded-lg border-b border-dashed transition-all
                ${isClaimed ? 'opacity-50 cursor-not-allowed bg-gray-50 border-amber-100' : ''}
                ${isAlreadyPaid ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-100' : ''}
                ${!isClaimed && !isAlreadyPaid ? 'cursor-pointer' : ''}
                ${isSelected && !isAlreadyPaid ? 'border-green-500 bg-green-50' : ''}
                ${!isClaimed && !isSelected && !isAlreadyPaid ? 'border-amber-100 bg-white hover:bg-amber-50' : ''}
              `}
            >
              <div>
                <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                {isClaimed && <div className="text-xs text-gray-400">Diambil oleh {item.claimedByName}</div>}
                {isAlreadyPaid && <div className="text-xs text-gray-400">Sudah dibayar</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">{formatIDR(item.price)}</span>
                {isClaiming ? (
                  <svg className="animate-spin h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : !isClaimed && !isAlreadyPaid && (
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
