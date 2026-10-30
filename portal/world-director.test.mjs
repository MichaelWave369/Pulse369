import test from 'node:test';import assert from 'node:assert/strict';
import {SAMPLE_WORLD,writeWorldPack,readWorldFile} from './world-bridge.mjs';
import {assignObjectBand} from './world-director.mjs';
test('director edits only one visual band without mutating source or adding music files',()=>{
 const before=writeWorldPack(SAMPLE_WORLD),id=SAMPLE_WORLD.workshop.objects[0].id;
 const revised=assignObjectBand(SAMPLE_WORLD,id,'high');
 assert.equal(revised.workshop.objects[0].motion.band,'high');
 assert.equal(writeWorldPack(SAMPLE_WORLD),before);
 assert.deepEqual(readWorldFile(writeWorldPack(revised)),revised);
 assert.equal(JSON.stringify(revised).includes('audioData'),false);
});
test('director rejects absent objects, invalid bands and preserves other objects',()=>{
 const id=SAMPLE_WORLD.workshop.objects[1].id;
 assert.throws(()=>assignObjectBand(SAMPLE_WORLD,'not-found','bass'));
 assert.throws(()=>assignObjectBand(SAMPLE_WORLD,id,'http://evil'));
 assert.deepEqual(assignObjectBand(SAMPLE_WORLD,id,'beat').workshop.objects[0],SAMPLE_WORLD.workshop.objects[0]);
});
