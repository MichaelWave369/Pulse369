import {
  starterShow,normalizeShow,buildShow,changeScene
} from './dance-performance.mjs';
import {
  STYLES,phraseFromStyle,replaceStep,makeStep
} from './choreo-model.mjs';

/**
 * R9 timeline is a LOCAL editing document around a complete R7 show.
 * R7/R2/R6 formats are untouched. Dance movements here are authored
 * illustrative gestures and never inferred from human motion.
 */
export const TIMELINE_SCHEMA='pulse369.dance-timeline.v1';
export const TIMELINE_MAX_BYTES=131072;
const clean=(v,max,label,allowEmpty=false)=>{
  if(typeof v!=='string')throw new Error(label+' must be text.');
  const s=v.replace(/[\u0000-\u001f\u007f]/g,'').trim();
  if(s.length>max||(!allowEmpty&&!s.length))throw new Error(label+' exceeds allowed length.');
  return s;
};
const INDEX=(n,max)=>Number.isInteger(n)&&n>=0&&n<max;
const stageList=plan=>plan.segments.map(s=>s.stage);
const sectionCount=show=>buildShow(show).segments.length;
function overrideStages(show,stages){
  if(stages.length!==sectionCount(show))throw new Error('Stage map does not match source.');
  const {defaultStage}=show.settings;
  return normalizeShow({...show,overrides:stages.flatMap((stage,index)=>
    stage===defaultStage?[]:[{segment:index,stage}])});
}
function remapNotes(notes,map){
  return notes.flatMap(note=>{
    const next=map.indexOf(note.segment);
    return next<0?[]:[{segment:next,text:note.text}];
  }).sort((a,b)=>a.segment-b.segment);
}
export function starterTimeline(){
  return normalizeTimeline({schema:TIMELINE_SCHEMA,show:starterShow(),notes:[]});
}
export function normalizeTimeline(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schema!==TIMELINE_SCHEMA)
    throw new Error('Unsupported DanceFlow timeline schema.');
  const show=normalizeShow(raw.show);
  const count=sectionCount(show);
  if(!Array.isArray(raw.notes)||raw.notes.length>count)throw new Error('Invalid director notes.');
  const found=new Set();
  const notes=raw.notes.map(note=>{
    if(!note||typeof note!=='object'||Array.isArray(note)
      ||!INDEX(note.segment,count)||found.has(note.segment))throw new Error('Invalid note section.');
    found.add(note.segment);
    return {segment:note.segment,text:clean(note.text,240,'Director note')};
  }).sort((a,b)=>a.segment-b.segment);
  return {schema:TIMELINE_SCHEMA,show,notes};
}
export function encodeTimeline(raw){return JSON.stringify(normalizeTimeline(raw),null,2)+'\n';}
export function parseTimeline(json){
  if(typeof json!=='string'||new TextEncoder().encode(json).byteLength>TIMELINE_MAX_BYTES)
    throw new Error('Timeline JSON exceeds 128 KiB.');
  let raw;try{raw=JSON.parse(json);}catch{throw new Error('Invalid timeline JSON.');}
  return normalizeTimeline(raw);
}
export function timelineFromSource(raw){
  if(raw?.schema===TIMELINE_SCHEMA)return normalizeTimeline(raw);
  if(raw?.schema==='pulse369.dance-performance.v1')
    return normalizeTimeline({schema:TIMELINE_SCHEMA,show:raw,notes:[]});
  throw new Error('Load a validated R7 show or an R9 timeline.');
}
export function updateNote(raw,segment,value){
  const t=normalizeTimeline(raw),count=sectionCount(t.show);
  if(!INDEX(segment,count))throw new Error('Unknown segment.');
  const text=clean(value,240,'Director note',true);
  const notes=t.notes.filter(n=>n.segment!==segment);
  if(text)notes.push({segment,text});
  return normalizeTimeline({...t,notes});
}
export function updateStage(raw,segment,stage){
  const t=normalizeTimeline(raw);
  return normalizeTimeline({...t,show:changeScene(t.show,segment,stage)});
}
export function editPhrase(raw,index,operation,options={}){
  const t=normalizeTimeline(raw);
  if(t.show.source.kind!=='chart')throw new Error('Phrase editing requires an R2 chart.');
  const chart=t.show.source.data,phrases=chart.phrases;
  if(!INDEX(index,phrases.length))throw new Error('Unknown phrase.');
  const oldStages=stageList(buildShow(t.show));
  const ids=phrases.map((_,i)=>i);
  let result=[...phrases],stages=[...oldStages],notes=[...t.notes];
  if(operation==='move'){
    const delta=options.direction;
    if(![-1,1].includes(delta))throw new Error('Direction must be -1 or 1.');
    const next=index+delta;
    if(!INDEX(next,phrases.length))return t;
    [result[index],result[next]]=[result[next],result[index]];
    [stages[index],stages[next]]=[stages[next],stages[index]];
    [ids[index],ids[next]]=[ids[next],ids[index]];
    notes=remapNotes(notes,ids);
  }else if(operation==='duplicate'){
    if(phrases.length>=16)throw new Error('Maximum sixteen phrases.');
    const copy=structuredClone(phrases[index]);
    copy.name=(copy.name.slice(0,34)+' COPY').slice(0,40);
    result.splice(index+1,0,copy);
    stages.splice(index+1,0,stages[index]);
    ids.splice(index+1,0,-1); // A new phrase starts without a note.
    notes=remapNotes(notes,ids);
  }else if(operation==='delete'){
    if(phrases.length===1)throw new Error('Keep at least one phrase.');
    result.splice(index,1);stages.splice(index,1);ids.splice(index,1);
    notes=remapNotes(notes,ids);
  }else if(operation==='add'){
    if(phrases.length>=16)throw new Error('Maximum sixteen phrases.');
    if(!STYLES.includes(options.style))throw new Error('Unknown phrase style.');
    result.splice(index+1,0,phraseFromStyle(options.style,'NEW '+options.style.toUpperCase(),1));
    stages.splice(index+1,0,t.show.settings.defaultStage);
    ids.splice(index+1,0,-1);
    notes=remapNotes(notes,ids);
  }else if(operation==='style'){
    if(!STYLES.includes(options.style))throw new Error('Unknown phrase style.');
    result[index]={...phrases[index],steps:phraseFromStyle(options.style).steps};
  }else if(operation==='rename'){
    result[index]={...phrases[index],name:clean(options.name,40,'Phrase name')};
  }else if(operation==='repeat'){
    if(!Number.isInteger(options.repeat)||options.repeat<1||options.repeat>4)
      throw new Error('Phrase repeats must be 1–4.');
    result[index]={...phrases[index],repeat:options.repeat};
  }else throw new Error('Unknown phrase operation.');
  let show=normalizeShow({...t.show,source:{kind:'chart',data:{...chart,phrases:result}},overrides:[]});
  show=overrideStages(show,stages);
  return normalizeTimeline({...t,show,notes});
}
export function editCount(raw,phraseIndex,beatIndex,change){
  const t=normalizeTimeline(raw);
  if(t.show.source.kind!=='chart')throw new Error('Count editing requires an R2 chart.');
  const chart=t.show.source.data;
  if(!INDEX(phraseIndex,chart.phrases.length)||!INDEX(beatIndex,8))
    throw new Error('Invalid count selection.');
  const previous=chart.phrases[phraseIndex].steps[beatIndex];
  const step=makeStep(change.style??previous.style,change.moveIndex??previous.moveIndex,
    change.mirror??previous.mirror);
  return normalizeTimeline({...t,show:{...t.show,source:{kind:'chart',
    data:replaceStep(chart,phraseIndex,beatIndex,step)}}});
}
export function timelineRows(raw){
  const t=normalizeTimeline(raw),plan=buildShow(t.show);
  return plan.segments.map(s=>({
    index:s.index,start:s.start,end:s.end,counts:s.end-s.start,
    startSeconds:s.start*60/plan.bpm+plan.offsetMs/1000,
    durationSeconds:(s.end-s.start)*60/plan.bpm,
    label:s.label,kind:s.kind,stage:s.stage,
    note:t.notes.find(n=>n.segment===s.index)?.text||'',
    phrase:t.show.source.kind==='chart'?t.show.source.data.phrases[s.index]:null
  }));
}
export function timelineCueSheet(raw){
  const t=normalizeTimeline(raw);
  const plan=buildShow(t.show),rows=timelineRows(t);
  const lines=[
    'PULSE369 R9 / DIRECTOR TIMELINE',
    'SHOW: '+t.show.title,
    'SOURCE: '+t.show.source.kind.toUpperCase(),
    'MANUAL BPM: '+plan.bpm+' | OFFSET: '+plan.offsetMs+' ms',
    'RELATIVE CLOCK · NO AUDIO ANALYSIS OR MOVEMENT TRACKING','',
    'CUE | TIME (S) | COUNTS | SECTION | STAGE | DIRECTOR NOTE'
  ];
  for(const r of rows)lines.push(
    String(r.index+1).padStart(2,'0')+' | '+r.startSeconds.toFixed(2).padStart(7,' ')+' | '+
    (r.start+1)+'-'+r.end+' | '+r.label+' | '+r.stage+' | '+(r.note||'(none)')
  );
  return lines.join('\n')+'\n';
}
