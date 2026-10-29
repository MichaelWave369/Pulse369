import test from 'node:test';
import assert from 'node:assert/strict';
import {SAMPLE_WORLD,SHOW_SCHEMA,WORKSHOP_SCHEMA,WORLD_SCHEMA,activeCue,readWorldFile,writeWorldPack} from './world-bridge.mjs';

const json = value => JSON.stringify(value);
const base = () => structuredClone(SAMPLE_WORLD);
test('converts Domistika Showpack to versioned portable Pulse worldpack',() => {
  const original=base();
  const input={schema:SHOW_SCHEMA,app:'Domistika XR',version:'1.0',
    show:original.show,workshop:original.workshop};
  const result=readWorldFile(json(input));
  assert.equal(result.schema,WORLD_SCHEMA);
  assert.equal(result.source.schema,SHOW_SCHEMA);
  assert.deepEqual(readWorldFile(writeWorldPack(result)),result);
  assert.equal(result.workshop.objects.length,9);
});
test('accepts raw Domistika workshop with safe static demo cues',() => {
  const result=readWorldFile(json(base().workshop));
  assert.equal(result.source.schema,WORKSHOP_SCHEMA);
  assert.equal(result.show.cues.length,1);
});
test('rejects malformed, oversized and unknown formats',() => {
  for(const value of ['{','[]',json({schema:'somewhere.else'}),'x'.repeat(2250001)])
    assert.throws(() => readWorldFile(value));
});
test('rejects wrong source identities and extra top-level execution fields',() => {
  const a=base();a.source.app='not Domistika';assert.throws(() => readWorldFile(json(a)));
  const b=base();b.script='alert(1)';assert.throws(() => readWorldFile(json(b)));
  const c=base();c.workshop.objects[0].url='https://example.com/evil';assert.throws(() => readWorldFile(json(c)));
});
test('rejects out-of-range geometry, duplicate IDs, unsafe motion and cues',() => {
  const edit=(change) => {const a=base();change(a);assert.throws(() => readWorldFile(json(a)));};
  edit(a=>{a.workshop.objects[0].position[0]=26;});
  edit(a=>{a.workshop.objects[1].id=a.workshop.objects[0].id;});
  edit(a=>{a.workshop.objects[0].motion.band='malicious';});
  edit(a=>{a.workshop.objects[0].motion.speed=Infinity;});
  edit(a=>{a.show.cues[0].palette='javascript';});
  edit(a=>{a.show.cues[0].duration=999;});
  edit(a=>{a.workshop.objects[0].positions=[1,2,3];});
  edit(a=>{a.workshop.objects[0].kind='mesh';a.workshop.objects[0].positions=[0,0,0,1,0,0,0,1,0];a.workshop.objects[0].source={app:'unknown',ref:'bad'};});
});
test('rejects triangle budget violations',() => {
  const a=base();a.workshop.objects=Array.from({length:6},(_,i)=>({
    ...structuredClone(a.workshop.objects[0]),id:'work-mesh'+String(i).padStart(4,'0'),
    kind:'mesh',positions:Array.from({length:9*1100},(_,j)=>j%3===1?1:0)
  }));
  assert.throws(() => readWorldFile(json(a)),/triangle budget/);
});
test('cue selection loops at known deterministic boundaries',() => {
  const s=base().show;
  assert.equal(activeCue(s,0).title,'Arrival');
  assert.equal(activeCue(s,12).title,'Flow');
  assert.equal(activeCue(s,30).title,'Finale');
  assert.equal(activeCue(s,44).title,'Arrival');
});
test('validation does not mutate input source objects',() => {
  const a=base();const before=json(a);
  readWorldFile(before);
  assert.equal(json(a),before);
});
