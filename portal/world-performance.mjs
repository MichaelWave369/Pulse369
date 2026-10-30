/** World Forge R4: bounded, local-only, authored DanceFlow → WorldPack performance.
 * Does not authorize game actions, song upload, controller inference or locomotion.
 */
import {normalizeChart,totalCounts,CHART_SCHEMA} from './choreo-model.mjs';
import {normalizeShow,SHOW_SCHEMA as DANCE_SHOW_SCHEMA} from './dance-performance.mjs';
import {validateWorldPack} from './world-bridge.mjs';

export const PERFORMANCE_SCHEMA='pulse369.world-performance.v1';
export const MAX_PERFORMANCE_BYTES=6_850_000;
export const MAX_PERFORMANCE_WORLDS=3;
export const PALETTES=Object.freeze(['outrun','aurora','ember','ice']);
export const TRANSITIONS=Object.freeze([0,2,4,8]);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>object(x)&&Object.keys(x).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(x,k));
const number=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const title=x=>typeof x==='string'&&x.trim().length>0&&x.trim().length<=72&&
 !/[\u0000-\u001f\u007f]/.test(x);

export function importDanceFlow(source){
  if(!object(source))throw Error('Choose an authored DanceFlow chart or show');
  if(source.schema===CHART_SCHEMA)return normalizeChart(source);
  if(source.schema===DANCE_SHOW_SCHEMA){
    const show=normalizeShow(source);
    if(show.source.kind!=='chart')throw Error('R4 requires a DanceFlow show with an authored choreography chart');
    return normalizeChart(show.source.data);
  }
  throw Error('Unsupported DanceFlow source. Export a choreography chart or chart-based show');
}
export function createPerformance(chartSource,worlds,titleText='MY LIVING WORLD PERFORMANCE'){
  const chart=importDanceFlow(chartSource);
  if(!Array.isArray(worlds)||worlds.length<1||worlds.length>MAX_PERFORMANCE_WORLDS)
    throw Error('Choose one to three Domistika worlds');
  const safe=worlds.map(validateWorldPack);
  return normalizePerformance({
    schema:PERFORMANCE_SCHEMA,version:1,title:titleText,chart,worlds:safe,
    cues:chart.phrases.map((p,i)=>({
      worldIndex:i%safe.length,palette:'aurora',glow:.75,motion:1,transitionCounts:i?4:0
    }))
  });
}
export function normalizePerformance(raw){
  if(!exact(raw,['schema','version','title','chart','worlds','cues'])||
      raw.schema!==PERFORMANCE_SCHEMA||raw.version!==1||!title(raw.title))
    throw Error('Invalid World Forge performance header');
  const chart=normalizeChart(raw.chart);
  if(!Array.isArray(raw.worlds)||raw.worlds.length<1||raw.worlds.length>MAX_PERFORMANCE_WORLDS)
    throw Error('Performance must have 1–3 worlds');
  const worlds=raw.worlds.map(validateWorldPack);
  const aggregate=worlds.reduce((n,w)=>n+JSON.stringify(w).length,0);
  if(aggregate>6_750_000)throw Error('World performance geometry budget exceeded');
  if(!Array.isArray(raw.cues)||raw.cues.length!==chart.phrases.length)
    throw Error('Exactly one visual cue is required per authored DanceFlow phrase');
  const cues=raw.cues.map((c,i)=>{
    if(!exact(c,['worldIndex','palette','glow','motion','transitionCounts'])||
       !Number.isInteger(c.worldIndex)||c.worldIndex<0||c.worldIndex>=worlds.length||
       !PALETTES.includes(c.palette)||!number(c.glow,0,1)||
       !number(c.motion,0,1)||!TRANSITIONS.includes(c.transitionCounts))
      throw Error('Invalid visual cue for phrase '+(i+1));
    return {worldIndex:c.worldIndex,palette:c.palette,glow:c.glow,motion:c.motion,
      transitionCounts:c.transitionCounts};
  });
  return {schema:PERFORMANCE_SCHEMA,version:1,title:raw.title.trim(),chart,worlds,cues};
}
export function writePerformance(raw){
  const text=JSON.stringify(normalizePerformance(raw));
  if(new TextEncoder().encode(text).byteLength>MAX_PERFORMANCE_BYTES)throw Error('World performance exceeds 6.85 MB');
  return text;
}
export function readPerformance(json){
  if(typeof json!=='string'||new TextEncoder().encode(json).byteLength>MAX_PERFORMANCE_BYTES)
    throw Error('World performance must be a JSON file under 6.85 MB');
  let data;try{data=JSON.parse(json);}catch{throw Error('Invalid performance JSON');}
  return normalizePerformance(data);
}
export function editPerformanceCue(raw,phraseIndex,patch){
  const show=normalizePerformance(raw);
  if(!Number.isInteger(phraseIndex)||phraseIndex<0||phraseIndex>=show.cues.length||
     !object(patch)||Object.keys(patch).some(k=>!['worldIndex','palette','glow','motion','transitionCounts'].includes(k)))
    throw Error('Invalid cue edit');
  const cues=show.cues.map((c,i)=>i===phraseIndex?{...c,...patch}:c);
  return normalizePerformance({...show,cues});
}
/** Exact authored phrase/repeat boundaries; loop on a show cycle, not a guessed beat.
 * Blend at the START of the next phrase. Only world changes need two scenes.
 * The user's workout note chart remains unchanged.
 */
export function samplePerformance(raw,seconds){
  const show=raw.schema===PERFORMANCE_SCHEMA?raw:normalizePerformance(raw);
  if(typeof seconds!=='number'||!Number.isFinite(seconds)||seconds<0)throw Error('Invalid performance time');
  const chart=show.chart,countTotal=totalCounts(chart);
  const beats=Math.max(0,(seconds-chart.offsetMs/1000)*chart.bpm/60);
  const cycle=beats%countTotal;
  let start=0,index=0;
  for(let i=0;i<chart.phrases.length;i++){
    const end=start+chart.phrases[i].repeat*8;
    if(cycle<end){index=i;break;}
    start=end;
  }
  const current=show.cues[index],previous=show.cues[(index+show.cues.length-1)%show.cues.length];
  const fadeCounts=current.worldIndex===previous.worldIndex?0:current.transitionCounts;
  const blend=fadeCounts>0?Math.min(1,Math.max(0,(cycle-start)/fadeCounts)):1;
  return {phraseIndex:index,phraseName:chart.phrases[index].name,count:cycle,
    worldIndex:current.worldIndex,previousWorldIndex:previous.worldIndex,
    blend,palette:current.palette,glow:current.glow,motion:current.motion,
    previousPalette:previous.palette,previousGlow:previous.glow,previousMotion:previous.motion,
    totalCounts:countTotal};
}
