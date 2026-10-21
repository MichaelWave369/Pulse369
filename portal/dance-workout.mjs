import {LESSONS,LESSON_IDS} from './dance-academy.mjs';
import {normalizeChart,phraseFromStyle} from './choreo-model.mjs';

/**
 * DanceFlow R6: screen-only lesson sequencing and interval scheduling.
 * Not a physiological intensity estimate, validated workout or foot tracking.
 */
export const WORKOUT_SCHEMA='pulse369.dance-workout.v1';
export const WORKOUT_MINUTES=Object.freeze([6,9,12]);
export const WORKOUT_BPM=Object.freeze([80,96,112]);
export const WORKOUT_PACES=Object.freeze(['easy','steady']);
export const MAX_PLAYLIST=6;
export const MAX_RECIPE_BYTES=16384;
const NEUTRAL_FEET=Object.freeze({left:{x:-.22,z:0},right:{x:.22,z:0}});
const text=(v,max,label)=>{
  if(typeof v!=='string')throw new Error(label+' must be text.');
  const cleaned=v.replace(/[\u0000-\u001f\u007f]/g,'').trim();
  if(!cleaned||cleaned.length>max)throw new Error(label+' must be 1–'+max+' characters.');
  return cleaned;
};
export function starterWorkout(){
  return {schema:WORKOUT_SCHEMA,title:'DANCE FLOOR MIX',bpm:96,minutes:6,
    pace:'easy',posture:'standing',offsetMs:0,playlist:['house','funk','disco']};
}
export function normalizeWorkout(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Workout must be an object.');
  if(raw.schema!==WORKOUT_SCHEMA)throw new Error('Unsupported workout schema.');
  const title=text(raw.title,60,'Workout name');
  if(!WORKOUT_BPM.includes(raw.bpm))throw new Error('Unsupported BPM.');
  if(!WORKOUT_MINUTES.includes(raw.minutes))throw new Error('Unsupported duration.');
  if(!WORKOUT_PACES.includes(raw.pace))throw new Error('Unsupported movement option.');
  if(!['standing','seated'].includes(raw.posture))throw new Error('Unsupported movement version.');
  if(!Number.isInteger(raw.offsetMs)||raw.offsetMs<0||raw.offsetMs>1000)throw new Error('Beat offset must be 0–1000 ms.');
  if(!Array.isArray(raw.playlist)||raw.playlist.length<1||raw.playlist.length>MAX_PLAYLIST)
    throw new Error('Playlist must contain 1–6 lessons.');
  const playlist=raw.playlist.map((id,i)=>{
    if(!LESSON_IDS.includes(id))throw new Error('Unsupported lesson at slot '+(i+1)+'.');
    return id;
  });
  // Explicitly discard unknown/private fields rather than spreading untrusted JSON.
  return {schema:WORKOUT_SCHEMA,title,bpm:raw.bpm,minutes:raw.minutes,
    pace:raw.pace,posture:raw.posture,offsetMs:raw.offsetMs,playlist};
}
export function encodeWorkout(raw){
  return JSON.stringify(normalizeWorkout(raw),null,2)+'\n';
}
export function parseWorkout(json){
  if(typeof json!=='string'||new TextEncoder().encode(json).byteLength>MAX_RECIPE_BYTES)
    throw new Error('Workout JSON must be under 16 KiB.');
  let raw;try{raw=JSON.parse(json);}catch{throw new Error('Invalid workout JSON.');}
  return normalizeWorkout(raw);
}
export function editPlaylist(raw,{type,index,lesson,direction}){
  const plan=normalizeWorkout(raw);
  const p=[...plan.playlist];
  if(!['add','remove','move','replace'].includes(type))throw new Error('Unknown playlist operation.');
  if(!Number.isInteger(index)||index<0||index>=p.length)throw new Error('Invalid playlist index.');
  if(type==='add'){
    if(p.length>=MAX_PLAYLIST)throw new Error('Maximum six lesson sections.');
    if(!LESSON_IDS.includes(lesson))throw new Error('Unknown lesson.');
    p.splice(index+1,0,lesson);
  }else if(type==='remove'){
    if(p.length===1)throw new Error('Keep at least one dance section.');
    p.splice(index,1);
  }else if(type==='replace'){
    if(!LESSON_IDS.includes(lesson))throw new Error('Unknown lesson.');
    p[index]=lesson;
  }else{
    if(![-1,1].includes(direction))throw new Error('Invalid movement direction.');
    const next=index+direction;
    if(next<0||next>=p.length)return plan;
    [p[index],p[next]]=[p[next],p[index]];
  }
  return normalizeWorkout({...plan,playlist:p});
}
export function buildWorkout(raw){
  const recipe=normalizeWorkout(raw);
  const totalCounts=Math.round(recipe.minutes*recipe.bpm/8)*8;
  const segments=[];
  let cursor=0;
  const add=(kind,counts,id=null,slot=null)=>{
    if(counts<=0||counts%8!==0)throw new Error('Invalid segment length.');
    const item={kind,id,slot,counts,start:cursor,end:cursor+counts,
      label:kind==='dance'?LESSONS[id].name:kind==='warmup'?'WARM UP':kind==='recovery'?'EASY RECOVERY':'COOL DOWN'};
    cursor+=counts;segments.push(item);
  };
  const warmup=32,cooldown=32;
  add('warmup',warmup);
  let remaining=totalCounts-warmup-cooldown,rounds=0,consecutive=0;
  while(remaining>0){
    const counts=Math.min(32,remaining);
    const slot=rounds%recipe.playlist.length;
    add('dance',counts,recipe.playlist[slot],slot);
    rounds++;consecutive++;remaining-=counts;
    // Add a recovery only if there is room for another full section after it.
    if(consecutive===2&&remaining>=48){
      add('recovery',16);remaining-=16;consecutive=0;
    }
  }
  add('cooldown',cooldown);
  if(cursor!==totalCounts)throw new Error('Workout timeline did not close.');
  return {recipe,totalCounts,durationSeconds:totalCounts*60/recipe.bpm,
    segments,sectionCount:rounds,recoveryCount:segments.filter(s=>s.kind==='recovery').length};
}
export function workoutCue(plan,count){
  if(!plan||!Number.isInteger(count)||count<0||count>=plan.totalCounts)return null;
  const segment=plan.segments.find(s=>count>=s.start&&count<s.end);
  if(!segment)return null;
  const local=count-segment.start;
  const active=segment.kind==='dance';
  const lesson=active?LESSONS[segment.id]:null;
  const step=lesson?.counts[local%8];
  const seated=plan.recipe.posture==='seated';
  const instruction=active?
    seated?step.seated:step.standing:
    segment.kind==='recovery'?
      'Take a comfortable recovery break. Relax your arms and breathe naturally; remain seated if you prefer.':
    segment.kind==='warmup'?
      'Ease into the rhythm. A gentle arm sway or watching is enough.':
      'Ease the movement down. Relax your shoulders and finish at your own pace.';
  return {
    count,countWithinEight:local%8+1,kind:segment.kind,label:segment.label,
    name:active?step.label:segment.kind==='recovery'?'TAKE A BREATHER':segment.label,
    instruction,tip:active?step.tip:'Do not hold your breath or push through discomfort.',
    feet:active&&!seated?step.feet:NEUTRAL_FEET,focus:active?step.focus:'both',
    seated,illustrationOnly:true,pace:plan.recipe.pace,
    slot:segment.slot,segmentStart:segment.start,segmentEnd:segment.end,
    sectionProgress:(local+1)/segment.counts,progress:(count+1)/plan.totalCounts
  };
}
export function nextSection(plan,count){
  if(!plan||!Number.isInteger(count)||count<0||count>=plan.totalCounts)return null;
  const segment=plan.segments.find(s=>count>=s.start&&count<s.end);
  const next=plan.segments.find(s=>s.start===segment.end);
  if(!next)return null;
  const left=segment.end-count-1;
  return left<8?{inCounts:left+1,label:next.label,kind:next.kind}:null;
}
export function workoutTrackError(plan,durationSeconds){
  if(!plan)return 'Choose a valid workout.';
  const required=plan.durationSeconds+plan.recipe.offsetMs/1000+.5;
  return Number.isFinite(durationSeconds)&&durationSeconds>=required?null:
    'Track is too short. Use at least '+Math.ceil(required)+' seconds of downloaded audio or the synthesized beat.';
}
export function workoutChoreoChart(raw){
  const recipe=normalizeWorkout(raw);
  // Portable R2 chart v1 can carry only the eight authored HAND cues per lesson,
  // not footwork, seated adaptations, warmups, recovery or full session timings.
  return normalizeChart({
    schema:'pulse369.choreography.v1',title:recipe.title,
    bpm:recipe.bpm,offsetMs:recipe.offsetMs,
    phrases:recipe.playlist.map((id,i)=>phraseFromStyle(LESSONS[id].style,
      (i+1)+' '+LESSONS[id].name,1))
  });
}
export function workoutReceipt(raw,counts,musicMode){
  const plan=buildWorkout(raw);
  return {schema:'pulse369.dance-workout-receipt.v1',provenance:'SCREEN_DEMONSTRATION_UNVERIFIED',
    manualBpm:plan.recipe.bpm,selectedMinutes:plan.recipe.minutes,
    posture:plan.recipe.posture,paceOption:plan.recipe.pace,
    playlistCount:plan.recipe.playlist.length,scheduledSections:plan.sectionCount,
    recoveryBreaks:plan.recoveryCount,
    displayedCounts:Number.isInteger(counts)?Math.max(0,Math.min(plan.totalCounts,counts)):0,
    soundtrack:musicMode==='local'?'local-file-not-uploaded':'synthetic-count-guide',
    limits:'No movement, steps, balance, heart rate, calories, exertion or workout completion was sensed. On-screen demonstration only.'
  };
}
