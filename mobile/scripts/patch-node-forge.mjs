import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const file = resolve('node_modules/node-forge/lib/rsa.js');
const source = readFileSync(file, 'utf8');
const before = 'if(!asn1.validate(obj, digestInfoValidator, capture, errors) ||\n            obj.value.length !== 2) {';
const after = 'if(!asn1.validate(obj, digestInfoValidator, capture, errors) ||\n            obj.value.length !== 2 ||\n            !Array.isArray(obj.value[0].value) ||\n            obj.value[0].value.length < 1 ||\n            obj.value[0].value.length > 2) {';
if(source.includes(after)) {
  console.log('node-forge security patch already installed; no changes needed');
  process.exit(0);
}
if(!source.includes(before)) throw new Error('node-forge source does not match reviewed security patch; refusing install');
writeFileSync(file, source.replace(before, after));
console.log('Patched node-forge nested DigestAlgorithm count (GHSA-86w9-cpqp-85rv)');
