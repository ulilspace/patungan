import { formatIDR } from '../utils/currency.js';

export default function ItemRow({ item, onRemove, onChange, editable = false }) {
  if (editable) {
    return (
      <div className="flex gap-2 items-center py-2 border-b border-gray-100">
        <input
          className="flex-1 text-sm border rounded px-2 py-1"
          value={item.name}
          onChange={e => onChange({ ...item, name: e.target.value })}
        />
        <input
          className="w-28 text-sm border rounded px-2 py-1 text-right"
          type="number"
          value={item.price}
          onChange={e => onChange({ ...item, price: Number(e.target.value) })}
        />
        <button onClick={onRemove} className="text-red-500 text-lg font-bold px-2">×</button>
      </div>
    );
  }
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
      <span>{item.name}</span>
      <span className="font-medium">{formatIDR(item.price)}</span>
    </div>
  );
}
