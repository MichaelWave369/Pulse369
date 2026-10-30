import test from 'node:test';import assert from 'node:assert/strict';
import {starterChart,normalizeChart} from './choreo-model.mjs';
import {SAMPLE_WORLD} from './world-bridge.mjs';
import {createPerformance,writePerformance} from './world-performance.mjs';
import {createDirectorSheet,directorAt,experiencePreflight,createDirectorClock} from './world-experience-director.mjs';
const show=createPerformance(starterChart(),[SAMPLE_WORLD,{...SAMPLE_WORLD,title:'The Next World'}]);
test('R10 authored storyboard follows repeats, manual offset and scene map without source edits',()=>{
 const original=writePerformance(show),sheet=createDirectorSheet(show);
 assert.equal(sheet.phrases.length,4);assert.equal(sheet.phrases[1].startCount,8);
 assert.equal(sheet.phrases[1].worldIndex,1);assert.equal(sheet.phrases[1].name,'FUNK BREAK');
 assert.equal(directorAt(show,8*60/112).phraseIndex,1);
 assert.equal(writePerformance(show),original);
 const variant=normalizeChart({...starterChart(),offsetMs:500,
   phrases:[{...starterChart().phrases[0],repeat:3},starterChart().phrases[1]]});
 const alt=createPerformance(variant,[SAMPLE_WORLD]);
 assert.equal(createDirectorSheet(alt).phrases[1].startCount,24);
 assert.equal(createDirectorSheet(alt).phrases[1].startSeconds,.5+24*60/112);
});
test('R10 visual rehearsal pauses on inactivity, wraps without affecting audio/gameplay',()=>{
 const clock=createDirectorClock();
 assert.throws(()=>clock.play(true),/Enable/);
 clock.setEnabled(true,10);clock.seek(7);
 clock.play(true);clock.tick(1000,true);clock.tick(2300,true);
 assert.equal(clock.status().seconds,7,'large background frame gap pauses visual rehearsal');
 assert.equal(clock.status().playing,false);
 clock.play(true);clock.tick(3000,true);clock.tick(3200,true);
 assert.equal(clock.status().seconds,7.2);
 clock.tick(3400,true);assert.equal(clock.status().seconds,7.4);
 clock.seek(9.9);clock.tick(5000,true);clock.tick(5100,true);
 assert.equal(clock.status().seconds,0);
 clock.tick(5200,false);assert.equal(clock.status().playing,false);
 clock.setEnabled(false);assert.equal(clock.status().seconds,0);
});
test('R10 preflight reports mismatched BPM and scene budget without touching file format',()=>{
 const original=writePerformance(show);
 const q=experiencePreflight(show,120);
 assert.equal(q.matchedTrackBpm,false);assert.ok(q.warnings.some(x=>/BPM/.test(x)));
 assert.equal(experiencePreflight(show,112).matchedTrackBpm,true);
 assert.deepEqual(q.sheet,createDirectorSheet(show));
 assert.equal(writePerformance(show),original);
 assert.throws(()=>experiencePreflight(show,Infinity),/BPM/);
 assert.throws(()=>directorAt(show,-1),/time/);
});
