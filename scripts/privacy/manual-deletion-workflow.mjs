// Offline operator aid only: no email, Auth, Storage or database calls.
// Persist returned records privately, outside Git. Never log confirmation tokens.
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

const digest = value => createHash('sha256').update(value).digest('hex');
const requireAt = at => {
  if (!Number.isSafeInteger(at) || at < 0) throw new Error('Explicit valid timestamp required');
};

export function receiveRequest(accountRef, scope, openRequests, at) {
  requireAt(at);
  if (!accountRef || !['account-and-personal-data', 'specific-personal-data'].includes(scope)) {
    throw new Error('Verified internal account reference and constrained scope required');
  }
  const duplicate = openRequests.find(r => r.accountRef === accountRef && r.scope === scope && r.status !== 'CLOSED');
  if (duplicate) return { record: duplicate, duplicate: true };
  return { duplicate: false, record: { id: randomUUID(), accountRef, scope, status: 'RECEIVED', receivedAt: at, events: [{ at, type: 'RECEIVED' }] } };
}

export function prepareChallenge(record, at) {
  requireAt(at);
  if (record.status !== 'RECEIVED') throw new Error('Challenge already prepared or request not open');
  const token = randomBytes(32).toString('base64url');
  return { token, record: { ...record, status: 'VERIFICATION_PENDING', tokenHash: digest(`${record.id}:${token}`), expiresAt: at + 24 * 60 * 60 * 1000, attempts: 0,
    events: [...record.events, { at, type: 'CHALLENGE_PREPARED_NOT_SENT' }] } };
}

export function verifyReply(record, token, deliveryEvidenceRef, replyEvidenceRef, at) {
  requireAt(at);
  if (record.status !== 'VERIFICATION_PENDING') throw new Error('No pending challenge');
  if (at < record.receivedAt || at >= record.expiresAt) throw new Error('Challenge expired or invalid time');
  // Evidence references require human inspection of delivery to the registered
  // mailbox and its reply. This module cannot establish email ownership alone.
  if (!deliveryEvidenceRef || !replyEvidenceRef) throw new Error('Independent mailbox evidence required');
  const attempts = record.attempts + 1;
  const match = typeof token === 'string' && token.length <= 128 &&
    timingSafeEqual(Buffer.from(record.tokenHash, 'hex'), Buffer.from(digest(`${record.id}:${token}`), 'hex'));
  if (!match) return { ...record, attempts, status: attempts >= 5 ? 'OWNER_REVIEW' : record.status,
    events: [...record.events, { at, type: 'VERIFICATION_FAILED' }] };
  const withoutToken = { ...record };
  delete withoutToken.tokenHash;
  return { ...withoutToken, attempts, status: 'VERIFIED', deliveryEvidenceRef, replyEvidenceRef,
    events: [...record.events, { at, type: 'VERIFIED_BY_OPERATOR' }] };
}

export function reviewScope(record, { sharedDependencies, planEvidenceRef }, at) {
  requireAt(at);
  if (record.status !== 'VERIFIED' || typeof sharedDependencies !== 'boolean' || !planEvidenceRef) throw new Error('Verified request and scope evidence required');
  return { ...record, status: sharedDependencies ? 'BLOCKED_SHARED_DATA' : 'READY_FOR_ISOLATED_FULFILLMENT', planEvidenceRef,
    events: [...record.events, { at, type: sharedDependencies ? 'SHARED_DATA_STOP' : 'SCOPE_REVIEWED' }] };
}

// Deliberately no delete/close method: external category receipts, access denial,
// Auth/Storage and provider postchecks must exist before claiming completion.
