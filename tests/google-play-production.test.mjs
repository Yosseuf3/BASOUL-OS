import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Google Play production produces a reproducible signed bundle without changing identity',()=>{
 const app=JSON.parse(readFileSync(new URL('../mobile/app.json',import.meta.url))).expo;
 const eas=JSON.parse(readFileSync(new URL('../mobile/eas.json',import.meta.url)));
 assert.equal(app.android.package,'com.yosseufradwan.os');
 assert.equal(app.extra.eas.projectId,'6f770730-8c8e-49b0-81b9-f9773faf567a');
 assert.equal(app.version,'4.0.0');
 assert.equal(app.android.versionCode,34);
 assert.equal(eas.cli.appVersionSource,'local');
 assert.equal(eas.build.production.environment,'production');
 assert.equal(eas.build.production.android.buildType,'app-bundle');
 assert.equal(eas.build.production.android.autoIncrement,false);
 assert.notEqual(eas.build.production.developmentClient,true);
 assert.notEqual(eas.build.production.distribution,'internal');
 assert.equal(eas.build.preview.android.buildType,'apk');
});
