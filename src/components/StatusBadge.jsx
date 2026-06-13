const states = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  identified: { label: 'Bergabung', color: 'bg-blue-100 text-blue-700' },
  selecting: { label: 'Memilih', color: 'bg-purple-100 text-purple-700' },
  confirmed: { label: 'Konfirmasi', color: 'bg-green-100 text-green-700' },
  paid: { label: 'Sudah Bayar', color: 'bg-gray-100 text-gray-700' },
};

export default function StatusBadge({ state }) {
  const s = states[state] || { label: state, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}
