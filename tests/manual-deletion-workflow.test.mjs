import test from 'node:test';
import assert from 'node:assert/strict';
import { receiveRequest, prepareChallenge, verifyReply, reviewScope } from '../scripts/privacy/manual-deletion-workflow.mjs';

const start = () => prepareChallenge(receiveRequest('synthetic-account-1', 'account-and-personal-data', [], 1000).record, 1000);
test('request retries reuse the open register entry', () => {
  const first = receiveRequest('synthetic-account-1', 'account-and-personal-data', [], 1000);
  const retry = receiveRequest('synthetic-account-1', 'account-and-personal-data', [first.record], 2000);
  assert.equal(retry.duplicate, true); assert.equal(retry.record.id, first.record.id);
});
test('verification needs external delivery and reply evidence; token alone is insufficient', () => {
  const { record, token } = start();
  assert.ok(!JSON.stringify(record).includes(token));
  assert.throws(() => verifyReply(record, token, '', '', 2000));
  const verified = verifyReply(record, token, 'synthetic-delivery-receipt', 'synthetic-reply-receipt', 2000);
  assert.equal(verified.status, 'VERIFIED'); assert.equal(verified.tokenHash, undefined);
  assert.throws(() => verifyReply(verified, token, 'delivery', 'reply', 3000));
});
test('expired, cross-request and repeatedly invalid tokens fail closed', () => {
  const one = start(); const two = start();
  assert.throws(() => verifyReply(one.record, one.token, 'delivery', 'reply', one.record.expiresAt));
  assert.equal(verifyReply(two.record, one.token, 'delivery', 'reply', 2000).status, 'VERIFICATION_PENDING');
  let current = one.record;
  for (let i = 0; i < 5; i++) current = verifyReply(current, 'wrong', 'delivery', 'reply', 2000 + i);
  assert.equal(current.status, 'OWNER_REVIEW');
  assert.throws(() => verifyReply(current, one.token, 'delivery', 'reply', 3000));
});
test('shared history blocks fulfillment; clean scope is not a deletion claim', () => {
  const { record, token } = start();
  assert.throws(() => reviewScope(record, { sharedDependencies: false, planEvidenceRef: 'plan' }, 2000));
  const verified = verifyReply(record, token, 'delivery', 'reply', 2000);
  assert.equal(reviewScope(verified, { sharedDependencies: true, planEvidenceRef: 'plan' }, 3000).status, 'BLOCKED_SHARED_DATA');
  assert.equal(reviewScope(verified, { sharedDependencies: false, planEvidenceRef: 'plan' }, 3000).status, 'READY_FOR_ISOLATED_FULFILLMENT');
});
