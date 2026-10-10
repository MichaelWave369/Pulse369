import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANUAL_CHECKS,MANUAL_STATES,normalizeManualResults,manualGate,createManualAcceptanceReceipt
} from './quest-first-run.mjs';

test('all checks have unique, stable IDs and safe route references',()=>{
  const ids=MANUAL_CHECKS.map(x=>x.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(MANUAL_CHECKS.filter(x=>x.critical).length>=4);
  for(const x of MANUAL_CHECKS){
    assert.match(x.id,/^[a-z_]+$/);
    assert.match(x.link,/^(quest|music|compare)\.html$/);
  }
});
test('unknown fields and invalid states never enter the receipt',()=>{
  const values=normalizeManualResults({
    xr_enter:'pass',controllers:'totally_green',filename:'secret.mp3',deviceId:'private'
  });
  assert.equal(values.xr_enter,'pass');
  assert.equal(values.controllers,'not_run');
  assert.equal(Object.hasOwn(values,'filename'),false);
  assert.equal(Object.hasOwn(values,'deviceId'),false);
  for(const status of Object.values(values))assert.ok(MANUAL_STATES.includes(status));
});
test('empty run is never classified as a pass',()=>{
  const x=manualGate({},'quest3');
  assert.equal(x.gate,'CORE_HARDWARE_INCOMPLETE');
  assert.equal(x.coreComplete,false);
  assert.equal(x.counts.pass,0);
});
test('desktop only cannot claim verified Quest hardware even if all marked pass',()=>{
  const all=Object.fromEntries(MANUAL_CHECKS.map(x=>[x.id,'pass']));
  const x=manualGate(all,'desktop_only');
  assert.equal(x.gate,'HEADSET_NOT_ATTESTED');
  const receipt=createManualAcceptanceReceipt({device:'desktop_only',results:all});
  assert.equal(receipt.hardwareVerified,false);
  assert.equal(receipt.evidenceOrigin,'MANUAL_SELF_REPORTED_UNVERIFIED');
});
test('a failed optional or critical step blocks review candidacy',()=>{
  const all=Object.fromEntries(MANUAL_CHECKS.map(x=>[x.id,'pass']));
  all.preview='fail';
  assert.equal(manualGate(all,'quest3').gate,'FAILURE_REPORTED');
  all.preview='pass';
  all.controllers='fail';
  assert.equal(manualGate(all,'quest3').gate,'FAILURE_REPORTED');
});
test('core pass plus missing tests is accurately incomplete',()=>{
  const core=Object.fromEntries(MANUAL_CHECKS.filter(x=>x.critical).map(x=>[x.id,'pass']));
  const gate=manualGate(core,'quest3');
  assert.equal(gate.gate,'CORE_PASS_REPORTED_MORE_TO_TEST');
  assert.equal(gate.coreComplete,true);
});
test('blocked statuses remain distinct from not run and pass',()=>{
  const all=Object.fromEntries(MANUAL_CHECKS.map(x=>[x.id,'pass']));
  all.seated='blocked';
  assert.equal(manualGate(all,'quest3').gate,'BLOCKED_OBSERVATIONS');
  all.xr_enter='blocked';
  assert.equal(manualGate(all,'quest3').gate,'CORE_HARDWARE_INCOMPLETE');
});
test('all pass is only a MANUAL review candidate, never verified',()=>{
  const all=Object.fromEntries(MANUAL_CHECKS.map(x=>[x.id,'pass']));
  const receipt=createManualAcceptanceReceipt({device:'quest3',results:all});
  assert.equal(receipt.releaseGate,'MANUAL_REVIEW_CANDIDATE');
  assert.equal(receipt.hardwareVerified,false);
  assert.ok(!JSON.stringify(receipt).includes('independently verified'));
});
test('receipt output strips arbitrary text, filenames and raw tracking IDs',()=>{
  const all=Object.fromEntries(MANUAL_CHECKS.map(x=>[x.id,'pass']));
  const report=createManualAcceptanceReceipt({
    device:'quest3',
    results:{...all,privateEmail:'person@example.com',location:'secret place',poses:[1,2,3]},
    name:'private',audio:'song bytes',serial:'headset-id'
  });
  for(const bad of ['person@example.com','secret place','song bytes','headset-id']){
    assert.equal(JSON.stringify(report).includes(bad),false);
  }
  assert.equal(report.checks.length,MANUAL_CHECKS.length);
});
