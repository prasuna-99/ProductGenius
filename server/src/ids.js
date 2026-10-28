// Central ID scheme (server is the single source of truth).
//   User:     USR-<ROLE>-<YYYYMMDD>-<seq>   ROLE = CUS (customer) | SEL (seller) | ADM (admin)
//                                             seq = the account's global seqNum
//   Product:  PRD-<sellerSeq>-<seq>          sellerSeq = seller's seqNum, seq = per-seller counter
//   Review:   REV-<reviewerSeq>-<seq>        per-reviewer counter
//   Others:   ORD|ITM|TXN|CMP|CAT|REQ-<YYYYMMDD>-<seq>   per-day counters
// Runtime counters live in the Sequence table ({ key, last }) and are bumped
// atomically via upsert. The one-off rename of old rows lives in
// server/scripts/migrate-ids.js (+ idmap.json); the frontend codemod that
// rewrites browser storage to match runs once at sign-in (see AppContext).
function dayOf(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

const pad6 = (n) => String(n).padStart(6, '0');

const ROLE_CODE = { customer: 'CUS', seller: 'SEL', admin: 'ADM' };

function userId(role, seq, date) {
  return `USR-${ROLE_CODE[role] || 'USR'}-${date}-${pad6(seq)}`;
}

function productId(sellerSeq, n) {
  return `PRD-${pad6(sellerSeq)}-${pad6(n)}`;
}

function reviewId(userSeq, n) {
  return `REV-${pad6(userSeq)}-${pad6(n)}`;
}

function datedId(prefix, date, n) {
  return `${prefix}-${date}-${pad6(n)}`;
}

async function nextSeq(db, key) {
  const row = await db.sequence.upsert({
    where: { key },
    update: { last: { increment: 1 } },
    create: { key, last: 1 },
  });
  return row.last;
}

module.exports = { dayOf, pad6, userId, productId, reviewId, datedId, nextSeq };
