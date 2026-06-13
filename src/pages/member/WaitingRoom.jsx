import { useMembers } from '../../hooks/useMembers.js';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function WaitingRoom({ member, billId, bill }) {
  const { members } = useMembers(billId);

  // MemberRouter will re-render with new state when bill closes
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-sm w-full space-y-6">
        <div className="text-5xl animate-bounce">⏳</div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Menunggu yang lain...</h2>
          <p className="text-sm text-gray-500 mt-1">Host akan menutup tagihan setelah semua konfirmasi</p>
        </div>
        <div className="space-y-2 text-left">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{m.name}</span>
              <StatusBadge state={m.state} />
            </div>
          ))}
        </div>
        {bill?.state === 'closed' && (
          <p className="text-green-600 text-sm font-medium">Tagihan ditutup! Memuat rincian...</p>
        )}
      </div>
    </div>
  );
}
