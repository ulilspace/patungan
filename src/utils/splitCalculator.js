export function calcExtrasForSubtotal(bill, subtotal) {
  let tax = 0, service = 0;
  if (bill.taxType === 'percent' && bill.taxRate > 0) {
    tax = subtotal * bill.taxRate / 100;
  } else {
    tax = bill.tax || 0;
  }
  if (bill.serviceType === 'percent' && bill.serviceRate > 0) {
    service = subtotal * bill.serviceRate / 100;
  } else {
    service = bill.serviceCharge || 0;
  }
  return { tax, service, total: tax + service };
}

export function calculateSplit(bill, items, members, selections) {
  const memberMap = {};
  members.forEach(m => { memberMap[m.id] = { ...m, itemsTotal: 0, items: [] }; });

  if (bill.billType === 'individual') {
    items.forEach(item => {
      if (item.claimedBy && memberMap[item.claimedBy]) {
        memberMap[item.claimedBy].itemsTotal += item.price;
        memberMap[item.claimedBy].items.push(item);
      }
    });
  } else {
    items.forEach(item => {
      const itemSelectors = selections.filter(s => s.itemId === item.id);
      if (itemSelectors.length === 0) return;
      const share = item.price / itemSelectors.length;
      itemSelectors.forEach(sel => {
        if (memberMap[sel.memberId]) {
          memberMap[sel.memberId].itemsTotal += share;
          memberMap[sel.memberId].items.push({ ...item, sharedPrice: share });
        }
      });
    });
  }

  const subtotal = Object.values(memberMap).reduce((s, m) => s + m.itemsTotal, 0);
  const extras = (bill.tax || 0) + (bill.serviceCharge || 0);

  const results = Object.values(memberMap).map(m => {
    const ratio = subtotal > 0 ? m.itemsTotal / subtotal : 0;
    const extraShare = extras * ratio;
    return { ...m, extraShare, total: m.itemsTotal + extraShare };
  });

  const calculatedTotal = results.reduce((s, m) => s + m.total, 0);
  const remainder = (bill.grandTotal || 0) - calculatedTotal;
  if (results.length > 0) {
    results[results.length - 1].total += remainder;
    results[results.length - 1].remainder = remainder;
  }

  return results;
}
