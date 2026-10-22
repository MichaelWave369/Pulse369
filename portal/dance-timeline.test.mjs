import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TIMELINE_SCHEMA,starterTimeline,normalizeTimeline,parseTimeline,encodeTimeline,
  timelineFromSource,updateNote,updateStage,editPhrase,editCount,timelineRows,timelineCueSheet
} from './dance-timeline.mjs';
import {starterShow,replaceSource,buildShow} from './dance-performance.mjs';
import {starterChart} from './choreo-model.mjs';

const chartTimeline=()=>timelineFromSource(replaceSource(starterShow(),'chart',starterChart()));
test('new R9 schema wraps R7 without changing R7 show, with no private fields',()=>{
  const original=starterShow();
  assert.equal(original.schema,'pulse369.dance-performance.v1');
  const t=starterTimeline();
  assert.equal(t.schema,TIMELINE_SCHEMA);
  assert.deepEqual(t.show,original);
  assert.deepEqual(parseTimeline(encodeTimeline(t)),normalizeTimeline(t));
  const untrusted={...t,filename:'private.mp3',privateVideo:'face',rawSensor:[1]};
  const encoded=encodeTimeline(untrusted);
  for(const forbidden of ['filename','privateVideo','rawSensor','calories','camera'])
    assert.equal(encoded.includes('"'+forbidden+'"'),false);
  assert.throws(()=>parseTimeline('{'),/Invalid timeline JSON/);
  assert.throws(()=>parseTimeline(' '.repeat(131073)),/128 KiB/);
});
test('R2 phrases rearrange with stage and director note identity preserved',()=>{
  let t=chartTimeline();
  t=updateNote(t,1,'Change camera framing softly.');
  t=updateStage(t,1,'ember');
  const oldPlan=buildShow(t.show);
  t=editPhrase(t,1,'move',{direction:-1});
  const plan=buildShow(t.show),rows=timelineRows(t);
  assert.equal(t.show.source.data.phrases[0].name,'FUNK BREAK');
  assert.equal(t.notes[0].segment,0);
  assert.equal(rows[0].note,'Change camera framing softly.');
  assert.equal(plan.segments[0].stage,'ember');
  assert.equal(plan.segments[1].stage,oldPlan.segments[0].stage);
  assert.equal(plan.totalCounts,oldPlan.totalCounts);
  assert.equal(rows[0].start,0);
  assert.equal(rows.at(-1).end,plan.totalCounts);
});
test('duplicate/delete/insert phrases keeps notes with authored originals',()=>{
  let t=chartTimeline();
  t=updateNote(t,0,'Intro note');
  t=updateNote(t,1,'Funk note');
  t=editPhrase(t,0,'duplicate');
  assert.equal(t.show.source.data.phrases.length,5);
  assert.deepEqual(t.notes.map(n=>[n.segment,n.text]),[[0,'Intro note'],[2,'Funk note']]);
  t=editPhrase(t,1,'delete');
  assert.equal(t.show.source.data.phrases.length,4);
  assert.deepEqual(t.notes.map(n=>[n.segment,n.text]),[[0,'Intro note'],[1,'Funk note']]);
  t=editPhrase(t,1,'add',{style:'disco'});
  assert.equal(t.show.source.data.phrases.length,5);
  assert.deepEqual(t.notes.map(n=>n.segment),[0,1]);
  t=editPhrase(t,0,'style',{style:'funk'});
  assert.equal(t.show.source.data.phrases[0].steps[0].style,'funk');
  t=editPhrase(t,0,'repeat',{repeat:3});
  assert.equal(t.show.source.data.phrases[0].repeat,3);
  t=editPhrase(t,0,'rename',{name:'CUSTOM FUNK INTRO'});
  assert.equal(t.show.source.data.phrases[0].name,'CUSTOM FUNK INTRO');
  assert.throws(()=>editPhrase(t,0,'repeat',{repeat:8}),/1–4/);
  assert.throws(()=>editPhrase(t,0,'add',{style:'not-real'}),/Unknown phrase style/);
});
test('editing one exact hand gesture never mutates other count cells',()=>{
  let t=chartTimeline(),original=t.show.source.data.phrases[0];
  t=editCount(t,0,3,{style:'disco',moveIndex:5,mirror:true});
  const next=t.show.source.data.phrases[0];
  assert.equal(next.steps[3].style,'disco');
  assert.equal(next.steps[3].moveIndex,5);
  assert.equal(next.steps[3].mirror,true);
  assert.deepEqual(next.steps[2],original.steps[2]);
  assert.deepEqual(next.steps[4],original.steps[4]);
  assert.throws(()=>editCount(t,0,8,{style:'funk'}),/Invalid count/);
  assert.throws(()=>editCount(t,0,1,{style:'fake'}),/Unknown dance style/);
});
test('R6 generated intervals are read-only but lighting and notes are editable',()=>{
  let t=starterTimeline();
  t=updateNote(t,0,'Warm up: gentle range or observe.');
  t=updateStage(t,2,'aurora');
  const original=buildShow(t.show),rows=timelineRows(t);
  assert.equal(rows[0].note,'Warm up: gentle range or observe.');
  assert.equal(rows[2].stage,'aurora');
  assert.deepEqual(rows.map(r=>r.end),original.segments.map(s=>s.end));
  assert.throws(()=>editPhrase(t,0,'move',{direction:1}),/R2 chart/);
  assert.throws(()=>editCount(t,0,0,{}),/R2 chart/);
  assert.throws(()=>updateNote(t,0,'x'.repeat(241)),/allowed length/);
  t=updateNote(t,0,'  ');
  assert.deepEqual(t.notes,[]);
});
test('cue sheets cover full show timing and contain manually authored text only',()=>{
  for(const t of [starterTimeline(),chartTimeline()]){
    const rows=timelineRows(t),plan=buildShow(t.show);
    assert.equal(rows[0].start,0);
    assert.equal(rows.at(-1).end,plan.totalCounts);
    for(let i=1;i<rows.length;i++)assert.equal(rows[i].start,rows[i-1].end);
    for(const r of rows)assert.equal(r.startSeconds,r.start*60/plan.bpm+plan.offsetMs/1000);
    const txt=timelineCueSheet(t);
    assert.match(txt,/DIRECTOR TIMELINE/);
    assert.match(txt,/NO AUDIO ANALYSIS/);
  }
});
