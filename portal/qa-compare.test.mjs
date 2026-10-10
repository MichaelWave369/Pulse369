import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePulseReceipt, assessPair, createInspectionReceipt, MAX_RECEIPT_CHARS } from './qa-compare.mjs';

const beat = (count=7,bpm=120)=>({
  kind:'visual-beat-touch-drill',bpm,offeredBeats:24,acceptedTouches:count,
  meanAbsoluteErrorMs:count?62.5:null,medianSignedErrorMs:count?-22:null,
  earlyTouches:count?3:0,lateTouches:count?4:0,onBeatTouches:0
});
const desktop = (bpm=120,offset=0)=>({
  schema:'pulse369.desktop-rehearsal.v1',runtime:'desktop-browser',input:'keyboard-or-screen-button',
  exit:'completed',durationSeconds:15,localMusic:{source:'local-file-not-uploaded',manualBpm:bpm,manualBeatOffsetMs:offset},
  rhythm:beat(7,bpm)
});
const questMusic = (bpm=120,offset=0)=>({
  schema:'pulse369.local-music-lab.v1',mode:'seated',vrSession:'ended',maxControllers:2,
  recenterCount:1,touchCounts:{left:3,right:4},durationSeconds:16,
  localMusic:{source:'local-file-not-uploaded',manualBpm:bpm,manualBeatOffsetMs:offset},rhythm:beat(7,bpm)
});
const questVisual = ()=>({
  schema:'pulse369.quest-diagnostic.v2',mode:'standing',vrSession:'ended',
  maxControllers:2,recenterCount:2,touchCounts:{left:3,right:4},durationSeconds:15,rhythm:beat()
});
const questTracking = ()=>({
  schema:'pulse369.quest-diagnostic.v1',mode:'seated',vrSession:'ended',
  maxControllers:1,recenterCount:0,touchCounts:{left:24,right:33},durationSeconds:26
});

test('accepts all four actual Pulse receipt schemas',()=>{
  for(const receipt of [desktop(),questMusic(),questVisual(),questTracking()]){
    const parsed=parsePulseReceipt(JSON.stringify(receipt));
    assert.equal(parsed.ok,true,JSON.stringify(parsed));
    assert.equal(parsed.value.schema,receipt.schema);
  }
});
test('treats entirely unknown or malformed JSON as untrusted',()=>{
  for(const s of ['', '{', '{}', '[]', 'false',
     JSON.stringify({...desktop(),schema:'pulse369.unrecognized'}),
     'x'.repeat(MAX_RECEIPT_CHARS+1)]){
    assert.equal(parsePulseReceipt(s).ok,false);
  }
});
test('rejects impossible timing and counts rather than presenting a score',()=>{
  let obj=desktop();
  obj.rhythm.acceptedTouches=25;
  assert.equal(parsePulseReceipt(JSON.stringify(obj)).ok,false);
  obj=desktop();obj.rhythm.meanAbsoluteErrorMs=10000;
  assert.equal(parsePulseReceipt(JSON.stringify(obj)).ok,false);
  obj=desktop();obj.rhythm.earlyTouches=1;
  assert.equal(parsePulseReceipt(JSON.stringify(obj)).ok,false);
  obj=desktop();obj.localMusic.manualBpm=99;
  assert.equal(parsePulseReceipt(JSON.stringify(obj)).ok,false);
});
test('empty sample must be marked null, not zero-error perfection',()=>{
  const obj=desktop();obj.rhythm=beat(0);
  assert.equal(parsePulseReceipt(JSON.stringify(obj)).ok,true);
  obj.rhythm.meanAbsoluteErrorMs=0;
  assert.equal(parsePulseReceipt(JSON.stringify(obj)).ok,false);
});
test('Quest controller counts must match accepted hits',()=>{
  const bad=questMusic();bad.touchCounts.right=5;
  assert.equal(parsePulseReceipt(JSON.stringify(bad)).ok,false);
});
test('privacy allowlist drops injected filename, user ID, location, pose and arbitrary text',()=>{
  const o=desktop();
  o.filename='secrettrack.mp3';o.userId='private-123';
  o.pose=[1,2,3];o.note='html <script>not displayed</script>';o.localMusic.title='private-name';
  const p=parsePulseReceipt(JSON.stringify(o));
  assert.equal(p.ok,true);
  const exported=JSON.stringify(createInspectionReceipt(p.value,null));
  for(const secret of ['secrettrack.mp3','private-123','private-name','<script>','pose']){
    assert.equal(exported.includes(secret),false);
  }
});
test('matched tempo/offset never means comparable keyboard and Quest latency',()=>{
  const a=parsePulseReceipt(JSON.stringify(desktop())).value;
  const b=parsePulseReceipt(JSON.stringify(questMusic())).value;
  const compared=assessPair(a,b);
  assert.equal(compared.level,'MATCHED_SETTINGS_NOT_COMPARABLE');
  assert.match(compared.message,/not measure relative latency/);
});
test('different protocol and chart settings remain distinct',()=>{
  const d=parsePulseReceipt(JSON.stringify(desktop())).value;
  const q=parsePulseReceipt(JSON.stringify(questVisual())).value;
  const m=parsePulseReceipt(JSON.stringify(questMusic(90,250))).value;
  const track=parsePulseReceipt(JSON.stringify(questTracking())).value;
  assert.equal(assessPair(d,q).level,'DIFFERENT_PROTOCOLS');
  assert.equal(assessPair(d,m).level,'DIFFERENT_SETTINGS');
  assert.equal(assessPair(d,track).level,'DIFFERENT_PROTOCOLS');
});
test('inspected reports are explicitly unattested and never name a performance winner',()=>{
  const a=parsePulseReceipt(JSON.stringify(desktop())).value;
  const b=parsePulseReceipt(JSON.stringify(questMusic())).value;
  const report=createInspectionReceipt(a,b);
  assert.equal(report.verification,'STRUCTURE_ONLY_NO_HARDWARE_ATTESTATION');
  assert.equal(report.slotA.source,'USER_PASTED_UNVERIFIED');
  assert.ok(!JSON.stringify(report).includes('winner:desktop'));
});
