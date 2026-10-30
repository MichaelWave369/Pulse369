/** World Forge R8: strictly bounded, offline-only comparison of user-supplied R7 receipts.
 * Never assert independent Quest verification, native headset FPS, or GPU timing.
 */
import {ACCEPTANCE_SCHEMA,CHECKLIST} from './world-acceptance.mjs';
export const COMPARISON_SCHEMA='pulse369.quest-acceptance-comparison.v1';
export const MAX_RECEIPT_BYTES=24000;
const encoded=s=>new TextEncoder().encode(s).byteLength;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(o,keys)=>object(o)&&Object.keys(o).length===keys.length&&
  Object.keys(o).every(k=>keys.includes(k));
const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const integer=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
const round=x=>Math.round(x*100)/100;
const FIELD_KEYS=['recording','xrObserved','callbackFrames','validIntervals',
  'elapsedSeconds','medianCallbackMs','p95CallbackMs','estimatedCallbackHz',
  'longGaps','sceneChanges','autoCuts','peakDrawCalls','peakTriangles',
  'intervalWindowTruncated','enoughForReview'];
const TOP_KEYS=['schema','version','kind','disclaimer','measurements','manualChecklist','verification'];
const BOOL_FIELDS=['recording','xrObserved','intervalWindowTruncated','enoughForReview'];
const INT_FIELDS=['callbackFrames','validIntervals','longGaps','sceneChanges',
  'autoCuts','peakDrawCalls','peakTriangles'];
const FLOAT_FIELDS=['elapsedSeconds','medianCallbackMs','p95CallbackMs','estimatedCallbackHz'];
const EXPECTED_KIND='USER_INITIATED_WEBXR_CALLBACK_MEASUREMENT';
const EXPECTED_VERIFICATION='USER_ATTESTED_ONLY_NOT_INDEPENDENTLY_VERIFIED';
export function readAcceptanceReceipt(input){
 if(typeof input!=='string'||encoded(input)>MAX_RECEIPT_BYTES)throw Error('Receipt must be JSON under 24 KB');
 let raw;try{raw=JSON.parse(input);}catch{throw Error('Invalid acceptance receipt JSON');}
 if(!exact(raw,TOP_KEYS)||raw.schema!==ACCEPTANCE_SCHEMA||raw.version!==1||
   raw.kind!==EXPECTED_KIND||raw.verification!==EXPECTED_VERIFICATION||
   typeof raw.disclaimer!=='string'||raw.disclaimer.length>300||
   !raw.disclaimer.includes('not GPU timings'))throw Error('Unsupported or modified R7 receipt format');
 const m=raw.measurements;
 if(!exact(m,FIELD_KEYS)||BOOL_FIELDS.some(k=>typeof m[k]!=='boolean')||
   INT_FIELDS.some(k=>!integer(m[k],k==='validIntervals'?7200:100_000_000))||
   !finite(m.elapsedSeconds,0,10_000_000)||
   FLOAT_FIELDS.slice(1).some(k=>m[k]!==null&&!finite(m[k],0,100_000))||
   m.callbackFrames<1||!m.xrObserved||m.recording||
   m.validIntervals>Math.max(0,m.callbackFrames-1)||
   m.longGaps>m.callbackFrames||m.sceneChanges>m.callbackFrames||
   m.autoCuts>m.callbackFrames||m.enoughForReview!==(m.callbackFrames>=180&&m.elapsedSeconds>=14.9)||
   (m.validIntervals===0)!==(m.medianCallbackMs===null&&m.p95CallbackMs===null&&m.estimatedCallbackHz===null))
   throw Error('Invalid or inconsistent XR callback measurements');
 const manual=raw.manualChecklist;
 if(!exact(manual,CHECKLIST)||CHECKLIST.some(k=>typeof manual[k]!=='boolean'))
   throw Error('Invalid self-attested Quest checklist');
 return {schema:ACCEPTANCE_SCHEMA,version:1,kind:EXPECTED_KIND,
   disclaimer:raw.disclaimer,
   measurements:Object.fromEntries(FIELD_KEYS.map(k=>[k,m[k]])),
   manualChecklist:Object.fromEntries(CHECKLIST.map(k=>[k,manual[k]])),
   verification:EXPECTED_VERIFICATION};
}
const perMinute=m=>m.elapsedSeconds>0?round(m.longGaps*60/m.elapsedSeconds):null;
export function compareAcceptanceReceipts(left,right,matchedConditions=false){
 if(typeof matchedConditions!=='boolean')throw Error('Comparison conditions must be explicitly confirmed or unconfirmed');
 const baseline=readAcceptanceReceipt(JSON.stringify(left));
 const candidate=readAcceptanceReceipt(JSON.stringify(right));
 const a=baseline.measurements,b=candidate.measurements;
 const fields=[
  ['p95CallbackMs','p95 callback interval','ms','lower',a.p95CallbackMs,b.p95CallbackMs],
  ['medianCallbackMs','Median callback interval','ms','lower',a.medianCallbackMs,b.medianCallbackMs],
  ['estimatedCallbackHz','Estimated callback cadence','Hz','higher',a.estimatedCallbackHz,b.estimatedCallbackHz],
  ['longGapsPerMinute','Long callback gaps/min','/min','lower',perMinute(a),perMinute(b)],
  ['peakDrawCalls','Peak Three.js draw calls','calls','lower',a.peakDrawCalls,b.peakDrawCalls],
  ['peakTriangles','Peak Three.js triangles','triangles','lower',a.peakTriangles,b.peakTriangles],
  ['sceneChanges','Observed phrase changes','events','context',a.sceneChanges,b.sceneChanges],
  ['autoCuts','Observed budget cuts','events','context',a.autoCuts,b.autoCuts]
 ].map(([key,label,unit,direction,from,to])=>({
   key,label,unit,direction,baseline:from,candidate:to,
   delta:from===null||to===null?null:round(to-from),
   percent:from===null||to===null||from===0?null:round((to-from)/from*100)
 }));
 const warnings=[];
 if(!matchedConditions)warnings.push('Same headset, browser version, show, track, motion mode, capture length and conditions have not been confirmed.');
 if(!a.enoughForReview||!b.enoughForReview)warnings.push('At least one capture lacks the R7 minimum review interval.');
 if(a.elapsedSeconds<30||b.elapsedSeconds<30||a.callbackFrames<300||b.callbackFrames<300)
   warnings.push('For comparison, both headset recordings should span at least 30 seconds and 300 callbacks.');
 if(a.sceneChanges!==b.sceneChanges)warnings.push('Different observed phrase counts may mean these runs exercised different scene loads.');
 if(a.intervalWindowTruncated||b.intervalWindowTruncated)warnings.push('At least one percentile comes from a 7,200-interval sliding window.');
 if(a.longGaps>0||b.longGaps>0)warnings.push('Callbacks had long interruptions; the interval percentile excludes gaps above 250 ms.');
 const comparable=matchedConditions&&a.enoughForReview&&b.enoughForReview&&
   a.elapsedSeconds>=30&&b.elapsedSeconds>=30&&a.callbackFrames>=300&&b.callbackFrames>=300&&
   a.sceneChanges===b.sceneChanges&&a.validIntervals>0&&b.validIntervals>0;
 const p95=fields[0],longGap=fields[3];
 const flags=[];
 if(comparable){
   if(p95.delta!==null&&p95.delta>Math.max(2,(p95.baseline??0)*.1))
     flags.push('Candidate p95 callback gap is materially higher (over 2 ms and/or 10% heuristic).');
   if(longGap.delta!==null&&longGap.delta>=2)
     flags.push('Candidate shows at least two more long callback interruptions per minute.');
 }
 return {schema:COMPARISON_SCHEMA,version:1,
  source:'TWO_USER_SUPPLIED_UNVERIFIED_R7_RECEIPTS',
  disclaimer:'Comparison of browser callback summaries only; not GPU timings, independently verified headset FPS, comfort, or a certified performance result.',
  matchedConditions,comparable,
  interpretation:!comparable?'NOT_COMPARABLE':flags.length?'POSSIBLE_REGRESSION_REVIEW':'NO_LARGE_CALLBACK_REGRESSION_DETECTED',
  fields,flags,warnings,
  summaries:{
   baseline:{callbackFrames:a.callbackFrames,elapsedSeconds:a.elapsedSeconds,
    selfAttestedItems:CHECKLIST.filter(k=>baseline.manualChecklist[k]).length},
   candidate:{callbackFrames:b.callbackFrames,elapsedSeconds:b.elapsedSeconds,
    selfAttestedItems:CHECKLIST.filter(k=>candidate.manualChecklist[k]).length}
  }};
}
export function writeAcceptanceComparison(comparison){
 if(!object(comparison)||comparison.schema!==COMPARISON_SCHEMA||comparison.version!==1)
   throw Error('Invalid local comparison');
 const json=JSON.stringify(comparison,null,2)+'\n';
 if(encoded(json)>MAX_RECEIPT_BYTES)throw Error('Comparison exceeds 24 KB');
 return json;
}
