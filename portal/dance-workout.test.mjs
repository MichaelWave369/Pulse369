import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKOUT_SCHEMA,WORKOUT_BPM,WORKOUT_MINUTES,starterWorkout,normalizeWorkout,
  encodeWorkout,parseWorkout,editPlaylist,buildWorkout,workoutCue,nextSection,
  workoutTrackError,workoutChoreoChart,workoutReceipt
} from './dance-workout.mjs';
import {encodeChart,parseChart,totalCounts} from './choreo-model.mjs';

test('all supported BPM x duration x posture combinations close without gaps',()=>{
  for(const bpm of WORKOUT_BPM)for(const minutes of WORKOUT_MINUTES)
    for(const posture of ['seated','standing']){
      const plan=buildWorkout({...starterWorkout(),bpm,minutes,posture});
      assert.equal(plan.totalCounts,Math.round(minutes*bpm/8)*8);
      assert.ok(Math.abs(plan.durationSeconds-minutes*60)<4);
      assert.equal(plan.segments[0].kind,'warmup');
      assert.equal(plan.segments.at(-1).kind,'cooldown');
      assert.ok(plan.sectionCount>0);
      for(let i=0;i<plan.segments.length;i++){
        const s=plan.segments[i];
        assert.equal(s.counts%8,0);
        assert.ok(s.counts>=8);
        if(i)assert.equal(s.start,plan.segments[i-1].end);
        for(let j=s.start;j<s.end;j++){
          const cue=workoutCue(plan,j);
          assert.equal(cue.kind,s.kind);
          assert.equal(cue.illustrationOnly,true);
          assert.ok(cue.instruction.length>15);
          if(posture==='seated'){
            assert.equal(cue.feet.left.x,-.22);
            assert.equal(cue.feet.right.x,.22);
          }
        }
      }
      assert.equal(plan.segments.at(-1).end,plan.totalCounts);
      assert.equal(workoutCue(plan,plan.totalCounts),null);
      assert.equal(workoutCue(plan,-1),null);
      assert.equal(workoutTrackError(plan,plan.durationSeconds+2),null);
      assert.match(workoutTrackError(plan,1),/too short/);
    }
});
test('recovery is explicit, bounded, never replaces cooldown and has its own cues',()=>{
  const p=buildWorkout(starterWorkout());
  const recover=p.segments.filter(s=>s.kind==='recovery');
  assert.equal(recover.length,p.recoveryCount);
  assert.ok(recover.length>0);
  for(const s of recover){
    assert.equal(s.counts,16);
    const c=workoutCue(p,s.start);
    assert.equal(c.focus,'both');
    assert.match(c.instruction,/recovery break/);
  }
  const edge=p.segments[0].end-1;
  const ahead=nextSection(p,edge);
  assert.equal(ahead.inCounts,1);
  assert.equal(ahead.kind,'dance');
  assert.equal(nextSection(p,p.totalCounts-1),null);
});
test('workout recipe editing, ordering and import roundtrip are allowlisted',()=>{
  const initial=starterWorkout();
  assert.equal(initial.schema,WORKOUT_SCHEMA);
  assert.deepEqual(parseWorkout(encodeWorkout(initial)),normalizeWorkout(initial));
  let p=editPlaylist(initial,{type:'add',index:0,lesson:'disco'});
  assert.equal(p.playlist.length,4);
  p=editPlaylist(p,{type:'move',index:1,direction:1});
  assert.equal(p.playlist[2],'disco');
  p=editPlaylist(p,{type:'replace',index:0,lesson:'funk'});
  assert.equal(p.playlist[0],'funk');
  p=editPlaylist(p,{type:'remove',index:0});
  assert.equal(p.playlist.length,3);
  assert.equal(initial.playlist.length,3);
  assert.throws(()=>editPlaylist({...initial,playlist:['funk']},{type:'remove',index:0}),/at least one/);
  assert.throws(()=>editPlaylist({...initial,playlist:Array(6).fill('house')},{type:'add',index:0,lesson:'funk'}),/Maximum/);
  assert.throws(()=>parseWorkout(' '.repeat(17000)),/16 KiB/);
  assert.throws(()=>parseWorkout('no json'),/Invalid workout/);
  assert.throws(()=>normalizeWorkout({...initial,playlist:['unknown']}),/Unsupported lesson/);
  assert.throws(()=>normalizeWorkout({...initial,offsetMs:2000}),/0–1000/);
  const json=encodeWorkout({...initial,password:'secret',privateSong:'song.mp3',rawPose:[1,2]});
  for(const k of ['password','privateSong','rawPose'])assert.ok(!json.includes(k));
});
test('exported v1 chart remains hand-only despite complete workout sequencing',()=>{
  const workout=starterWorkout();
  const json=encodeChart(workoutChoreoChart(workout));
  const chart=parseChart(json);
  assert.equal(chart.phrases.length,workout.playlist.length);
  assert.equal(totalCounts(chart),24);
  for(const forbidden of ['feet','standing','seated','recovery','warmup','heartRate','privateSong','pose','calories'])
    assert.ok(!json.includes('"'+forbidden+'":'));
});
test('only unverified display progress, never workout performance, is recorded',()=>{
  const raw=starterWorkout();
  const plan=buildWorkout(raw);
  const receipt=workoutReceipt({...raw,secret:'no'},plan.totalCounts+5000,'local');
  assert.equal(receipt.displayedCounts,plan.totalCounts);
  assert.equal(receipt.provenance,'SCREEN_DEMONSTRATION_UNVERIFIED');
  assert.equal(receipt.soundtrack,'local-file-not-uploaded');
  assert.equal(receipt.playlistCount,3);
  for(const k of ['title','playlist','filename','song','user','body','biometric','calories','workoutCompleted'])
    assert.equal(Object.hasOwn(receipt,k),false);
});
