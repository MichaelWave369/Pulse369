import {
  TIMELINE_SCHEMA,normalizeTimeline,starterTimeline,editPhrase,editCount,
  updateStage,updateNote,timelineRows,timelineCueSheet
} from './dance-timeline.mjs';

/**
 * R10 extends R9 with scoped annotations and bounded in-memory history.
 * A count note is an AUTHOR'S NOTE about an authored beat. It is not
 * sound analysis, captured footwork, a detected motion or a performance score.
 */
export const PRO_SCHEMA='pulse369.dance-timeline-pro.v1';
export const PRO_MAX_BYTES=131072;
export const MAX_COUNT_NOTES=96;
export const HISTORY_LIMIT=40;
const own=(object,key)=>Object.hasOwn(object,key);
const validIndex=(i,n)=>Number.isInteger(i)&&i>=0&&i<n;
const stripText=(s,max)=>{
  if(typeof s!=='string')throw new Error('Count note must be text.');
  const t=s.replace(/[\u0000-\u001f\u007f]/g,'').trim();
  if(t.length>max)throw new Error('Count note too long (120 characters maximum).');
  return t;
};
export function starterPro(){
  return normalizePro({schema:PRO_SCHEMA,timeline:starterTimeline(),countNotes:[]});
}
export function wrapTimeline(r9){
  return normalizePro({schema:PRO_SCHEMA,timeline:normalizeTimeline(r9),countNotes:[]});
}
export function normalizePro(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schema!==PRO_SCHEMA)
    throw new Error('Unsupported Timeline Pro schema.');
  const timeline=normalizeTimeline(raw.timeline);
  if(!Array.isArray(raw.countNotes)||raw.countNotes.length>MAX_COUNT_NOTES)
    throw new Error('Count note limit exceeded (96).');
  const sections=timelineRows(timeline),isChart=timeline.show.source.kind==='chart',seen=new Set();
  const countNotes=raw.countNotes.map(item=>{
    if(!item||typeof item!=='object'||Array.isArray(item)
      ||!validIndex(item.segment,sections.length)
      ||!validIndex(item.beat,isChart?8:sections[item.segment].counts))
      throw new Error('Invalid per-count note position.');
    const text=stripText(item.text,120);
    if(!text)throw new Error('Empty per-count notes should be deleted.');
    const key=item.segment+':'+item.beat;
    if(seen.has(key))throw new Error('Duplicate per-count note.');
    seen.add(key);
    return {segment:item.segment,beat:item.beat,text};
  }).sort((a,b)=>a.segment-b.segment||a.beat-b.beat);
  return {schema:PRO_SCHEMA,timeline,countNotes};
}
export function encodePro(raw){return JSON.stringify(normalizePro(raw),null,2)+'\n';}
export function parsePro(json){
  if(typeof json!=='string'||new TextEncoder().encode(json).byteLength>PRO_MAX_BYTES)
    throw new Error('Timeline Pro JSON must be below 128 KiB.');
  let input;try{input=JSON.parse(json);}catch{throw new Error('Invalid Timeline Pro JSON.');}
  return normalizePro(input);
}
export function updateCountNote(raw,segment,beat,value){
  const p=normalizePro(raw),sections=timelineRows(p.timeline),chart=p.timeline.show.source.kind==='chart';
  if(!validIndex(segment,sections.length)||!validIndex(beat,chart?8:sections[segment].counts))
    throw new Error('Count note position is out of range.');
  const text=stripText(value,120);
  const countNotes=p.countNotes.filter(n=>n.segment!==segment||n.beat!==beat);
  if(text)countNotes.push({segment,beat,text});
  return normalizePro({...p,countNotes});
}
export function editProPhrase(raw,index,operation,options={}){
  const p=normalizePro(raw);
  const next=editPhrase(p.timeline,index,operation,options);
  let notes=p.countNotes;
  const count=timelineRows(p.timeline).length;
  if(operation==='move'){
    const dst=index+options.direction;
    if(validIndex(dst,count)){
      notes=notes.map(n=>({...n,segment:n.segment===index?dst:n.segment===dst?index:n.segment}));
    }
  }else if(operation==='duplicate'||operation==='add'){
    notes=notes.map(n=>({...n,segment:n.segment>index?n.segment+1:n.segment}));
    // A duplicated phrase deliberately does not duplicate private notes.
  }else if(operation==='delete'){
    notes=notes.filter(n=>n.segment!==index)
      .map(n=>({...n,segment:n.segment>index?n.segment-1:n.segment}));
  }
  return normalizePro({...p,timeline:next,countNotes:notes});
}
export function editProCount(raw,segment,beat,change){
  const p=normalizePro(raw);
  return normalizePro({...p,timeline:editCount(p.timeline,segment,beat,change)});
}
export function updateProStage(raw,segment,stage){
  const p=normalizePro(raw);
  return normalizePro({...p,timeline:updateStage(p.timeline,segment,stage)});
}
export function updateProSectionNote(raw,segment,text){
  const p=normalizePro(raw);
  return normalizePro({...p,timeline:updateNote(p.timeline,segment,text)});
}
export function proRows(raw){
  const p=normalizePro(raw),chart=p.timeline.show.source.kind==='chart';
  return timelineRows(p.timeline).map(s=>({...s,countNotes:p.countNotes.filter(n=>n.segment===s.index),
    noteCount:p.countNotes.filter(n=>n.segment===s.index).length,
    noteSlots:chart?8:s.counts}));
}
export function proCueSheet(raw){
  const p=normalizePro(raw),rows=proRows(p);
  const lines=[timelineCueSheet(p.timeline).trimEnd(),'',
    'PER-COUNT ANNOTATIONS (AUTHORED, UNVERIFIED)'];
  if(!p.countNotes.length)lines.push('(No per-count annotations.)');
  for(const row of rows)for(const n of row.countNotes){
    const local=row.phrase?'EIGHT-COUNT SLOT '+(n.beat+1):'LOCAL COUNT '+(n.beat+1);
    lines.push('SECTION '+(row.index+1)+' / '+local+' / '+row.label+': '+n.text);
  }
  lines.push('R2 repeat notes refer to an eight-count slot and apply to every repeat.');
  lines.push('No audio, body tracking, recorded performance or automatic beat analysis.');
  return lines.join('\n')+'\n';
}
/** Strict 40-step undo/redo, with no browser storage or cross-file history. */
export function createHistory(raw=starterPro()){
  return {past:[],present:normalizePro(raw),future:[]};
}
export function commitHistory(history,raw){
  const next=normalizePro(raw);
  if(JSON.stringify(history.present)===JSON.stringify(next))return history;
  return {past:[...history.past,history.present].slice(-HISTORY_LIMIT),present:next,future:[]};
}
export function undoHistory(history){
  if(!history.past.length)return history;
  return {past:history.past.slice(0,-1),present:history.past.at(-1),
    future:[history.present,...history.future].slice(0,HISTORY_LIMIT)};
}
export function redoHistory(history){
  if(!history.future.length)return history;
  return {past:[...history.past,history.present].slice(-HISTORY_LIMIT),
    present:history.future[0],future:history.future.slice(1)};
}
