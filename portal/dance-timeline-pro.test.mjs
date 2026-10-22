import test from 'node:test';
import assert from 'node:assert/strict';
import {
 PRO_SCHEMA,MAX_COUNT_NOTES,HISTORY_LIMIT,starterPro,wrapTimeline,normalizePro,
 encodePro,parsePro,updateCountNote,editProPhrase,editProCount,updateProStage,
 updateProSectionNote,proRows,proCueSheet,createHistory,commitHistory,undoHistory,redoHistory
} from './dance-timeline-pro.mjs';
import {starterTimeline,timelineFromSource} from './dance-timeline.mjs';
import {starterShow,replaceSource,buildShow} from './dance-performance.mjs';
import {starterChart} from './choreo-model.mjs';
const r2=()=>wrapTimeline(timelineFromSource(replaceSource(starterShow(),'chart',starterChart())));
test('R9→R10 migration preserves R7 and R9 verbatim, import/export never leaks extras',()=>{
 const previous=starterTimeline();
 const pro=wrapTimeline(previous);
 assert.equal(pro.schema,PRO_SCHEMA);
 assert.deepEqual(pro.timeline,previous);
 assert.deepEqual(parsePro(encodePro(pro)),pro);
 const bad={...pro,privateSong:'file.mp3',cameraTrace:[],countNotes:[{segment:0,beat:0,text:'HELLO',recording:42}]};
 const clean=encodePro(bad);
 for(const token of ['privateSong','cameraTrace','recording'])assert.ok(!clean.includes(token));
 assert.throws(()=>parsePro('{'),/Invalid Timeline Pro JSON/);
 assert.throws(()=>parsePro(' '.repeat(131073)),/128 KiB/);
});
test('per-count notes are bounded, unique, allowlisted, and local to exact eight-count R2 step',()=>{
 let t=r2();
 t=updateCountNote(t,2,7,'Accent on 8');
 t=updateCountNote(t,2,0,'FIRST');
 assert.equal(t.countNotes.length,2);
 assert.equal(proRows(t)[2].noteCount,2);
 assert.equal(proRows(t)[1].noteCount,0);
 const after=editProCount(t,2,7,{style:'disco',mirror:true});
 assert.equal(after.countNotes.find(n=>n.beat===7).text,'Accent on 8');
 assert.equal(after.timeline.show.source.data.phrases[2].steps[7].mirror,true);
 t=updateCountNote(t,2,7,'   ');
 assert.equal(t.countNotes.length,1);
 assert.throws(()=>updateCountNote(t,2,8,'Nope'),/out of range/);
 assert.throws(()=>updateCountNote(t,2,0,'x'.repeat(121)),/too long/);
 assert.throws(()=>normalizePro({...t,countNotes:[{segment:2,beat:0,text:'X'},{segment:2,beat:0,text:'Y'}]}),/Duplicate/);
 assert.throws(()=>normalizePro({...t,countNotes:Array(MAX_COUNT_NOTES+1).fill({segment:0,beat:0,text:'many'})}),/limit/);
});
test('moving phrases swaps per-beat notes with authored content and stage, not numeric lane',()=>{
 let t=r2();
 t=updateCountNote(t,1,3,'Funk cue');
 t=updateCountNote(t,0,2,'House cue');
 t=updateProSectionNote(t,1,'Bring in warm lights');
 t=updateProStage(t,1,'ember');
 t=editProPhrase(t,1,'move',{direction:-1});
 const rows=proRows(t);
 assert.equal(rows[0].label,'FUNK BREAK');
 assert.equal(rows[0].countNotes[0].text,'Funk cue');
 assert.equal(rows[1].countNotes[0].text,'House cue');
 assert.equal(rows[0].stage,'ember');
 assert.equal(rows[0].note,'Bring in warm lights');
 assert.equal(rows.at(-1).end,buildShow(t.timeline.show).totalCounts);
});
test('duplicate, insert, delete and repeats retain notes only on original phrase',()=>{
 let t=r2();
 t=updateCountNote(t,0,2,'Private director note');
 t=updateCountNote(t,1,4,'Other phrase');
 t=editProPhrase(t,0,'duplicate');
 assert.equal(proRows(t)[0].noteCount,1);
 assert.equal(proRows(t)[1].noteCount,0);
 assert.equal(proRows(t)[2].noteCount,1);
 t=editProPhrase(t,0,'add',{style:'funk'});
 assert.equal(proRows(t)[1].noteCount,0);
 assert.equal(proRows(t)[3].countNotes[0].text,'Other phrase');
 t=editProPhrase(t,1,'delete');
 assert.equal(proRows(t)[2].countNotes[0].text,'Other phrase');
 t=editProPhrase(t,0,'repeat',{repeat:4});
 assert.equal(proRows(t)[0].counts,32);
 assert.equal(proRows(t)[0].countNotes[0].beat,2);
 assert.match(proCueSheet(t),/EIGHT-COUNT SLOT 3/);
 assert.throws(()=>editProPhrase(t,0,'move',{direction:9}),/Direction/);
});
test('R6 notes can refer to a specific local count but generated workout remains immutable',()=>{
 let t=starterPro();
 const rows=proRows(t),first=rows[0];
 t=updateCountNote(t,0,first.counts-1,'Close warmup');
 assert.equal(proRows(t)[0].noteCount,1);
 assert.equal(proRows(t)[0].countNotes[0].beat,first.counts-1);
 assert.match(proCueSheet(t),/LOCAL COUNT/);
 assert.throws(()=>updateCountNote(t,0,first.counts,'Outside'),/out of range/);
 assert.throws(()=>editProPhrase(t,0,'delete'),/R2 chart/);
 assert.equal(buildShow(t.timeline.show).segments.at(-1).kind,'cooldown');
});
test('undo/redo restore complete annotated snapshots and cap memory at 40 commits',()=>{
 let h=createHistory(r2());
 assert.equal(h.past.length,0);
 h=commitHistory(h,updateCountNote(h.present,0,1,'Downbeat'));
 h=commitHistory(h,updateProStage(h.present,0,'aurora'));
 assert.equal(h.present.countNotes.length,1);
 assert.equal(proRows(h.present)[0].stage,'aurora');
 const before=h;
 h=undoHistory(h);
 assert.equal(proRows(h.present)[0].stage,'neon');
 h=undoHistory(h);
 assert.equal(h.present.countNotes.length,0);
 h=redoHistory(h);
 assert.equal(h.present.countNotes[0].text,'Downbeat');
 h=commitHistory(h,updateCountNote(h.present,0,1,'Different'));
 assert.equal(h.future.length,0);
 assert.strictEqual(commitHistory(h,h.present),h);
 assert.equal(undoHistory(createHistory()).past.length,0);
 assert.equal(redoHistory(createHistory()).future.length,0);
 for(let i=0;i<65;i++)h=commitHistory(h,updateCountNote(h.present,0,1,'Edit '+i));
 assert.equal(h.past.length,HISTORY_LIMIT);
 assert.equal(h.future.length,0);
 assert.equal(before.present.countNotes[0].text,'Downbeat');
});
