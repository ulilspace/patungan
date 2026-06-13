import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBill } from '../../hooks/useBill.js';
import { useMembers } from '../../hooks/useMembers.js';
import { useItems } from '../../hooks/useItems.js';
import { updateBill, updateMember, getSelections, addMember, deleteMember } from '../../firebase/bills.js';
import { calculateSplit } from '../../utils/splitCalculator.js';
import { formatIDR } from '../../utils/currency.js';
import { buildWhatsAppMessage, openWhatsApp } from '../../utils/whatsapp.js';
import { buildInviteUrl, generateMemberToken } from '../../utils/tokenGenerator.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import MemberDetail from './MemberDetail.jsx';
import { serverTimestamp } from 'firebase/firestore';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 inline" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

export default function Dashboard() {
  const { billId } = useParams();
  const { bill, loading } = useBill(billId);
  const { members } = useMembers(billId);
  const { items } = useItems(billId);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState('');
  const [splitResult, setSplitResult] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [newMemberLink, setNewMemberLink] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const [deletingMember, setDeletingMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (bill?.splitResult) setSplitResult(bill.splitResult);
  }, [bill]);

  if (loading) return <div className="min-h-screen bg-amber-50 flex items-center justify-center text-gray-400 font-mono">Memuat...</div>;
  if (!bill) return <div className="min-h-screen bg-amber-50 flex items-center justify-center text-gray-400 font-mono">Tagihan tidak ditemukan</div>;

  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));

  const allConfirmed = members.length > 0 && members.every(m =>
    ['order_confirmed', 'billed', 'transfer_confirmed', 'confirmed', 'paid'].includes(m.state)
  );

  async function handleClose() {
    setClosing(true);
    setCloseError('');
    try {
      const selections = await getSelections(billId);
      const result = calculateSplit(bill, sortedItems, members, selections);
      const resultMap = {};
      result.forEach(r => { resultMap[r.id] = r; });
      setSplitResult(resultMap);
      await updateBill(billId, { state: 'closed', closedAt: serverTimestamp(), splitResult: resultMap });
      await Promise.all(members.map(m => updateMember(billId, m.id, { state: 'billed' })));
    } catch (e) {
      setCloseError('Gagal menutup: ' + e.message);
    }
    setClosing(false);
  }

  async function markReceived(memberId) {
    setMarkingPaid(memberId);
    try {
      await updateMember(billId, memberId, { state: 'transfer_confirmed' });
    } catch (e) {
      console.error(e);
    }
    setMarkingPaid(null);
  }

  async function handleAddMember() {
    if (!newMemberName.trim()) return;
    setAddingMember(true);
    setAddMemberError('');
    setNewMemberLink('');
    try {
      const token = generateMemberToken();
      await addMember(billId, newMemberName.trim(), token);
      const url = buildInviteUrl(billId, token);
      setNewMemberLink(url);
      setNewMemberName('');
    } catch (e) {
      setAddMemberError('Gagal tambah: ' + e.message);
    }
    setAddingMember(false);
  }

  async function handleDeleteMember(member) {
    if (!window.confirm(`Hapus anggota "${member.name}"?`)) return;
    setDeletingMember(member.id);
    try {
      await deleteMember(billId, member.id);
    } catch (e) {
      console.error(e);
    }
    setDeletingMember(null);
  }

  function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(''), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col font-mono">
      <div className="bg-white border-b border-dashed border-amber-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="text-xs text-amber-600 tracking-widest uppercase">Tagihan</p>
            <h1 className="text-lg font-bold text-gray-800">{bill.title || 'Tagihan'}</h1>
            <p className="text-xs text-gray-400">
              {bill.billType === 'shared' ? 'Bersama' : 'Individual'} · Host: {bill.hostName}
            </p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${bill.state === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {bill.state === 'active' ? '🟢 Aktif' : '🔒 Ditutup'}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 max-w-lg mx-auto w-full pb-8">

        {/* Receipt image */}
        {bill.receiptImageUrl && (
          <div className="bg-white rounded-lg border border-dashed border-amber-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setReceiptOpen(o => !o)}
              className="w-full px-4 py-3 flex justify-between items-center text-sm font-semibold text-gray-700"
            >
              <span>🧾 Lihat Struk</span>
              <span className="text-amber-500">{receiptOpen ? '▲' : '▼'}</span>
            </button>
            {receiptOpen && (
              <img src={bill.receiptImageUrl} alt="Struk" className="w-full object-contain max-h-96 border-t border-dashed border-amber-100" />
            )}
          </div>
        )}

        {/* Members */}
        <div className="bg-white rounded-lg border border-dashed border-amber-200 shadow-sm p-4">
          <p className="text-xs tracking-widest uppercase text-amber-600 mb-3">Anggota ({members.length})</p>

          {copiedLink && (
            <div className="bg-green-50 text-green-700 text-xs rounded-lg px-3 py-2 mb-3 border border-dashed border-green-200">✓ Link disalin!</div>
          )}
          {newMemberLink && !copiedLink && (
            <div className="bg-amber-50 border border-dashed border-amber-300 rounded-lg px-3 py-2 mb-3">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Link Anggota Baru</p>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-700 flex-1 truncate">{newMemberLink}</span>
                <button onClick={() => copyLink(newMemberLink)} className="text-xs text-green-600 font-medium whitespace-nowrap border border-green-300 px-2 py-0.5 rounded">Salin</button>
              </div>
            </div>
          )}

          <div className="space-y-0 mb-3">
            {members.map(m => (
              <div key={m.id} className="border-b border-dashed border-amber-50 last:border-0 py-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium text-gray-800 ${bill.billType === 'individual' ? 'cursor-pointer hover:text-amber-700' : ''}`}
                    onClick={() => bill.billType === 'individual' && setSelectedMember(m)}
                  >
                    {m.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusBadge state={m.state} />
                    {bill.billType === 'individual' && (
                      <span
                        className="text-gray-400 cursor-pointer hover:text-amber-600 px-1"
                        onClick={() => setSelectedMember(m)}
                        title="Lihat detail klaim"
                      >
                        ›
                      </span>
                    )}
                    <button
                      onClick={() => copyLink(buildInviteUrl(billId, m.token))}
                      className="text-xs text-blue-400 hover:text-blue-600 px-1"
                      title="Salin link undangan"
                    >
                      {copiedLink === buildInviteUrl(billId, m.token) ? '✓' : '🔗'}
                    </button>
                    {bill.state === 'active' && (
                      <button
                        onClick={() => handleDeleteMember(m)}
                        disabled={deletingMember === m.id}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 px-1"
                        title="Hapus anggota"
                      >
                        {deletingMember === m.id ? <Spinner /> : '✕'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {bill.state === 'active' && (
            <>
              {addMemberError && <p className="text-xs text-red-500 mb-2">{addMemberError}</p>}
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-dashed border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-amber-50 focus:outline-none focus:border-amber-500"
                  placeholder="Nama anggota baru..."
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddMember()}
                />
                <button
                  onClick={handleAddMember}
                  disabled={addingMember || !newMemberName.trim()}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  {addingMember ? <Spinner /> : '+ Tambah'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg border border-dashed border-amber-200 shadow-sm p-4">
          <p className="text-xs tracking-widest uppercase text-amber-600 mb-3">Item ({items.length})</p>
          <div className="space-y-0">
            {sortedItems.map(item => (
              <div key={item.id} className="flex justify-between items-center py-1.5 text-sm border-b border-dashed border-amber-50 last:border-0">
                <div>
                  <span className="text-gray-800">{item.name}</span>
                  {item.claimedByName && <span className="text-xs text-amber-500 ml-2">→ {item.claimedByName}</span>}
                </div>
                <span className="text-gray-700 font-semibold">{formatIDR(item.price)}</span>
              </div>
            ))}
          </div>
          {(bill.tax > 0 || bill.serviceCharge > 0) && (
            <div className="border-t border-dashed border-amber-200 mt-2 pt-2 space-y-1">
              {bill.tax > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Pajak{bill.taxType === 'percent' ? ` (${bill.taxRate}%)` : ''}</span>
                  <span>{formatIDR(bill.tax)}</span>
                </div>
              )}
              {bill.serviceCharge > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Layanan{bill.serviceType === 'percent' ? ` (${bill.serviceRate}%)` : ''}</span>
                  <span>{formatIDR(bill.serviceCharge)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-800 pt-1 border-t border-dashed border-amber-100">
                <span>GRAND TOTAL</span>
                <span>{formatIDR(bill.grandTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {bill.state === 'active' && allConfirmed && (
          <>
            {closeError && <p className="text-xs text-red-500 text-center">{closeError}</p>}
            <button
              onClick={handleClose}
              disabled={closing}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {closing ? <><Spinner /> Menghitung...</> : '🧮 Tutup & Hitung'}
            </button>
          </>
        )}

        {bill.state === 'active' && !allConfirmed && (
          <p className="text-center text-sm text-gray-400">Menunggu semua anggota konfirmasi pesanan...</p>
        )}

        {splitResult && (
          <div className="space-y-3">
            <p className="text-xs tracking-widest uppercase text-amber-600">Rincian per Anggota</p>
            {members.map(m => {
              const r = splitResult[m.id];
              if (!r) return null;
              const waMsg = buildWhatsAppMessage(r, bill);
              const memberData = members.find(mem => mem.id === m.id);
              const isPaid = memberData?.state === 'transfer_confirmed';
              return (
                <div key={m.id} className="bg-white rounded-lg border border-dashed border-amber-200 shadow-sm p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800">{m.name}</span>
                    <span className="font-bold text-green-600">{formatIDR(r.total)}</span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0 mb-3">
                    {r.items.map((it, i) => (
                      <div key={i} className="flex justify-between border-b border-dashed border-amber-50 py-0.5">
                        <span>{it.name}</span>
                        <span>{formatIDR(it.sharedPrice || it.price)}</span>
                      </div>
                    ))}
                    {r.extraShare > 0 && (
                      <div className="flex justify-between py-0.5">
                        <span>Pajak & layanan</span>
                        <span>{formatIDR(r.extraShare)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openWhatsApp(waMsg)}
                      className="flex-1 text-sm bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      WhatsApp
                    </button>
                    {!isPaid ? (
                      <button
                        onClick={() => markReceived(m.id)}
                        disabled={markingPaid === m.id}
                        className="flex-1 text-sm border border-dashed border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {markingPaid === m.id ? <><Spinner /> Menyimpan...</> : 'Tandai Lunas'}
                      </button>
                    ) : (
                      <span className="flex-1 text-center text-sm text-green-600 py-2 font-semibold">✓ Lunas</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedMember && (
        <MemberDetail
          billId={billId}
          member={selectedMember}
          bill={bill}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
}
