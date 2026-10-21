import test from 'node:test';
import assert from 'node:assert/strict';
import { DANCE_STYLES, DANCE_BEATS, DANCE_WINDOW_MS, danceMove, danceBeatAt, poseMatches, danceReceipt } from './dance-core.mjs';

test('all styles provide safe bounded eight-count phrases', () => {
  for (const key of Object.keys(DANCE_STYLES)) {
    assert.equal(DANCE_STYLES[key].moves.length, 8);
    for (let i = 0; i < 8; i++) {
      const move = danceMove(key, i);
      assert.equal(move, danceMove(key, i + 8));
      assert.ok(move.hands.length >= 1 && move.hands.length <= 2);
      for (const t of move.hands) {
        assert.ok(Math.abs(t.x) <= .5);
        assert.ok(Math.abs(t.y) <= .3);
        assert.ok(t.z <= -.45 && t.z >= -.6);
        assert.ok(['left','right'].includes(t.side));
      }
    }
  }
  assert.equal(danceMove('missing', 2), null);
  assert.equal(danceMove('groove', -1), null);
});

test('beat timing uses a bounded window and rejects future/past counts', () => {
  assert.equal(danceBeatAt(2999, 3000, 120), null);
  assert.deepEqual(danceBeatAt(3010, 3000, 120), { index:0, errorMs:10 });
  assert.equal(danceBeatAt(3000 + DANCE_WINDOW_MS + 1, 3000, 120), null);
  assert.deepEqual(danceBeatAt(3500, 3000, 120), {index:1,errorMs:0});
  assert.equal(danceBeatAt(3000 + DANCE_BEATS * 500, 3000, 120), null);
  assert.equal(danceBeatAt(NaN, 3000, 120), null);
});

test('both hands required for a double cue; incorrect/missing hand cannot match', () => {
  const targets = [{side:'left',x:-.3,y:1.2,z:-.5},{side:'right',x:.3,y:1.2,z:-.5}];
  assert.equal(poseMatches({left:{x:-.3,y:1.2,z:-.5},right:{x:.3,y:1.2,z:-.5}},targets),true);
  assert.equal(poseMatches({left:{x:-.3,y:1.2,z:-.5}},targets),false);
  assert.equal(poseMatches({left:{x:.3,y:1.2,z:-.5},right:{x:-.3,y:1.2,z:-.5}},targets),false);
  assert.equal(poseMatches({left:{x:0,y:0,z:0},right:{x:.3,y:1.2,z:-.5}},targets),false);
});

test('sanitized receipts never persist raw tracking, identity, files or music', () => {
  const receipt = danceReceipt({style:'funk',bpm:112,posture:'seated',hits:1000,completedBeats:16,
    rawPose: {x:1}, name:'Person',audioFile:'secret.mp3'});
  assert.equal(receipt.matchedControllerCues,16);
  assert.equal(receipt.offeredCounts,16);
  assert.equal(receipt.posture,'seated');
  assert.equal(receipt.provenance,'LOCAL_UNVERIFIED');
  for (const key of ['rawPose','name','audioFile','timestamp','heartRate','calories']) assert.ok(!Object.hasOwn(receipt,key));
});
