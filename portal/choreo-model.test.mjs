import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHART_SCHEMA,MAX_COUNTS,starterChart,normalizeChart,encodeChart,parseChart,totalCounts,
  cueForCount,loopingCue,replaceStep,replacePhrase,addPhrase,duplicatePhrase,
  deletePhrase,movePhrase,trackLengthError,chartPreviewReceipt,phraseFromStyle
} from './choreo-model.mjs';

test('starter chart is portable and expands to a precise count timeline',()=>{
  const first=starterChart();
  assert.equal(first.schema,CHART_SCHEMA);
  assert.equal(totalCounts(first),32);
  assert.deepEqual(parseChart(encodeChart(first)),normalizeChart(first));
  assert.equal(cueForCount(first,0).phraseName,'OPENING GROOVE');
  assert.equal(cueForCount(first,8).phraseName,'FUNK BREAK');
  assert.equal(cueForCount(first,32),null);
  assert.equal(loopingCue(first,32).phraseIndex,0);
});
test('mirror swaps handedness and x position, but not y/z, without mutating source',()=>{
  const c=starterChart();
  const before=cueForCount(c,0),mirrored=cueForCount(replaceStep(c,0,0,{style:'groove',moveIndex:0,mirror:true}),0);
  assert.equal(before.hands[0].side,'left');
  assert.equal(mirrored.hands[0].side,'right');
  assert.equal(mirrored.hands[0].x,-before.hands[0].x);
  assert.equal(mirrored.hands[0].y,before.hands[0].y);
  assert.equal(c.phrases[0].steps[0].mirror,false);
});
test('valid editing operations preserve all eight counts and allow undo through immutable snapshots',()=>{
  const c=starterChart();
  const added=addPhrase(c,'funk',2);
  assert.equal(added.phrases.length,5);
  assert.equal(c.phrases.length,4);
  const duplicated=duplicatePhrase(c,0);
  assert.equal(duplicated.phrases.length,5);
  assert.equal(duplicated.phrases[1].steps.length,8);
  const renamed=replacePhrase(c,0,{name:'VERSE A',repeat:3});
  assert.equal(totalCounts(renamed),48);
  assert.equal(c.phrases[0].repeat,1);
  const moved=movePhrase(c,0,1);
  assert.equal(moved.phrases[1].name,'OPENING GROOVE');
  const removed=deletePhrase(c,3);
  assert.equal(removed.phrases.length,3);
  assert.equal(phraseFromStyle('disco').steps.length,8);
});
test('import rejects oversized, invalid or unsafe charts; unknown fields are discarded',()=>{
  const c=starterChart();
  const dirty=structuredClone(c);
  dirty.password='SHOULD NOT EXPORT';
  dirty.phrases[0].steps[0].secretAudio='NO';
  assert.ok(!encodeChart(dirty).includes('SHOULD NOT EXPORT'));
  assert.ok(!encodeChart(dirty).includes('secretAudio'));
  assert.throws(()=>parseChart('not JSON'),/Invalid JSON/);
  assert.throws(()=>parseChart(' '.repeat(66000)),/under 64 KiB/);
  assert.throws(()=>normalizeChart({...c,phrases:[]}),/1–16/);
  assert.throws(()=>normalizeChart({...c,bpm:0}),/60 to 180/);
  const wrong=structuredClone(c);wrong.phrases[0].steps[0].moveIndex=8;
  assert.throws(()=>normalizeChart(wrong),/Move index/);
  const huge=structuredClone(c);
  huge.phrases=Array.from({length:16},()=>({...phraseFromStyle('funk'),repeat:4}));
  assert.equal(totalCounts(normalizeChart(huge)),MAX_COUNTS);
  assert.throws(()=>addPhrase(huge,'groove'),/maximum/);
  assert.throws(()=>deletePhrase({...c,phrases:[c.phrases[0]]},0),/at least one/);
});
test('audio preflight and receipt are conservative, anonymous and consistent',()=>{
  const c=starterChart();
  assert.equal(trackLengthError(c,30),null);
  assert.match(trackLengthError(c,1),/too short/);
  const r=chartPreviewReceipt({...c,file:'private.mp3',pose:123},'local',12);
  assert.equal(r.displayedCounts,12);
  assert.equal(r.provenance,'SCREEN_DEMONSTRATION_UNVERIFIED');
  assert.equal(r.musicMode,'local-file-not-uploaded');
  for(const forbidden of ['name','file','pose','title','timestamp','calories','heartRate','rawAudio'])assert.ok(!Object.hasOwn(r,forbidden));
});
