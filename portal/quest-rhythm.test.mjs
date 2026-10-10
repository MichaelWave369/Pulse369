import test from 'node:test';
import assert from 'node:assert/strict';
import { beatNear, classifyRhythmTouch, summarizeRhythm, RHYTHM_BEATS, RHYTHM_WINDOW_MS } from './quest-rhythm.mjs';

test('120 BPM creates alternating 500ms visual beats', () => {
  assert.deepEqual(beatNear(1000, 1000, 120), { index:0, hand:'left', errorMs:0, periodMs:500 });
  assert.deepEqual(beatNear(1500, 1000, 120), { index:1, hand:'right', errorMs:0, periodMs:500 });
  assert.equal(beatNear(900, 1000, 120)?.errorMs, -100);
});
test('no scheduled beat is counted before lead-in or after 24 prompts', () => {
  assert.equal(beatNear(500, 1000, 120), null);
  assert.equal(beatNear(1000 + RHYTHM_BEATS * 500, 1000, 120), null);
});
test('wrong-hand, duplicates, and out-of-window touches are ignored', () => {
  const seen = new Set([0]);
  assert.equal(classifyRhythmTouch(1000,1000,120,'right',new Set()),null);
  assert.equal(classifyRhythmTouch(1000,1000,120,'left',seen),null);
  assert.equal(classifyRhythmTouch(1000 + RHYTHM_WINDOW_MS + 1,1000,120,'left',new Set()),null);
  assert.equal(classifyRhythmTouch(1500,1000,120,'right',new Set())?.index,1);
});
test('signed early/late error stays explicit and is not called audio latency', () => {
  assert.equal(classifyRhythmTouch(850,1000,120,'left',new Set())?.errorMs,-150);
  assert.equal(classifyRhythmTouch(1650,1000,120,'right',new Set())?.errorMs,150);
  const result = summarizeRhythm([-150,0,150],120);
  assert.equal(result.meanAbsoluteErrorMs,100);
  assert.equal(result.medianSignedErrorMs,0);
  assert.equal(result.earlyTouches,1);
  assert.equal(result.lateTouches,1);
  assert.equal(result.onBeatTouches,1);
  assert.match(result.limits,/Not system latency/);
});
test('empty sessions remain nullable, never a fabricated zero-error result', () => {
  const r=summarizeRhythm([],90);
  assert.equal(r.acceptedTouches,0);
  assert.equal(r.meanAbsoluteErrorMs,null);
  assert.equal(r.medianSignedErrorMs,null);
});
test('aggregate report cannot leak pose or per-hit timestamps', () => {
  const r=summarizeRhythm([-30,60],120);
  for (const key of ['headHeight','controllerPosition','deviceId','eventTimes','rawTiming','songs','user_id']) {
    assert.equal(Object.hasOwn(r,key),false);
  }
  assert.equal(r.offeredBeats,24);
});
test('invalid timing values cannot make a non-finite report', () => {
  assert.equal(beatNear(NaN,1000,120),null);
  assert.equal(beatNear(1000,1000,0),null);
  const r=summarizeRhythm([NaN,Infinity,-999,20],999);
  assert.equal(r.acceptedTouches,1);
  assert.equal(r.bpm,null);
  assert.equal(r.meanAbsoluteErrorMs,20);
});
