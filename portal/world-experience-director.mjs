/** R10 local immersive experience direction.
 * A single deterministic, silent visual timeline based on R4 authored phrases.
 * Never emits hit targets, song bytes, account data or side effects.
 */
import {normalizePerformance,samplePerformance} from './world-performance.mjs';
import {performanceBudgetReport} from './world-render-budget.mjs';
import {totalCounts} from './choreo-model.mjs';
const round=x=>Math.round(x*1000)/1000;
export function createDirectorSheet(raw){
 const show=normalizePerformance(raw),bpm=show.chart.bpm;
 const offset=show.chart.offsetMs/1000;
 let count=0;
 const phrases=show.chart.phrases.map((phrase,i)=>{
  const cue=show.cues[i],startCount=count;
  count+=phrase.repeat*8;
  return {index:i,name:phrase.name,worldIndex:cue.worldIndex,
    worldTitle:show.worlds[cue.worldIndex].title,palette:cue.palette,
    glow:cue.glow,motion:cue.motion,transitionCounts:cue.transitionCounts,
    startCount,endCount:count,
    startSeconds:round(offset+startCount*60/bpm),endSeconds:round(offset+count*60/bpm)};
 });
 return {title:show.title,bpm,offsetSeconds:offset,
   counts:totalCounts(show.chart),
   durationSeconds:round(offset+count*60/bpm),phrases};
}
export function directorAt(raw,seconds){
 const show=normalizePerformance(raw);
 const sheet=createDirectorSheet(show);
 if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<0)
  throw Error('Invalid rehearsal cursor time');
 const visual=samplePerformance(show,seconds);
 return {seconds:round(seconds),phraseIndex:visual.phraseIndex,phrase:visual.phraseName,
  worldTitle:sheet.phrases[visual.phraseIndex].worldTitle,
  palette:visual.palette,glow:visual.glow,motion:visual.motion,
  transitionBlend:round(visual.blend)};
}
export function experiencePreflight(raw,trackBpm){
 const show=normalizePerformance(raw),sheet=createDirectorSheet(show);
 if(typeof trackBpm!=='number'||!Number.isFinite(trackBpm)||trackBpm<0||trackBpm>300)
  throw Error('Invalid track BPM');
 const cost=performanceBudgetReport(show,'quest');
 const warnings=[];
 if(trackBpm!==show.chart.bpm)
  warnings.push('Selected track BPM does not match authored choreography. Visual phrase alignment may drift.');
 if(cost.cuts>0)warnings.push(cost.cuts+' Quest transitions will use an immediate scene cut to respect R5 budgets.');
 if(cost.heavyWorlds>0)warnings.push(cost.heavyWorlds+' individual scenes exceed the conservative Quest geometry estimate.');
 return {sheet,questMaxTriangles:Math.max(...cost.worlds.map(x=>x.triangles)),
  questBudgetCuts:cost.cuts,warnings,matchedTrackBpm:trackBpm===show.chart.bpm};
}
/** Browser animation callback clock. Preview is exclusively visual, has no audio
 * and never replaces the canonical PulseGame session clock. Stop on user stop,
 * start of workout, show change and loss of rehearsal eligibility.
 */
export function createDirectorClock(){
 let enabled=false,playing=false,seconds=0,lastFrame=null,duration=0;
 const status=()=>({enabled,playing,seconds:round(seconds),durationSeconds:duration});
 function setEnabled(value,durationSeconds=duration){
  if(typeof value!=='boolean')throw Error('Invalid rehearsal toggle');
  if(typeof durationSeconds!=='number'||!Number.isFinite(durationSeconds)||
    durationSeconds<0||durationSeconds>1500)throw Error('Invalid rehearsal duration');
  enabled=value;playing=false;seconds=0;lastFrame=null;duration=durationSeconds;
  return status();
 }
 function seek(value){
  if(!enabled)throw Error('Enable visual rehearsal first');
  if(typeof value!=='number'||!Number.isFinite(value))throw Error('Invalid rehearsal cursor');
  seconds=Math.max(0,Math.min(duration,value));lastFrame=null;
  return status();
 }
 function play(value){
  if(typeof value!=='boolean')throw Error('Invalid rehearsal playback state');
  if(value&&!enabled)throw Error('Enable visual rehearsal first');
  playing=enabled&&value;lastFrame=null;
  return status();
 }
 function tick(timeMs,eligible){
  if(!enabled)return status();
  if(!eligible){playing=false;lastFrame=null;return status();}
  if(!playing)return status();
  if(typeof timeMs!=='number'||!Number.isFinite(timeMs)||timeMs<0)return status();
  if(lastFrame===null){lastFrame=timeMs;return status();}
  const dt=timeMs-lastFrame;
  if(dt<=0)return status();
  lastFrame=timeMs;
  if(dt>250){playing=false;lastFrame=null;return status();}
  if(duration>0)seconds=(seconds+dt/1000)%duration;
  return status();
 }
 return {status,setEnabled,seek,play,tick};
}
