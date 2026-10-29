import test from 'node:test';
import assert from 'node:assert/strict';
import {visualCueForSession} from './world-visual-clock.mjs';
import {SAMPLE_WORLD} from './world-bridge.mjs';
const show=SAMPLE_WORLD.show;
test('rave eight-count visuals follow authored BPM and song offset without changing chart',()=>{
  assert.equal(visualCueForSession(show,0,120,0,true).title,'Arrival');
  assert.equal(visualCueForSession(show,3.9,120,0,true).title,'Arrival');
  assert.equal(visualCueForSession(show,4,120,0,true).title,'Flow');
  assert.equal(visualCueForSession(show,8,120,0,true).title,'Finale');
  assert.equal(visualCueForSession(show,12,120,0,true).title,'Arrival');
  assert.equal(visualCueForSession(show,5,120,1,true).title,'Flow');
  assert.equal(visualCueForSession(show,5,60,1,true).title,'Arrival');
});
test('non-rave preview retains Showrunner timed cues and validates inputs',()=>{
  assert.equal(visualCueForSession(show,11,120,0,false).title,'Arrival');
  assert.equal(visualCueForSession(show,12,120,0,false).title,'Flow');
  assert.throws(()=>visualCueForSession(show,5,Infinity,0,true));
  assert.throws(()=>visualCueForSession(show,5,120,Infinity,true));
});
