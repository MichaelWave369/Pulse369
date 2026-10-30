import test from 'node:test';import assert from 'node:assert/strict';
import {createAcceptanceRecorder,CHECKLIST} from './world-acceptance.mjs';
const checks=Object.fromEntries(CHECKLIST.map(k=>[k,false]));
test('R7 ignores all desktop callbacks and records only opted-in XR frame intervals',()=>{
 const r=createAcceptanceRecorder();
 assert.equal(r.capture({timeMs:1,xrPresenting:true,calls:3,triangles:300,activeStages:1,phraseIndex:0,reason:'single-stage'}),false);
 r.start();
 for(let i=0;i<240;i++){
  assert.equal(r.capture({timeMs:1000+i*1000/72,xrPresenting:false,calls:2,triangles:900,activeStages:1,phraseIndex:0,reason:'single-stage'}),false);
 }
 assert.equal(r.snapshot().callbackFrames,0);
 for(let i=0;i<1440;i++){
  r.capture({timeMs:i*1000/72,xrPresenting:true,calls:2,triangles:1000,activeStages:1,
   phraseIndex:i<720?0:1,reason:'single-stage'});
 }
 r.stop();
 const s=r.snapshot();
 assert.equal(s.recording,false);assert.equal(s.xrObserved,true);assert.equal(s.callbackFrames,1440);
 assert.ok(s.p95CallbackMs>=13&&s.p95CallbackMs<=14);assert.ok(s.estimatedCallbackHz>=71&&s.estimatedCallbackHz<=73);
 assert.equal(s.sceneChanges,1);assert.equal(s.peakTriangles,1000);assert.equal(s.enoughForReview,true);
 assert.equal(r.capture({timeMs:999999,xrPresenting:true,calls:3,triangles:3,activeStages:1,phraseIndex:1,reason:'single-stage'}),false);
});
test('R7 interruption handling, budget-cut event, restart and valid checklist',()=>{
 const r=createAcceptanceRecorder();r.start();
 const sample=(timeMs,reason='single-stage')=>r.capture({timeMs,xrPresenting:true,calls:5,triangles:1200,activeStages:1,phraseIndex:1,reason});
 assert.equal(sample(20),true);assert.equal(sample(40),true);assert.equal(sample(40),false);
 assert.equal(sample(1000),true);assert.equal(sample(1016,'crossfade-over-budget'),true);
 assert.equal(sample(1032,'crossfade-over-budget'),true);
 r.stop();
 const receipt=r.receipt(checks);
 assert.equal(receipt.measurements.longGaps,1);
 assert.equal(receipt.measurements.autoCuts,1);
 assert.equal(receipt.measurements.enoughForReview,false);
 assert.equal(receipt.verification,'USER_ATTESTED_ONLY_NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(JSON.stringify(receipt).includes('userAgent'),false);
 assert.throws(()=>r.receipt({...checks,extra:true}),/checklist/);
 assert.throws(()=>r.receipt({}),/checklist/);
 r.start();assert.equal(r.snapshot().callbackFrames,0);
});
test('R7 rejected/invalid samples cannot corrupt measured output',()=>{
 const r=createAcceptanceRecorder();r.start();
 assert.equal(r.capture({timeMs:NaN,xrPresenting:true,calls:1,triangles:0,activeStages:1,phraseIndex:0,reason:'single-stage'}),false);
 assert.equal(r.capture({timeMs:1,xrPresenting:true,calls:1,triangles:0,activeStages:4,phraseIndex:0,reason:'single-stage'}),false);
 assert.equal(r.snapshot().xrObserved,false);
});
