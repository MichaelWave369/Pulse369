/** R9 opt-in adaptive VISUAL-ONLY pacing governor.
 * Uses callback-interval heuristics, not GPU time, headset FPS or pose data.
 * The conservative thresholds are not a device-specific performance guarantee.
 */
export const GOVERNOR_LEVELS=Object.freeze([
  Object.freeze({label:'Full authored visuals',motion:1,glow:1,gain:1,allowCrossfade:true}),
  Object.freeze({label:'Reduced visual effects',motion:.65,glow:.7,gain:.8,allowCrossfade:true}),
  Object.freeze({label:'Minimal visual effects',motion:.3,glow:.4,gain:.5,allowCrossfade:false})
]);
export const GOVERNOR_WINDOW=60;
const round=x=>Math.round(x*10)/10;
const percentile=(samples,fraction)=>{
 const sorted=[...samples].sort((a,b)=>a-b);
 return sorted[Math.max(0,Math.ceil(sorted.length*fraction)-1)];
};
export function createVisualGovernor(){
 let enabled=false,immersive=false,level=0,previous=null,lastChange=-Infinity;
 let window=[],badWindows=0,goodWindows=0;
 let xrCallbacks=0,processedWindows=0,downgrades=0,recoveries=0,ignoredLongGaps=0;
 let lastSlowPercent=null,lastP90Ms=null,lastEvent='Not enabled';
 const status=()=>({
  enabled,immersive,level,profile:GOVERNOR_LEVELS[level].label,xrCallbacks,processedWindows,
  downgrades,recoveries,ignoredLongGaps,lastSlowPercent,lastP90Ms,lastEvent,
  disclaimer:'Browser WebXR callback timing is a visual pacing heuristic, not hardware GPU or headset FPS.'
 });
 function clearWindow(){window=[];previous=null;badWindows=0;goodWindows=0;}
 function resetStatistics(){
  xrCallbacks=0;processedWindows=0;downgrades=0;recoveries=0;ignoredLongGaps=0;
  lastSlowPercent=null;lastP90Ms=null;lastChange=-Infinity;
 }
 function setEnabled(value){
  if(typeof value!=='boolean')throw Error('Visual governor enable must be boolean');
  if(value===enabled)return status();
  enabled=value;immersive=false;level=0;clearWindow();resetStatistics();
  lastEvent=value?'Armed for immersive VR':'Disabled; authored visuals restored';
  return status();
 }
 function setImmersive(value){
  if(typeof value!=='boolean')throw Error('Immersive state must be boolean');
  if(value===immersive)return status();
  immersive=value;level=0;clearWindow();
  if(value){
   resetStatistics();
   lastEvent=enabled?'VR session started: evaluating callback pacing':'VR monitoring is disabled';
  }else lastEvent='Exited immersive VR; authored visuals restored';
  return status();
 }
 function observe(timeMs,xrPresenting){
  if(!enabled)return 0;
  if(!xrPresenting){if(immersive)setImmersive(false);return 0;}
  if(!immersive)setImmersive(true);
  if(typeof timeMs!=='number'||!Number.isFinite(timeMs)||timeMs<0)return level;
  if(previous===null){previous=timeMs;xrCallbacks++;return level;}
  const dt=timeMs-previous;
  if(dt<=0)return level;
  previous=timeMs;xrCallbacks++;
  if(dt>250){ignoredLongGaps++;clearWindow();previous=timeMs;return level;}
  if(dt<3)return level;
  window.push(dt);
  if(window.length<GOVERNOR_WINDOW)return level;
  const p90=percentile(window,.9);
  const slow=window.filter(x=>x>27).length/GOVERNOR_WINDOW;
  lastP90Ms=round(p90);lastSlowPercent=round(slow*100);
  processedWindows++;window=[];
  const bad=slow>=.20||p90>34;
  const good=slow<=.03&&p90<=22;
  badWindows=bad?badWindows+1:0;
  goodWindows=good?goodWindows+1:0;
  if(badWindows>=3&&level<2&&timeMs-lastChange>=4000){
   level++;downgrades++;badWindows=0;goodWindows=0;lastChange=timeMs;
   lastEvent='Optional visual effects reduced after sustained slow callbacks';
  }else if(goodWindows>=8&&level>0&&timeMs-lastChange>=4000){
   level--;recoveries++;goodWindows=0;badWindows=0;lastChange=timeMs;
   lastEvent='Optional visual effects cautiously restored after sustained stable callbacks';
  }
  return level;
 }
 return {status,setEnabled,setImmersive,observe};
}
