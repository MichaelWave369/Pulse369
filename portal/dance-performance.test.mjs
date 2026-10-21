import test from 'node:test';
import assert from 'node:assert/strict';
import {starterShow,normalizeShow,parseShow,encodeShow,replaceSource,changeScene,buildShow,showCue,showSceneAt,sampleShow,performanceTrackError,showReceipt,STAGES} from './dance-performance.mjs';
import {starterWorkout,buildWorkout} from './dance-workout.mjs';
import {starterChart,totalCounts} from './choreo-model.mjs';
const tiny=(a,b)=>Math.abs(a-b)<.002;
test('R6 workout scenes preserve beat and recovery boundaries',()=>{
  const raw=starterShow(),plan=buildShow(raw),base=buildWorkout(starterWorkout());
  assert.equal(plan.totalCounts,base.totalCounts);
  assert.equal(plan.segments.length,base.segments.length);
  assert.equal(plan.segments.at(-1).end,plan.totalCounts);
  assert.equal(plan.segments[0].kind,'warmup');
  assert.equal(plan.segments.at(-1).kind,'cooldown');
  for(let i=0;i<plan.totalCounts;i++){
    const cue=showCue(plan,i);
    const scene=showSceneAt(plan,i);
    assert.ok(cue&&scene);
    assert.equal(cue.stage,scene.theme);
    assert.equal(cue.globalCount,i+1);
    assert.ok(Array.isArray(cue.hands));
    if(scene.kind==='recovery')assert.equal(cue.style,'gentle');
  }
  assert.equal(showCue(plan,-1),null);
  assert.equal(showSceneAt(plan,plan.totalCounts),null);
  assert.equal(performanceTrackError(plan,plan.durationSeconds+2),null);
  assert.match(performanceTrackError(plan,2),/too short/);
});
test('R2 custom choreography runs every phrase, repeat and mirrored cue',()=>{
  const source=starterChart();
  source.phrases[1].repeat=3;
  source.phrases[0].steps[0].mirror=true;
  const raw=replaceSource(starterShow(),'chart',source);
  const plan=buildShow(raw);
  assert.equal(plan.totalCounts,totalCounts(source));
  assert.equal(plan.segments[1].end-plan.segments[1].start,24);
  assert.equal(showCue(plan,0).mirror,true);
  assert.equal(showCue(plan,8).sectionIndex,1);
  assert.equal(showCue(plan,31).sectionIndex,1);
  assert.equal(showCue(plan,32).sectionIndex,2);
  assert.ok(showCue(plan,plan.totalCounts-1));
  assert.equal(showCue(plan,plan.totalCounts),null);
});
test('scene changes preserve original timeline and stay isolated to chosen segment',()=>{
  let show=starterShow(),original=buildShow(show);
  show=changeScene(show,2,'ember');
  const modified=buildShow(show);
  assert.equal(modified.segments[2].stage,'ember');
  assert.equal(modified.segments[1].stage,original.segments[1].stage);
  assert.deepEqual(modified.segments.map(s=>[s.start,s.end]),original.segments.map(s=>[s.start,s.end]));
  assert.equal(showSceneAt(modified,modified.segments[1].end-1).next.inCounts,1);
  assert.equal(showSceneAt(modified,modified.segments[1].end-8).next.inCounts,8);
  show=changeScene(show,2,'neon');
  assert.equal(show.overrides.length,0);
  assert.equal(STAGES.ember.name,'AMBER GROOVE');
  assert.throws(()=>changeScene(show,-1,'neon'),/Invalid/);
  assert.throws(()=>changeScene(show,1,'camera-feed'),/Invalid/);
});
test('animation remains deterministic and visually continuous at scene change',()=>{
  const p=buildShow(changeScene(starterShow(),1,'aurora'));
  const boundary=p.segments[0].end;
  const left=sampleShow(p,boundary-1e-6);
  const right=sampleShow(p,boundary);
  for(const side of ['left','right']){
    assert.ok(tiny(left.pose.wrist[side].x,right.pose.wrist[side].x));
    assert.ok(tiny(left.pose.wrist[side].y,right.pose.wrist[side].y));
  }
  assert.deepEqual(sampleShow(p,42.25),sampleShow(p,42.25));
  assert.ok(sampleShow(p,2.25).lightEnergy>0);
  assert.equal(sampleShow(p,2.5).lightEnergy,0);
  const calm=buildShow({...p.show,settings:{...p.show.settings,reducedMotion:true}});
  assert.equal(sampleShow(calm,2.5).lightEnergy,0);
  assert.deepEqual(sampleShow(calm,2.2).pose,sampleShow(calm,2.7).pose);
});
test('schema import rejects malformed stages and strips non-allowlisted privacy fields',()=>{
  const base=starterShow(),raw={
    ...base,filename:'my.mp3',face:{x:1},apiToken:'secret',
    source:{...base.source,privatePhone:'555'},
    settings:{...base.settings,hiddenSensor:'bad'}
  };
  const decoded=parseShow(encodeShow(raw));
  assert.deepEqual(decoded,normalizeShow(base));
  const json=encodeShow(raw);
  for(const forbidden of ['filename','apiToken','privatePhone','hiddenSensor','face','poseTrace','calories'])
    assert.ok(!json.includes('"'+forbidden+'"'));
  assert.throws(()=>parseShow('{oops'),/Invalid performance JSON/);
  assert.throws(()=>parseShow(' '.repeat(131073)),/128 KiB/);
  assert.throws(()=>normalizeShow({...base,settings:{...base.settings,frame:'orbit'}}),/Invalid stage/);
  assert.throws(()=>normalizeShow({...base,overrides:[{segment:0,stage:'aurora'},{segment:0,stage:'ember'}]}),/Invalid scene override/);
});
test('source replacement discards old stage indices and anonymous receipt never names the show',()=>{
  const customized=changeScene(starterShow(),2,'twilight');
  const next=replaceSource(customized,'chart',starterChart());
  assert.deepEqual(next.overrides,[]);
  const plan=buildShow(next);
  const receipt=showReceipt(plan,10000,'local');
  assert.equal(receipt.displayedCounts,plan.totalCounts);
  assert.equal(receipt.provenance,'SCREEN_DEMONSTRATION_UNVERIFIED');
  assert.equal(receipt.musicMode,'local-audio-not-uploaded');
  for(const key of ['title','filename','song','camera','userId','rawPose','songBytes','biometrics'])
    assert.equal(Object.hasOwn(receipt,key),false);
});
