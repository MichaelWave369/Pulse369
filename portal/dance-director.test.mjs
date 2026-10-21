import test from 'node:test';
import assert from 'node:assert/strict';
import {cueStyle,directPose,sampleDirectedPose,directionAt,STAGE_STYLES} from './dance-director.mjs';
import {starterChart,cueForCount} from './choreo-model.mjs';
import {createDanceClass,classCue} from './dance-class.mjs';
import {authoredPose} from './motion-coach.mjs';

const chart=starterChart();
const chartAt=i=>cueForCount(chart,i);
const close=(a,b,eps=.0001)=>Math.abs(a-b)<eps;

test('different styles have distinct silhouettes at the SAME authored wrist count',()=>{
  const c=chartAt(0),base=authoredPose(c,0);
  const shapes=['groove','funk','disco'].map(style=>directPose(base,style,0));
  assert.equal(shapes.length,3);
  assert.notEqual(shapes[0].hips.y,shapes[1].hips.y);
  assert.notEqual(shapes[1].shoulder.right.x,shapes[2].shoulder.right.x);
  assert.equal(base.hips.y,authoredPose(c,0).hips.y);
  for(const shape of shapes){
    for(const side of ['left','right']){
      assert.deepEqual(shape.foot[side],base.foot[side]);
      assert.ok(Number.isFinite(shape.elbow[side].x));
    }
  }
});
test('style and gesture transitions remain continuous across an eight-count phrase boundary',()=>{
  const a=sampleDirectedPose(chartAt,7.999999);
  const b=sampleDirectedPose(chartAt,8);
  for(const k of ['head','hips']){
    assert.ok(close(a[k].x,b[k].x,.001));
    assert.ok(close(a[k].y,b[k].y,.001));
  }
  for(const side of ['left','right']){
    assert.ok(close(a.wrist[side].x,b.wrist[side].x,.001));
    assert.ok(close(a.wrist[side].y,b.wrist[side].y,.001));
    assert.deepEqual(a.foot[side],b.foot[side]);
  }
});
test('expressiveness options change animation but never move feet',()=>{
  const showtime=sampleDirectedPose(chartAt,1.6,{expression:'showtime'});
  const subtle=sampleDirectedPose(chartAt,1.6,{expression:'subtle'});
  assert.notEqual(showtime.spine.y,subtle.spine.y);
  assert.deepEqual(showtime.foot,subtle.foot);
  const calmA=sampleDirectedPose(chartAt,1.15,{reducedMotion:true});
  const calmB=sampleDirectedPose(chartAt,1.85,{reducedMotion:true});
  assert.deepEqual(calmA,calmB);
  assert.equal(sampleDirectedPose(chartAt,32),null);
  assert.equal(cueStyle({style:'untrusted'}),'gentle');
  assert.deepEqual(directPose(null,'funk'),null);
});
test('direction announces next phrase in final two counts without leaking chart title',()=>{
  const six=directionAt(chartAt,6);
  const seven=directionAt(chartAt,7);
  const eight=directionAt(chartAt,8);
  assert.equal(six.upcoming.inCounts,2);
  assert.equal(seven.upcoming.inCounts,1);
  assert.equal(six.upcoming.label,'FUNK BREAK');
  assert.equal(eight.style,'funk');
  assert.equal(eight.upcoming,null);
  assert.ok(!Object.hasOwn(seven,'song'));
  assert.equal(directionAt(chartAt,32),null);
});
test('class warmup/cooldown use gentle profile and custom R2 phrases retain authored style',()=>{
  const plan=createDanceClass(112,3);
  const warm=classCue(plan,'funk',0);
  const learn=classCue(plan,'funk',plan.blocks[1].start,chart);
  assert.equal(cueStyle(warm),'gentle');
  assert.equal(cueStyle(learn),'groove');
  assert.equal(STAGE_STYLES[directionAt(i=>classCue(plan,'funk',i,chart),plan.blocks[2].start).style].name,'HOUSE GROOVE');
});
