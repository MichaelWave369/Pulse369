'use client';
import {useEffect,useState} from 'react';
import type {PulseGame} from '../lib/game-engine';
import WorldAcceptanceCompare from './world-acceptance-compare';
import {CHECKLIST,type AcceptanceChecklist,type AcceptanceMeasurements}
 from '../portal/world-acceptance.mjs';

const ITEMS:Record<keyof AcceptanceChecklist,string>={
 bundleImportedInQuestBrowser:'I imported the same exported R6 bundle in Quest Browser',
 authoredPhrasesAligned:'I saw scene changes align with authored DanceFlow phrases',
 sceneryBehindTargets:'Scenery stayed behind gameplay targets and did not obscure them',
 musicReactionObserved:'Visuals reacted to actual soundtrack (not only tempo preview)',
 pauseResumeAndReentry:'Pause, resume, exit VR and re-entry behaved as expected',
 comfortAndControlsReviewed:'I personally checked comfort, legibility and controller response'
};
const EMPTY=Object.fromEntries(CHECKLIST.map(k=>[k,false])) as AcceptanceChecklist;
export default function WorldAcceptanceLab({engine,showReady,roomActive}:{
 engine:PulseGame|null;showReady:boolean;roomActive:boolean
}){
 const [snapshot,setSnapshot]=useState<AcceptanceMeasurements|null>(null);
 const [checks,setChecks]=useState<AcceptanceChecklist>(EMPTY);
 const [notice,setNotice]=useState('No headset evidence has been captured in this tab.');
 const available=!!engine&&showReady&&!roomActive;
 useEffect(()=>{
  if(!engine){return;}
  // Panel-only local polling. No samples or analytics leave the device.
  const update=()=>{try{setSnapshot(engine.getAcceptanceSnapshot());}catch{}};
  update();
  const id=window.setInterval(update,800);
  return()=>window.clearInterval(id);
 },[engine]);
 const start=()=>{
  if(!available)return;
  try{
   engine!.startAcceptanceCapture();
   setSnapshot(engine!.getAcceptanceSnapshot());setChecks(EMPTY);
   setNotice('Capture armed. Enter VR and exercise in your authored world for at least 15 seconds. Only immersive callbacks count.');
  }catch(e){setNotice(e instanceof Error?e.message:'Could not start capture');}
 };
 const stop=()=>{
  if(!engine)return;
  engine.stopAcceptanceCapture();setSnapshot(engine.getAcceptanceSnapshot());
  setNotice('Capture stopped. Review the data and personally confirm checklist items before exporting a local receipt.');
 };
 const download=()=>{
  if(!engine||!snapshot?.xrObserved||snapshot.recording)return;
  try{
   const receipt=engine.getAcceptanceReceipt(checks);
   const url=URL.createObjectURL(new Blob([JSON.stringify(receipt,null,2)+'\n'],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download='pulse369-quest-acceptance-v1.json';a.click();
   window.setTimeout(()=>URL.revokeObjectURL(url),1000);
   setNotice('Evidence JSON downloaded locally. This does not certify headset performance or validate manual checklist claims.');
  }catch(e){setNotice(e instanceof Error?e.message:'Could not export evidence');}
 };
 return <section aria-label="Quest Acceptance Lab" style={{borderTop:'1px solid var(--border)',marginTop:14,paddingTop:14,display:'grid',gap:10}}>
  <strong>Quest Acceptance Lab · R7</strong>
  <p className="music-rule">Collect a bounded WebXR animation-callback timing sample with the selected World Performance. No microphone, headset pose, user identity, soundtrack, body tracking or automatic upload. This measures browser callbacks, NOT GPU render time or verified headset FPS.</p>
  <div className="buttons" style={{flexWrap:'wrap'}}>
   <button type="button" className="btn small" disabled={!available||!!snapshot?.recording} onClick={start}>Start opt-in XR capture</button>
   <button type="button" className="btn small ghost" disabled={!snapshot?.recording||!engine} onClick={stop}>Stop capture</button>
   <button type="button" className="btn small ghost" disabled={!snapshot?.xrObserved||!!snapshot?.recording||!engine} onClick={download}>Download evidence JSON</button>
  </div>
  <p className="music-rule" role="status">{notice}</p>
  {!!snapshot&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
    <div><strong>{snapshot.callbackFrames}</strong><div className="music-rule">Observed XR callbacks</div></div>
    <div><strong>{snapshot.elapsedSeconds}s</strong><div className="music-rule">Elapsed capture interval</div></div>
    <div><strong>{snapshot.estimatedCallbackHz??'—'} Hz</strong><div className="music-rule">Estimated callback cadence</div></div>
    <div><strong>{snapshot.p95CallbackMs??'—'} ms</strong><div className="music-rule">95th percentile callback gap</div></div>
    <div><strong>{snapshot.peakDrawCalls}</strong><div className="music-rule">Peak Three.js draw calls</div></div>
    <div><strong>{snapshot.peakTriangles.toLocaleString()}</strong><div className="music-rule">Peak Three.js triangles</div></div>
    <div><strong>{snapshot.sceneChanges}</strong><div className="music-rule">Observed phrase changes</div></div>
    <div><strong>{snapshot.autoCuts}</strong><div className="music-rule">Observed budget-cut events</div></div>
   </div>}
  <p className="music-rule">{snapshot?.enoughForReview?'Enough WebXR callbacks for a basic review, not a performance certification.':'A basic review needs at least 180 immersive callbacks over 15 seconds. Try a longer immersive workout.'} {snapshot?.longGaps?'Long interruptions observed: '+snapshot.longGaps+'. ':''} {snapshot?.intervalWindowTruncated?'Timing percentiles use only the last 7,200 valid intervals.':''}</p>
  <strong style={{fontSize:12}}>Human-observed acceptance checklist (self-attested)</strong>
  {CHECKLIST.map(key=><label key={key} style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:12}}>
   <input type="checkbox" checked={checks[key]} onChange={e=>setChecks(old=>({...old,[key]:e.target.checked}))}/>
   <span>{ITEMS[key]}</span>
  </label>)}
  <p className="music-rule">Desktop rehearsal cannot create XR frame evidence. To compare desktop-to-Quest, download the R6 bundle on desktop, transfer the JSON to the headset, import it in Quest Browser, then start this capture before entering VR. Mark each item only after personally checking it. No automatic “passed” designation is issued.</p>
  <WorldAcceptanceCompare/>
 </section>;
}
