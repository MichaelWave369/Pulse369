import test from 'node:test';
import assert from 'node:assert/strict';
import { computeReachLayout, makeQuestReceipt } from './quest-math.mjs';

test('forward facing targets flank headset direction in standing mode', () => {
  const result = computeReachLayout({x:0,y:1.65,z:0},{x:0,z:-1});
  assert.deepEqual(result.left.map(n=>Number(n.toFixed(2))),[-.33,1.35,-.76]);
  assert.deepEqual(result.right.map(n=>Number(n.toFixed(2))),[.33,1.35,-.76]);
  assert.equal(result.labelYaw,0);
});
test('90 degree heading moves targets to the player-facing direction', () => {
  const result=computeReachLayout({x:2,y:1.7,z:3},{x:1,z:0});
  assert.ok(result.left[0]>2.7 && result.right[0]>2.7);
  assert.ok(result.left[2]<result.right[2]);
  assert.ok(Math.abs(result.labelYaw+Math.PI/2)<1e-10);
});
test('seated reduces reach span and target height',()=>{
  const head={x:0,y:1.18,z:0},f={x:0,z:-1};
  const a=computeReachLayout(head,f,'seated');
  const b=computeReachLayout(head,f,'standing');
  assert.ok(a.right[0]<b.right[0]);
  assert.ok(a.right[1]<b.right[1]);
});
test('extreme heights clamp to safe bounded authored levels',()=>{
  assert.equal(computeReachLayout({x:0,y:2.5,z:0},{x:0,z:-1}).left[1],1.76);
  assert.equal(computeReachLayout({x:0,y:.6,z:0},{x:0,z:-1},'seated').left[1],.69);
});
test('unusable tracking is rejected without moving the scene',()=>{
  assert.equal(computeReachLayout({x:0,y:0,z:0},{x:0,z:-1}),null);
  assert.equal(computeReachLayout({x:0,y:1.3,z:0},{x:0,z:0}),null);
  assert.throws(()=>computeReachLayout({x:NaN,y:1,z:0},{x:0,z:-1}),TypeError);
});
test('receipt excludes biometric, pose, device IDs and account identifiers',()=>{
  const r=makeQuestReceipt({posture:'seated',touches:[3,4],controllers:2,recenters:1,elapsedMs:4500,
    headHeight:1.22,deviceId:'a-secret',username:'someone',token:'private'});
  assert.equal(r.schema,'pulse369.quest-diagnostic.v1');
  assert.deepEqual(r.touchCounts,{left:3,right:4});
  assert.equal(r.durationSeconds,4);
  assert.equal(r.mode,'seated');
  assert.equal(r.maxControllers,2);
  for(const key of ['headHeight','deviceId','username','token'])assert.ok(!(key in r));
});
test('invalid counters cannot generate negative or impossible receipt counts',()=>{
  const r=makeQuestReceipt({posture:'unknown',touches:[-8,NaN],controllers:18,recenters:-2,elapsedMs:-100});
  assert.deepEqual(r.touchCounts,{left:0,right:0});
  assert.equal(r.maxControllers,2);
  assert.equal(r.recenterCount,0);
  assert.equal(r.durationSeconds,0);
});
