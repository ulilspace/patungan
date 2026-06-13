export function getLocalBillIds() {
  return JSON.parse(localStorage.getItem('patunganBills') || '[]');
}

export function addLocalBillId(id) {
  const ids = getLocalBillIds();
  if (!ids.includes(id)) {
    ids.unshift(id);
    localStorage.setItem('patunganBills', JSON.stringify(ids));
  }
}
