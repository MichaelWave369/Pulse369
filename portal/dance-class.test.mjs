import test from 'node:test';
import assert from 'node:assert/strict';
import { CLASS_MINUTES, createDanceClass, classCue, classPosition, validateClassTrack, classReceipt, classHitAt } from './dance-class.mjs';

test('class timings partition into distinct phases with precise boundaries',()=>{
  for(const bpm of [96,112,128]){
    for(const minutes of CLASS_MINUTES){
      const plan=createDanceClass(bpm,minutes);
      assert.equal(plan.blocks.length,5);
      assert.equal(plan.blocks[0].start,0);
      assert.equal(plan.blocks.at(-1).end,plan.totalBeats);
      assert.ok(Math.abs(plan.durationSeconds - minutes*60) <= 240/bpm);
      assert.ok(plan.blocks.every((b,i)=>b.beats>0 && b.beats%8===0 && (i===0||b.start===plan.blocks[i-1].end)));
      for(let i=0;i<plan.totalBeats;i++){
        const cue=classCue(plan,'funk',i);
        assert.ok(cue);
        assert.equal(cue.beat,(i-cue.index+cue.index-plan.blocks.find(b=>b.id===cue.phase).start)%8+1);
        assert.equal(cue.scoreEligible,['rehearse','perform'].includes(cue.phase));
        assert.ok(cue.hands.length>=1);
      }
      assert.equal(classCue(plan,'funk',plan.totalBeats),null);
    }
  }
  assert.equal(createDanceClass(200,3),null);
  assert.equal(createDanceClass(112,7),null);
});

test('manual tempo clock does not score before start or after end',()=>{
  assert.equal(classPosition(1,3,112,128),-1);
  assert.equal(classPosition(3,3,112,128),0);
  assert.equal(classPosition(3+60/112,3,112,128),1);
  assert.equal(classPosition(900,3,112,128),128);
  assert.equal(classPosition(NaN,3,112,128),-1);
});

test('local music track needs the entire class and valid offset',()=>{
  const plan=createDanceClass(112,5);
  assert.equal(validateClassTrack(plan.durationSeconds+2,plan,250),null);
  assert.match(validateClassTrack(plan.durationSeconds-3,plan,0),/longer/);
  assert.match(validateClassTrack(999,plan,-1),/offset/);
});

test('receipt includes allowlisted aggregate only',()=>{
  const plan=createDanceClass(112,3);
  const receipt=classReceipt({style:'groove',plan,posture:'seated',completedBeats:9,eligibleBeats:8,matchedCues:30,musicMode:'local',rawPose:123,filename:'private.wav',name:'Jane'});
  assert.equal(receipt.matchedControllerCues,8);
  assert.equal(receipt.scorableControllerCues,8);
  assert.equal(receipt.provenance,'LOCAL_UNVERIFIED');
  assert.equal(receipt.musicMode,'local-file-not-uploaded');
  for(const key of ['name','rawPose','filename','calories','heartRate','audio','timestamp'])assert.ok(!(key in receipt));
});

test('real half-phrase breakdown occurs before full eight-count',()=>{
  const p=createDanceClass(112,3);
  const learn=p.blocks.find(x=>x.id==='learn');
  const first=Array.from({length:8},(_,i)=>classCue(p,'groove',learn.start+i).name);
  const second=Array.from({length:8},(_,i)=>classCue(p,'groove',learn.start+8+i).name);
  assert.deepEqual(first.slice(0,4),first.slice(4));
  assert.deepEqual(second.slice(0,4),second.slice(4));
  assert.match(classCue(p,'groove',learn.start).coach,/FIRST FOUR/);
  assert.match(classCue(p,'groove',learn.start+8).coach,/SECOND FOUR/);
  assert.match(classCue(p,'groove',learn.start+16).coach,/PUT IT TOGETHER/);
});

test('music-clock cue checks are bounded and reject off-beat hits',()=>{
  assert.equal(classHitAt(1.5,2,112,600),null);
  assert.deepEqual(classHitAt(2,2,112,600),{index:0,errorMs:0});
  assert.equal(classHitAt(2.26,2,112,600),null);
  assert.equal(classHitAt(2+600*60/112,2,112,600),null);
  assert.equal(classHitAt(NaN,2,112,600),null);
});
