import StatusBadge from './StatusBadge.jsx';

export default function MemberCard({ member, inviteUrl, onCopy, onShare }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-800">{member.name}</span>
        <StatusBadge state={member.state} />
      </div>
      {inviteUrl && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onCopy(inviteUrl)}
            className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg py-2 px-3 text-gray-700"
          >
            📋 Salin Link
          </button>
          {navigator.share && (
            <button
              onClick={() => onShare(inviteUrl, member.name)}
              className="flex-1 text-xs bg-green-50 hover:bg-green-100 rounded-lg py-2 px-3 text-green-700"
            >
              📤 Bagikan
            </button>
          )}
        </div>
      )}
    </div>
  );
}
