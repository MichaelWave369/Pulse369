/** R7: opt-in, bounded, local WebXR render-frame diagnostics.
 * Timing measures main-thread animation callback intervals; NOT GPU timing,
 * native headset FPS, pose tracking, reprojection or physical comfort.
 * Never collect addresses, device IDs, user agent, tracks, body poses or accounts.
 */
export const ACCEPTANCE_SCHEMA='pulse369.quest-acceptance-receipt.v1';
export const CHECKLIST=Object.freeze([
  'bundleImportedInQuestBrowser','authoredPhrasesAligned',
  'sceneryBehindTargets','musicReactionObserved',
  'pauseResumeAndReentry','comfortAndControlsReviewed'
]);
const LIMIT=7200;
const safeInt=x=>Number.isInteger(x)&&x>=0&&x<1_000_000;
const round=x=>Math.round(x*10)/10;
function percentile(values,p){
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 return round(sorted[Math.min(sorted.length-1,Math.max(0,Math.ceil(sorted.length*p)-1))]);
}
export function createAcceptanceRecorder(){
 let recording=false,frames=[],position=0,accepted=0,first=null,last=null,prevTime=null;
 let gaps=0,sceneChanges=0,autoCuts=0,lastScene=null,lastReason=null,peakDraws=0,peakTriangles=0;
 function start(){
  recording=true;frames=[];position=0;accepted=0;first=null;last=null;prevTime=null;
  gaps=0;sceneChanges=0;autoCuts=0;lastScene=null;lastReason=null;peakDraws=0;peakTriangles=0;
 }
 function stop(){recording=false;}
 function capture(sample){
  if(!recording||sample?.xrPresenting!==true)return false;
  const {timeMs,calls,triangles,activeStages,phraseIndex,reason}=sample;
  if(typeof timeMs!=='number'||!Number.isFinite(timeMs)||timeMs<0||
    !safeInt(calls)||!safeInt(triangles)||!safeInt(activeStages)||activeStages>2||
    (phraseIndex!==null&&(!safeInt(phraseIndex)||phraseIndex>15))||
    typeof reason!=='string'||reason.length>40)return false;
  if(prevTime!==null&&timeMs<=prevTime)return false;
  if(first===null)first=timeMs;
  last=timeMs;accepted++;peakDraws=Math.max(peakDraws,calls);peakTriangles=Math.max(peakTriangles,triangles);
  if(lastScene!==null&&phraseIndex!==null&&lastScene!==phraseIndex)sceneChanges++;
  if(phraseIndex!==null)lastScene=phraseIndex;
  if(reason!==lastReason&&['crossfade-over-budget','single-scene-heavy'].includes(reason))autoCuts++;
  lastReason=reason;
  if(prevTime!==null){
   const elapsed=timeMs-prevTime;
   if(elapsed>250){gaps++;}
   else {
    if(frames.length<LIMIT)frames.push(elapsed);
    else {frames[position]=elapsed;position=(position+1)%LIMIT;}
   }
  }
  prevTime=timeMs;
  return true;
 }
 function snapshot(){
  const total=last===null||first===null?0:(last-first)/1000;
  const elapsed=frames.reduce((sum,value)=>sum+value,0);
  const sortedByAge=frames.length===LIMIT?[...frames.slice(position),...frames.slice(0,position)]:frames;
  const avg=sortedByAge.length?elapsed/sortedByAge.length:0;
  return {
   recording, xrObserved:accepted>0,callbackFrames:accepted,validIntervals:frames.length,
   elapsedSeconds:round(total),medianCallbackMs:percentile(frames,.5),
   p95CallbackMs:percentile(frames,.95),
   estimatedCallbackHz:avg?round(1000/avg):null,
   longGaps:gaps,sceneChanges,autoCuts,peakDrawCalls:peakDraws,
   peakTriangles,intervalWindowTruncated:accepted>LIMIT+1,
   enoughForReview:accepted>=180&&total>=15
  };
 }
 function receipt(checks){
  if(!checks||typeof checks!=='object'||Array.isArray(checks)||
   Object.keys(checks).some(key=>!CHECKLIST.includes(key))||
   CHECKLIST.some(key=>typeof checks[key]!=='boolean'))throw Error('Invalid acceptance checklist');
  return {schema:ACCEPTANCE_SCHEMA,version:1,
   kind:'USER_INITIATED_WEBXR_CALLBACK_MEASUREMENT',
   disclaimer:'Callback intervals are not GPU timings, headset refresh verification, comfort validation or certified Quest 3 FPS.',
   measurements:snapshot(),
   manualChecklist:Object.fromEntries(CHECKLIST.map(key=>[key,checks[key]])),
   verification:'USER_ATTESTED_ONLY_NOT_INDEPENDENTLY_VERIFIED'};
 }
 return {start,stop,capture,snapshot,receipt,isRecording:()=>recording};
}
