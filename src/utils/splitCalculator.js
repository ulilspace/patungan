export function calcExtrasForSubtotal(bill, subtotal) {
  const billSubtotal = bill.subtotal || 0;

  // Discount applied proportionally to each member's subtotal
  const discountRatio = (bill.discount && billSubtotal > 0) ? bill.discount / billSubtotal : 0;
  const memberDiscount = subtotal * discountRatio;
  const effectiveSubtotal = subtotal - memberDiscount;

  // DPP ratio for tax/service (based on effective subtotal after discount)
  const dppRatio = (bill.taxBase && billSubtotal > 0) ? bill.taxBase / billSubtotal : 1;
  const memberDpp = effectiveSubtotal * dppRatio;

  let tax = 0, service = 0;
  if (bill.taxRate > 0) {
    tax = memberDpp * bill.taxRate / 100;
  } else {
    // Fall back to proportional share of flat amount
    const ratio = billSubtotal > 0 ? subtotal / billSubtotal : 0;
    tax = (bill.tax || 0) * ratio;
  }
  if (bill.serviceRate > 0) {
    const svcRatio = (bill.serviceBase && billSubtotal > 0) ? bill.serviceBase / billSubtotal : dppRatio;
    service = subtotal * svcRatio * bill.serviceRate / 100;
  } else {
    const ratio = billSubtotal > 0 ? subtotal / billSubtotal : 0;
    service = (bill.serviceCharge || 0) * ratio;
  }
  return { discount: memberDiscount, tax, service, total: -memberDiscount + tax + service };
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

  const results = Object.values(memberMap).map(m => {
    const extras = calcExtrasForSubtotal(bill, m.itemsTotal);
    return { ...m, discountShare: extras.discount, extraShare: extras.total, total: m.itemsTotal + extras.total };
  });

  const calculatedTotal = results.reduce((s, m) => s + m.total, 0);
  const remainder = (bill.grandTotal || 0) - calculatedTotal;
  if (results.length > 0) {
    results[results.length - 1].total += remainder;
    results[results.length - 1].remainder = remainder;
  }

  return results;
}
