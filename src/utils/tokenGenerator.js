export function generateMemberToken() {
  return Math.random().toString(36).substring(2, 10);
}

export function generateBillId() {
  return Math.random().toString(36).substring(2, 10);
}

export function buildInviteUrl(billId, memberToken) {
  return `${window.location.origin}/#/member/${billId}/${memberToken}`;
}
