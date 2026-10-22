/**
 * R8 Show Runner. Strictly visual stage presets, printable cue sheets and
 * deterministic rehearsal cue points. No sensors, music or private data.
 */
import {STAGES,FRAMES,EXPRESSIONS,normalizeShow,buildShow} from './dance-performance.mjs';
export const PRESET_SCHEMA='pulse369.stage-preset.v1';
export const MAX_PRESET_BYTES=8192;
const THEMES=Object.freeze(Object.keys(STAGES));
export const BUILTIN_PRESETS=Object.freeze({
  royal:{name:'NEON ROYAL LIVE',description:'Colorful alternation with bold choreography.',pattern:['neon','aurora','ember'],frame:'wide',expression:'showtime',reducedMotion:false},
  mellow:{name:'TWILIGHT SESSIONS',description:'Soft contrast and subtle dancing.',pattern:['twilight','aurora'],frame:'medium',expression:'subtle',reducedMotion:true},
  sunset:{name:'AMBER HOUSE PARTY',description:'Warm copper and rhythmic teal.',pattern:['ember','neon','aurora'],frame:'wide',expression:'showtime',reducedMotion:false}
});
const clean=(value,max,label)=>{
  if(typeof value!=='string')throw new Error(label+' must be a string.');
  const v=value.replace(/[\u0000-\u001f\u007f]/g,'').trim();
  if(!v||v.length>max)throw new Error(label+' must contain 1–'+max+' characters.');
  return v;
};
export function normalizePreset(raw){
  if(!raw||Array.isArray(raw)||typeof raw!=='object'||raw.schema!==PRESET_SCHEMA)
    throw new Error('Unsupported stage preset schema.');
  const name=clean(raw.name,48,'Preset name');
  if(!Array.isArray(raw.pattern)||raw.pattern.length<1||raw.pattern.length>32
     ||!raw.pattern.every(t=>THEMES.includes(t)))throw new Error('Invalid stage pattern.');
  if(!FRAMES.includes(raw.frame)||!EXPRESSIONS.includes(raw.expression)
    ||typeof raw.reducedMotion!=='boolean')throw new Error('Invalid preset display settings.');
  return {schema:PRESET_SCHEMA,name,pattern:[...raw.pattern],frame:raw.frame,
    expression:raw.expression,reducedMotion:raw.reducedMotion};
}
export function builtInPreset(id){
  if(!Object.hasOwn(BUILTIN_PRESETS,id))throw new Error('Unknown built-in preset.');
  return normalizePreset({schema:PRESET_SCHEMA,...BUILTIN_PRESETS[id]});
}
export function capturePreset(rawShow,name){
  const show=normalizeShow(rawShow),plan=buildShow(show);
  return normalizePreset({
    schema:PRESET_SCHEMA,name,
    pattern:plan.segments.map(s=>s.stage).slice(0,32),
    frame:show.settings.frame,expression:show.settings.expression,
    reducedMotion:show.settings.reducedMotion
  });
}
export function applyPreset(rawShow,rawPreset){
  const show=normalizeShow(rawShow),p=normalizePreset(rawPreset);
  const segmentCount=buildShow(show).segments.length;
  const first=p.pattern[0];
  const overrides=Array.from({length:segmentCount},(_,i)=>({segment:i,stage:p.pattern[i%p.pattern.length]}))
    .filter(({stage})=>stage!==first);
  return normalizeShow({...show,
    settings:{defaultStage:first,frame:p.frame,expression:p.expression,reducedMotion:p.reducedMotion},
    overrides});
}
export function encodePreset(input){return JSON.stringify(normalizePreset(input),null,2)+'\n';}
export function parsePreset(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>MAX_PRESET_BYTES)
    throw new Error('Stage preset must be JSON under 8 KiB.');
  let value;try{value=JSON.parse(text);}catch{throw new Error('Invalid stage preset JSON.');}
  return normalizePreset(value);
}
export function cueSheetRows(rawShow){
  const plan=buildShow(rawShow),beatSeconds=60/plan.bpm;
  return plan.segments.map((s,i)=>({
    number:i+1,
    count:s.start+1,
    endCount:s.end,
    startSeconds:s.start*beatSeconds,
    endSeconds:s.end*beatSeconds,
    atSeconds:s.start*beatSeconds+plan.offsetMs/1000,
    section:s.label,
    kind:s.kind,
    stage:s.stage,
    stageName:STAGES[s.stage].name,
    direction:i===0?'SHOW START':i===plan.segments.length-1?'FINAL SECTION':'CROSS TO NEXT SECTION'
  }));
}
export function cueSheetText(rawShow){
  const show=normalizeShow(rawShow),plan=buildShow(show);
  const stamp=seconds=>{
    const m=Math.floor(seconds/60),s=(seconds-m*60).toFixed(2).padStart(5,'0');
    return String(m).padStart(2,'0')+':'+s;
  };
  const lines=[
    'PULSE369 · R8 SHOW RUNNER CUE SHEET',
    'SHOW: '+show.title,'SOURCE: '+show.source.kind.toUpperCase(),
    'MANUAL BPM: '+plan.bpm,'MANUAL BEAT OFFSET: '+plan.offsetMs+' ms',
    'TOTAL COUNTS: '+plan.totalCounts,'SECTIONS: '+plan.segments.length,
    'All times are relative to the local music start (or guide start); no automatic beat detection.',
    'Procedural stage directions only. No camera, dancer tracking or fitness measurement.',
    '',
    'NO. | SONG TIME | COUNTS | SECTION | STAGE | DIRECTOR NOTE'
  ];
  for(const row of cueSheetRows(show)){
    lines.push(String(row.number).padStart(2,'0')+' | '+stamp(row.atSeconds)+' | '+
      String(row.count).padStart(4,' ')+'-'+String(row.endCount).padEnd(4,' ')+
      ' | '+row.section+' | '+row.stageName+' | '+row.direction);
  }
  return lines.join('\n')+'\n';
}
/**
 * Start at count 0 with the original music intro. If starting at a later
 * section, seek local music to that beat position; do NOT replay the intro.
 * ctx.currentTime and the audio buffer share the same clock, so suspend/
 * resume pauses both without a separate Date.now() drift source.
 */
export function rehearsalStart(rawShow,segmentIndex=0,source='guide'){
  const plan=buildShow(rawShow);
  if(!Number.isInteger(segmentIndex)||segmentIndex<0||segmentIndex>=plan.segments.length)
    throw new Error('Unknown section cue.');
  if(!['guide','local'].includes(source))throw new Error('Unknown rehearsal audio source.');
  const count=plan.segments[segmentIndex].start;
  const audioSeconds=source==='local'
    ?(segmentIndex===0?0:plan.offsetMs/1000+count*60/plan.bpm):null;
  const leadInSeconds=source==='local'&&segmentIndex===0?plan.offsetMs/1000:0;
  return {segmentIndex,count,leadInSeconds,audioSeconds,beatSeconds:60/plan.bpm,
    remainingCounts:plan.totalCounts-count};
}
