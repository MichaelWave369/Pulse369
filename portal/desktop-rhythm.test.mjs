import test from 'node:test';
import assert from 'node:assert/strict';
import { handForKey, gradeDesktopHit, desktopBeatProgress, desktopNextCue, makeDesktopReceipt } from './desktop-rhythm.mjs';

test('keyboard A and L map to different hands without assigning other keys', () => {
  assert.equal(handForKey('a'), 'left');
  assert.equal(handForKey('A'), 'left');
  assert.equal(handForKey('l'), 'right');
  assert.equal(handForKey('L'), 'right');
  assert.equal(handForKey('Enter'), null);
  assert.equal(handForKey(null), null);
});
test('desktop hit is scored with the same Web Audio clock as headset music', () => {
  const seen = new Set();
  const first = gradeDesktopHit(10, 10, 120, 0, 'left', seen);
  assert.equal(first?.index, 0);
  seen.add(first.index);
  assert.equal(gradeDesktopHit(10, 10, 120, 0, 'left', seen), null);
  assert.equal(gradeDesktopHit(10.5, 10, 120, 0, 'right', seen)?.index, 1);
});
test('wrong-hand and offbeat presses are rejected', () => {
  const seen=new Set();
  assert.equal(gradeDesktopHit(10,10,120,0,'right',seen),null);
  assert.equal(gradeDesktopHit(10.23,10,120,0,'left',seen),null);
  assert.equal(gradeDesktopHit(10,10,120,0,'left',null),null);
});
test('beat progress is zero during lead in and stops at 24', () => {
  assert.equal(desktopBeatProgress(2,4,120,0),0);
  assert.equal(desktopBeatProgress(4,4,120,0),1);
  assert.equal(desktopBeatProgress(4.5,4,120,0),2);
  assert.equal(desktopBeatProgress(500,4,120,0),24);
});
test('offset applies to cues and hit scoring consistently', () => {
  const cue=desktopNextCue(10.1,10,120,250);
  assert.equal(cue?.index,0);
  assert.equal(Math.round(cue.untilMs),150);
  assert.equal(desktopBeatProgress(10.1,10,120,250),0);
  assert.equal(gradeDesktopHit(10.25,10,120,250,'left',new Set())?.index,0);
});
test('never fabricate perfect accuracy for an empty session', () => {
  const report=makeDesktopReceipt({bpm:120,offsetMs:0,errors:[],elapsedMs:2400,reason:'stopped'});
  assert.equal(report.rhythm.acceptedTouches,0);
  assert.equal(report.rhythm.meanAbsoluteErrorMs,null);
  assert.equal(report.exit,'stopped');
});
test('receipt strips filenames, account IDs, audio and individual event times', () => {
  const report=makeDesktopReceipt({bpm:90,offsetMs:250,errors:[-50,50],elapsedMs:21000,reason:'completed',
    filename:'personal.mp3',userId:'private',audioBytes:'secret',keystrokes:[10,20],headPosition:[1,2,3]});
  assert.equal(report.schema,'pulse369.desktop-rehearsal.v1');
  assert.equal(report.exit,'completed');
  assert.equal(report.rhythm.meanAbsoluteErrorMs,50);
  for (const key of ['filename','userId','audioBytes','keystrokes','headPosition','errors']) {
    assert.equal(Object.hasOwn(report,key),false);
  }
  assert.equal(JSON.stringify(report).includes('personal.mp3'),false);
});
test('invalid aggregate inputs produce safe receipt values', () => {
  const report=makeDesktopReceipt({bpm:Infinity,offsetMs:-3,errors:[Infinity],elapsedMs:-10,reason:'done'});
  assert.equal(report.localMusic.manualBpm,null);
  assert.equal(report.localMusic.manualBeatOffsetMs,null);
  assert.equal(report.durationSeconds,0);
});
