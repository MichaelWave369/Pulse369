import test from 'node:test';
import assert from 'node:assert/strict';
import {transitionAmount,authoredPose,blendCoachPoses,sampleCoachPose,projectCoachPose} from './motion-coach.mjs';
import {starterChart,cueForCount,replaceStep} from './choreo-model.mjs';
import {createDanceClass,classCue} from './dance-class.mjs';

const chart=starterChart();
const at=i=>cueForCount(chart,i);

test('timed easing is finite, clamped, monotonic and reaches next cue exactly at beat',()=>{
  assert.equal(transitionAmount(-100),0);
  assert.equal(transitionAmount(0),0);
  assert.equal(transitionAmount(.18),0);
  assert.equal(transitionAmount(1),1);
  assert.equal(transitionAmount(100),1);
  let previous=0;
  for(let i=0;i<=100;i++){
    const value=transitionAmount(i/100);
    assert.ok(value>=previous-1e-12 && value<=1);
    previous=value;
  }
});
test('smooth instructor motion is deterministic and continuous at count boundaries',()=>{
  const a=sampleCoachPose(at,.9999999);
  const b=sampleCoachPose(at,1);
  for(const side of ['left','right']){
    assert.ok(Math.abs(a.wrist[side].x-b.wrist[side].x)<.001);
    assert.ok(Math.abs(a.wrist[side].y-b.wrist[side].y)<.001);
  }
  assert.deepEqual(sampleCoachPose(at,2.42),sampleCoachPose(at,2.42));
  assert.deepEqual(sampleCoachPose(at,0),authoredPose(at(0),0));
  assert.ok(sampleCoachPose(at,32)===null);
});
test('mirrored choreography changes the instructor target hand correctly',()=>{
  const swapped=replaceStep(chart,0,0,{style:'groove',moveIndex:0,mirror:true});
  const original=sampleCoachPose(at,0,{reducedMotion:true});
  const mirrored=sampleCoachPose(i=>cueForCount(swapped,i),0,{reducedMotion:true});
  assert.notEqual(original.wrist.left.x,mirrored.wrist.left.x);
  assert.ok(mirrored.wrist.right.x>original.wrist.right.x);
});
test('calm reduced-motion mode disables interpolation and sway but still teaches cues',()=>{
  const calmA=sampleCoachPose(at,1.2,{reducedMotion:true});
  const calmB=sampleCoachPose(at,1.8,{reducedMotion:true});
  assert.deepEqual(calmA,calmB);
  assert.ok(sampleCoachPose(at,1.7).wrist.right.x!==calmA.wrist.right.x);
});
test('missing/invalid hand inputs and last class count do not crash or invent sensor output',()=>{
  const fallback=authoredPose({hands:[{side:'left',x:Infinity,y:-999,z:NaN}]},0);
  const projected=projectCoachPose(fallback);
  for(const key of ['head','neck','hips'])assert.ok(Number.isFinite(projected[key].x) && Number.isFinite(projected[key].y));
  assert.equal(blendCoachPoses(null,null,.5),null);
  const plan=createDanceClass(112,3);
  const pose=sampleCoachPose(i=>classCue(plan,'funk',i),plan.totalBeats-.001);
  assert.ok(pose);
  assert.equal(sampleCoachPose(i=>classCue(plan,'funk',i),plan.totalBeats),null);
});
