import { formatIDR } from './currency.js';

export function buildWhatsAppMessage(memberResult, bill) {
  const lines = [
    `*Patungan - ${bill.title}*`,
    `Halo ${memberResult.name}! Berikut tagihan kamu:`,
    '',
    '*Pesananmu:*',
    ...memberResult.items.map(i => `- ${i.name}: ${formatIDR(i.sharedPrice || i.price)}`),
    '',
    `Subtotal: ${formatIDR(memberResult.itemsTotal)}`,
    `Pajak & Layanan: ${formatIDR(memberResult.extraShare || 0)}`,
    `*Total: ${formatIDR(memberResult.total)}*`,
    '',
    '*Transfer ke:*',
    `Bank: ${bill.transfer?.bankName}`,
    `No. Rekening: ${bill.transfer?.accountNumber}`,
    `Atas Nama: ${bill.transfer?.accountHolder}`,
    bill.transfer?.notes ? `Catatan: ${bill.transfer.notes}` : '',
    '',
    'Mohon transfer segera ya! 🙏'
  ].filter(l => l !== undefined);

  return encodeURIComponent(lines.join('\n'));
}

export function openWhatsApp(message) {
  window.open(`https://wa.me/?text=${message}`, '_blank');
}
