import {starterWorkout,normalizeWorkout,buildWorkout,workoutCue} from './dance-workout.mjs';
import {normalizeChart,totalCounts,cueForCount} from './choreo-model.mjs';
import {danceMove} from './dance-core.mjs';
import {LESSONS} from './dance-academy.mjs';
import {sampleDirectedPose} from './dance-director.mjs';

/**
 * DanceFlow R7: authored choreography rendered on a virtual stage.
 * Light scenes, camera framing and pose samples are DISPLAY ONLY.
 * No actual dancer/camera/motion data are read, stored or inferred.
 */
export const SHOW_SCHEMA='pulse369.dance-performance.v1';
export const SHOW_MAX_BYTES=131072;
export const STAGES=Object.freeze({
  neon:{name:'NEON ROYAL',caption:'Violet + electric aqua',accent:'#aa85ff',secondary:'#5fe8ef'},
  aurora:{name:'AURORA FLOOR',caption:'Teal + lime canopy',accent:'#6ce8bc',secondary:'#c7f876'},
  ember:{name:'AMBER GROOVE',caption:'Copper + pink wash',accent:'#ffa978',secondary:'#ff8dc9'},
  twilight:{name:'TWILIGHT CALM',caption:'Soft indigo + blue',accent:'#aab5ff',secondary:'#92dcfb'}
});
export const FRAMES=Object.freeze(['wide','medium']);
export const EXPRESSIONS=Object.freeze(['subtle','showtime']);
const ensureText=(text,max,label)=>{
  if(typeof text!=='string')throw new Error(label+' must be text.');
  const clean=text.replace(/[\u0000-\u001f\u007f]/g,'').trim();
  if(!clean||clean.length>max)throw new Error(label+' must be 1–'+max+' characters.');
  return clean;
};
const sources=Object.freeze(['workout','chart']);
const isStage=t=>Object.hasOwn(STAGES,t);
function normalizedSource(source){
  if(!source||typeof source!=='object'||Array.isArray(source)||!sources.includes(source.kind))
    throw new Error('Choose a supported Workout or Choreography source.');
  return {kind:source.kind,data:source.kind==='workout'
    ? normalizeWorkout(source.data):normalizeChart(source.data)};
}
function timelineFor(source){
  if(source.kind==='workout'){
    const workout=buildWorkout(source.data);
    return {segments:workout.segments.map(s=>({
      start:s.start,end:s.end,kind:s.kind,label:s.label,
      style:s.kind==='dance'?LESSONS[s.id].style:'gentle'
    })),totalCounts:workout.totalCounts,workout};
  }
  let at=0;
  const segments=source.data.phrases.map((phrase,i)=>{
    const length=phrase.repeat*8;
    const segment={
      start:at,end:at+length,kind:'phrase',label:phrase.name,
      style:phrase.steps[0].style,phraseIndex:i
    };
    at+=length;return segment;
  });
  return {segments,totalCounts:totalCounts(source.data),workout:null};
}
export function starterShow(){
  return {
    schema:SHOW_SCHEMA,title:'THE DANCE FLOOR SHOW',
    source:{kind:'workout',data:starterWorkout()},
    settings:{defaultStage:'neon',frame:'wide',expression:'showtime',reducedMotion:false},
    overrides:[]
  };
}
export function normalizeShow(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.schema!==SHOW_SCHEMA)
    throw new Error('Unsupported performance show format.');
  const title=ensureText(raw.title,64,'Show title');
  const source=normalizedSource(raw.source);
  const settings=raw.settings;
  if(!settings||typeof settings!=='object'||Array.isArray(settings)
    ||!isStage(settings.defaultStage)||!FRAMES.includes(settings.frame)
    ||!EXPRESSIONS.includes(settings.expression)||typeof settings.reducedMotion!=='boolean')
    throw new Error('Invalid stage settings.');
  const {segments}=timelineFor(source);
  if(!Array.isArray(raw.overrides)||raw.overrides.length>segments.length)
    throw new Error('Invalid number of scene overrides.');
  const seen=new Set();
  const overrides=raw.overrides.map(item=>{
    if(!item||!Number.isInteger(item.segment)||item.segment<0||item.segment>=segments.length
      ||!isStage(item.stage)||seen.has(item.segment))
      throw new Error('Invalid scene override.');
    seen.add(item.segment);
    return {segment:item.segment,stage:item.stage};
  }).sort((a,b)=>a.segment-b.segment);
  return {schema:SHOW_SCHEMA,title,source,settings:{
    defaultStage:settings.defaultStage,frame:settings.frame,
    expression:settings.expression,reducedMotion:settings.reducedMotion
  },overrides};
}
export function encodeShow(raw){return JSON.stringify(normalizeShow(raw),null,2)+'\n';}
export function parseShow(json){
  if(typeof json!=='string'||new TextEncoder().encode(json).byteLength>SHOW_MAX_BYTES)
    throw new Error('Performance JSON must be under 128 KiB.');
  let raw;try{raw=JSON.parse(json);}catch{throw new Error('Invalid performance JSON.');}
  return normalizeShow(raw);
}
export function replaceSource(raw,kind,data){
  const show=normalizeShow(raw);
  return normalizeShow({...show,source:{kind,data},overrides:[]});
}
export function changeScene(raw,segment,stage){
  const show=normalizeShow(raw);
  const {segments}=timelineFor(show.source);
  if(!Number.isInteger(segment)||segment<0||segment>=segments.length||!isStage(stage))
    throw new Error('Invalid scene selection.');
  const overrides=show.overrides.filter(o=>o.segment!==segment);
  if(stage!==show.settings.defaultStage)overrides.push({segment,stage});
  return normalizeShow({...show,overrides});
}
export function buildShow(raw){
  const show=normalizeShow(raw);
  const timeline=timelineFor(show.source);
  const bpm=show.source.data.bpm;
  const offsetMs=show.source.data.offsetMs;
  return {
    ...timeline,show,bpm,offsetMs,
    durationSeconds:timeline.totalCounts*60/bpm,
    segments:timeline.segments.map((s,index)=>({
      ...s,index,
      stage:show.overrides.find(o=>o.segment===index)?.stage||show.settings.defaultStage
    }))
  };
}
export function showCue(plan,index){
  if(!plan||!Number.isInteger(index)||index<0||index>=plan.totalCounts)return null;
  const segment=plan.segments.find(s=>index>=s.start&&index<s.end);
  if(!segment)return null;
  let cue;
  if(plan.show.source.kind==='chart'){
    cue=cueForCount(plan.show.source.data,index);
  }else{
    const instructional=workoutCue(plan.workout,index);
    if(segment.kind==='dance'){
      const style=LESSONS[plan.workout.segments[segment.index].id].style;
      const move=danceMove(style,(index-segment.start)%8);
      cue={...move,style};
    }else{
      cue={
        name:instructional.name,
        coach:instructional.instruction,style:'gentle',
        hands:[{side:'left',x:-.24,y:-.15,z:-.52},{side:'right',x:.24,y:-.15,z:-.52}]
      };
    }
  }
  return {...cue,
    sectionIndex:segment.index,sectionName:segment.label,sectionKind:segment.kind,
    stage:segment.stage,countInEight:(index-segment.start)%8+1,
    globalCount:index+1};
}
export function showSceneAt(plan,index){
  if(!plan||!Number.isInteger(index)||index<0||index>=plan.totalCounts)return null;
  const s=plan.segments.find(segment=>index>=segment.start&&index<segment.end);
  const next=plan.segments[s.index+1];
  return {index:s.index,label:s.label,kind:s.kind,theme:s.stage,
    palette:STAGES[s.stage],remaining:s.end-index,
    next:next&&s.end-index<=8?{label:next.label,inCounts:s.end-index,stage:next.stage}:null};
}
export function sampleShow(plan,beats){
  if(!plan)return null;
  const normalized=Math.max(0,Number.isFinite(beats)?beats:0);
  const index=Math.floor(normalized);
  const cue=showCue(plan,index);
  if(!cue)return null;
  const scene=showSceneAt(plan,index);
  const pose=sampleDirectedPose(i=>showCue(plan,i),normalized,{
    expression:plan.show.settings.expression,
    reducedMotion:plan.show.settings.reducedMotion
  });
  // Gentle, clamped visual breathing with no flashes or rapid color changes.
  const lightEnergy=plan.show.settings.reducedMotion?0:.055*(1+Math.cos(normalized*2*Math.PI))*.5;
  return {index,pose,cue,scene,lightEnergy,progress:(normalized+1)/plan.totalCounts};
}
export function performanceTrackError(plan,duration){
  if(!plan)return 'Choose a show.';
  const needed=plan.durationSeconds+plan.offsetMs/1000+.5;
  if(!Number.isFinite(duration)||duration<needed)
    return 'This local song is too short. Need at least '+Math.ceil(needed)+' seconds, including the beat offset.';
  return null;
}
export function showReceipt(plan,counts,audioMode){
  const shown=Number.isInteger(counts)?Math.max(0,Math.min(plan?.totalCounts||0,counts)):0;
  return {
    schema:'pulse369.dance-performance-receipt.v1',
    provenance:'SCREEN_DEMONSTRATION_UNVERIFIED',
    source:plan?.show.source.kind||'unknown',
    manualBpm:plan?.bpm||null,
    sections:plan?.segments.length||0,
    displayedCounts:shown,
    musicMode:audioMode==='local'?'local-audio-not-uploaded':'synthesized-guide',
    limits:'Only staged choreography was displayed. No live dancer, camera, bodily movement, dance quality, fitness or song information was recorded.'
  };
}
