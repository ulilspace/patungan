export function formatIDR(amount) {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}
