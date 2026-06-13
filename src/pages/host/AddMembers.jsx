import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMember } from '../../firebase/bills.js';
import { generateMemberToken, buildInviteUrl } from '../../utils/tokenGenerator.js';
import { useMembers } from '../../hooks/useMembers.js';
import MemberCard from '../../components/MemberCard.jsx';

export default function AddMembers() {
  const navigate = useNavigate();
  const billId = sessionStorage.getItem('billId');
  const { members } = useMembers(billId);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    const token = generateMemberToken();
    await addMember(billId, name.trim(), token);
    setName('');
    setLoading(false);
  }

  function handleCopy(url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  async function handleShare(url, memberName) {
    try {
      await navigator.share({ title: 'Patungan', text: `Hei ${memberName}, klik link ini untuk ikut patungan!`, url });
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500">←</button>
          <h1 className="text-xl font-bold text-gray-800">Tambah Anggota</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-xl px-3 py-2 text-sm"
              placeholder="Nama anggota"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              disabled={loading || !name.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              Tambah
            </button>
          </div>
        </div>

        {copied && (
          <div className="bg-green-50 text-green-700 text-sm rounded-xl px-4 py-3 mb-4 text-center">
            ✓ Link disalin!
          </div>
        )}

        <div className="mb-4">
          {members.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Belum ada anggota. Tambah anggota di atas.</p>
          ) : (
            members.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                inviteUrl={buildInviteUrl(billId, member.token)}
                onCopy={handleCopy}
                onShare={handleShare}
              />
            ))
          )}
        </div>

        <button
          onClick={() => navigate('/host/publish')}
          disabled={members.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl py-3 text-sm"
        >
          Lanjut ke Publish →
        </button>
      </div>
    </div>
  );
}
