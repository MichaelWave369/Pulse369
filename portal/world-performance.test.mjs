import test from 'node:test';import assert from 'node:assert/strict';
import {starterChart,normalizeChart} from './choreo-model.mjs';
import {SAMPLE_WORLD} from './world-bridge.mjs';
import {createPerformance,readPerformance,writePerformance,editPerformanceCue,
 samplePerformance,importDanceFlow} from './world-performance.mjs';
const chart=starterChart();
const worlds=[SAMPLE_WORLD,{...SAMPLE_WORLD,title:'Second sculpture'}];
test('R4 chart + two worlds roundtrip and exact authored phrase transitions',()=>{
 const s=createPerformance(chart,worlds);
 assert.equal(s.cues.length,chart.phrases.length);
 assert.deepEqual(readPerformance(writePerformance(s)),s);
 assert.equal(samplePerformance(s,0).phraseIndex,0);
 const seconds=8*60/chart.bpm;
 const start=samplePerformance(s,seconds);
 assert.equal(start.phraseIndex,1);
 assert.equal(start.previousWorldIndex,0);
 assert.equal(start.worldIndex,1);
 assert.equal(start.blend,0);
 assert.equal(samplePerformance(s,seconds+2*60/chart.bpm).blend,.5);
 assert.equal(samplePerformance(s,seconds+4*60/chart.bpm).blend,1);
 assert.equal(samplePerformance(s,seconds-0.01).phraseIndex,0);
 assert.equal(samplePerformance(s,seconds+8*60/chart.bpm).phraseIndex,2);
 assert.equal(samplePerformance(s,samplePerformance(s,0).totalCounts*60/chart.bpm).phraseIndex,0);
});
test('Repeat counts and authored offset respected, not inferred FFT onsets',()=>{
 const source=normalizeChart({...chart,offsetMs:500,phrases:[{...chart.phrases[0],repeat:2},chart.phrases[1]]});
 const s=createPerformance(source,worlds);
 assert.equal(samplePerformance(s,.5).phraseIndex,0);
 assert.equal(samplePerformance(s,.5+15*60/chart.bpm).phraseIndex,0);
 assert.equal(samplePerformance(s,.5+16*60/chart.bpm).phraseIndex,1);
});
test('Invalid show does not mutate original and rejects malformed controls',()=>{
 const s=createPerformance(chart,worlds),before=writePerformance(s);
 assert.equal(editPerformanceCue(s,0,{palette:'ember',glow:.4}).cues[0].palette,'ember');
 assert.equal(writePerformance(s),before);
 assert.throws(()=>editPerformanceCue(s,1,{worldIndex:3}));
 assert.throws(()=>editPerformanceCue(s,1,{glow:5}));
 assert.throws(()=>readPerformance(JSON.stringify({...s,privateAudio:[1,2,3]})));
 assert.throws(()=>readPerformance(JSON.stringify({...s,worlds:[...worlds,...worlds]})));
 assert.throws(()=>samplePerformance(s,NaN));
});
test('Import authored DanceFlow chart based show, reject workout-only source',()=>{
 const s=importDanceFlow({schema:'pulse369.dance-performance.v1',title:'Show',
   source:{kind:'chart',data:chart},settings:{defaultStage:'neon',frame:'wide',expression:'showtime',reducedMotion:false},overrides:[]});
 assert.equal(s.bpm,chart.bpm);
 assert.throws(()=>importDanceFlow({schema:'pulse369.dance-performance.v1',title:'Show',
   source:{kind:'workout',data:{}},settings:{defaultStage:'neon',frame:'wide',expression:'showtime',reducedMotion:false},overrides:[]}));
});
