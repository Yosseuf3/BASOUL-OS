import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

const require = createRequire(import.meta.url);
const forge = require('node-forge');
const certificates = require('@expo/code-signing-certificates');
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKey = forge.pki.privateKeyFromPem(keys.privateKey.export({ type: 'pkcs8', format: 'pem' }));
const publicKey = forge.pki.publicKeyFromPem(keys.publicKey.export({ type: 'spki', format: 'pem' }));
const digest = () => forge.md.sha256.create().update('BASOUL synthetic security regression');

test('official forge is semver-compatible with both Expo parents; no local crypto patch', () => {
  assert.equal(require('node-forge/package.json').version, '1.4.2');
  assert.equal(lock.packages['node_modules/node-forge'].version, '1.4.2');
  assert.equal(lock.packages['node_modules/expo/node_modules/@expo/cli'].dependencies['node-forge'], '^1.3.3');
  assert.equal(lock.packages['node_modules/@expo/code-signing-certificates'].dependencies['node-forge'], '^1.3.3');
  assert.equal(manifest.scripts.postinstall, undefined);
  assert.equal(manifest.overrides['node-forge'], undefined);
  assert.equal(lock.packages['node_modules/zod'].version, '4.6.6');
});

test('valid RSA signature verifies and altered message is rejected', () => {
  const signature = privateKey.sign(digest());
  assert.equal(publicKey.verify(digest().digest().getBytes(), signature), true);
  assert.equal(publicKey.verify(forge.md.sha256.create().update('altered').digest().getBytes(), signature), false);
});

// Synthetic test-only e=1 key isolates the real PKCS#1 parser, following
// upstream's canonical-DigestInfo regression approach. Not a signing key.
const parserKey = forge.pki.rsa.setPublicKey(new forge.jsbn.BigInteger('f'.repeat(256), 16), new forge.jsbn.BigInteger('1'));
const hash = '7509e5bda0c762d2bac7f90d758b5b2263fa01ccbc542ab5e3df163be08e6ca9';
const oid = '0609608648016503040201';
const encodedDigest = '0420' + hash;
function verifyEncoding(hex) {
  const padding = 'ff'.repeat(128 - 3 - hex.length / 2);
  return parserKey.verify(forge.util.hexToBytes(hash), forge.util.hexToBytes('0001' + padding + '00' + hex));
}
test('canonical DigestInfo works with and without NULL parameters', () => {
  assert.equal(verifyEncoding('3031300d' + oid + '0500' + encodedDigest), true);
  assert.equal(verifyEncoding('302f300b' + oid + encodedDigest), true);
});
for (const [name, hex] of Object.entries({
  'extra nested DigestAlgorithm element': '3033300f' + oid + '05000400' + encodedDigest,
  'NULL parameters containing bytes': '3033300f' + oid + '0502beef' + encodedDigest,
  'non-minimal DigestInfo length': '308131300d' + oid + '0500' + encodedDigest,
  'non-minimal nested algorithm length': '303230810d' + oid + '0500' + encodedDigest,
  'non-canonical OID': '3032300e060a608648018065030402010500' + encodedDigest,
  'indefinite DigestInfo length': '3080300d' + oid + '0500' + encodedDigest + '0000',
})) {
  test(`rejects ${name}`, () => assert.throws(() => verifyEncoding(hex)));
}

test('certificate chain accepts trusted issuer and rejects invalid signature', () => {
  const makeCertificate = (serial, subject, issuer, ca) => {
    const certificate = forge.pki.createCertificate();
    certificate.publicKey = publicKey;
    certificate.serialNumber = serial;
    certificate.validity.notBefore = new Date(Date.now() - 60000);
    certificate.validity.notAfter = new Date(Date.now() + 3600000);
    certificate.setSubject([{ name: 'commonName', value: subject }]);
    certificate.setIssuer([{ name: 'commonName', value: issuer }]);
    certificate.setExtensions([{ name: 'basicConstraints', cA: ca }, { name: 'keyUsage', keyCertSign: ca, digitalSignature: true }]);
    certificate.sign(privateKey, forge.md.sha256.create());
    return forge.pki.certificateFromPem(forge.pki.certificateToPem(certificate));
  };
  const root = makeCertificate('01', 'BASOUL synthetic root', 'BASOUL synthetic root', true);
  const leaf = makeCertificate('02', 'BASOUL synthetic leaf', 'BASOUL synthetic root', false);
  assert.equal(forge.pki.verifyCertificateChain(forge.pki.createCaStore([root]), [leaf]), true);
  const untrusted = makeCertificate('03', 'untrusted synthetic root', 'untrusted synthetic root', true);
  assert.throws(() => forge.pki.verifyCertificateChain(forge.pki.createCaStore([untrusted]), [leaf]));
  leaf.signature = '\x00'.repeat(leaf.signature.length);
  assert.throws(() => forge.pki.verifyCertificateChain(forge.pki.createCaStore([root]), [leaf]));
});

test('Expo certificate tooling loads and PEM Buffer handling works', () => {
  assert.ok(Object.keys(certificates).length > 0);
  const pem = forge.pki.publicKeyToPem(publicKey);
  assert.equal(forge.pem.decode(Buffer.from(pem))[0].type, 'PUBLIC KEY');
  assert.equal(forge.pki.publicKeyFromPem(pem).n.toString(16), publicKey.n.toString(16));
});

test('Expo synthetic signing credentials round-trip and reject mismatched private key', () => {
  const keyPair = { publicKey, privateKey };
  const generated = certificates.generateSelfSignedCodeSigningCertificate({
    keyPair, commonName: 'BASOUL disposable tooling regression',
    validityNotBefore: new Date(Date.now() - 60000),
    validityNotAfter: new Date(Date.now() + 3600000),
  });
  const certificate = forge.pki.certificateFromPem(forge.pki.certificateToPem(generated));
  assert.doesNotThrow(() => certificates.validateSelfSignedCertificate(certificate, keyPair));
  const message = Buffer.from('BASOUL disposable credential integrity');
  const signature = certificates.signBufferRSASHA256AndVerify(privateKey, certificate, message);
  assert.equal(publicKey.verify(forge.md.sha256.create().update(message.toString('binary')).digest().getBytes(), forge.util.decode64(signature)), true);
  const wrong = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const wrongPrivate = forge.pki.privateKeyFromPem(wrong.privateKey.export({ type: 'pkcs8', format: 'pem' }));
  assert.throws(() => certificates.signBufferRSASHA256AndVerify(wrongPrivate, certificate, message));
  assert.throws(() => certificates.validateSelfSignedCertificate(certificate, { publicKey, privateKey: wrongPrivate }));
});
