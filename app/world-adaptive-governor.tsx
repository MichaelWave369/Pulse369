'use client';
import {useEffect,useState} from 'react';
import type {PulseGame} from '../lib/game-engine';
import type {VisualGovernorStatus} from '../portal/world-adaptive-governor.mjs';

export default function WorldAdaptiveGovernor({engine,showReady,roomActive}:{
 engine:PulseGame|null;showReady:boolean;roomActive:boolean
}){
 const [enabled,setEnabled]=useState(false);
 const [status,setStatus]=useState<VisualGovernorStatus|null>(null);
 const eligible=!!engine&&showReady&&!roomActive;
 useEffect(()=>{
  if(!engine)return;
  engine.setAdaptiveWorldVisuals(enabled&&showReady&&!roomActive);
  setStatus(engine.getAdaptiveWorldStatus());
 },[engine,enabled,showReady,roomActive]);
 useEffect(()=>{
  if(!engine)return;
  const interval=window.setInterval(()=>setStatus(engine.getAdaptiveWorldStatus()),900);
  return()=>window.clearInterval(interval);
 },[engine]);
 return <section aria-label="Adaptive World Effects" style={{borderTop:'1px solid var(--border)',marginTop:14,paddingTop:14,display:'grid',gap:9}}>
  <strong>Adaptive Visual Governor · R9</strong>
  <p className="music-rule">Optional Quest WebXR pacing guard. Measures only animation callback intervals while an authored solo workout is running in VR. If slow callbacks persist, it dims and slows decorative scenery and, at the lowest tier, uses cuts instead of crossfades. Original music, targets, controllers and authored WorldPacks never change. The control is off by default.</p>
  <label htmlFor="wf-r9-enabled" style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:13}}>
   <input id="wf-r9-enabled" type="checkbox" checked={enabled} disabled={!eligible} onChange={e=>setEnabled(e.target.checked)}/>
   <span>Allow temporary, automatic reductions to optional VR world visuals</span>
  </label>
  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
   <div><strong>{status?.profile??'Full authored visuals'}</strong><p className="music-rule">Current visual tier</p></div>
   <div><strong>{status?.immersive?'Immersive sample active':status?.enabled?'Armed':'Off'}</strong><p className="music-rule">Governor state</p></div>
   <div><strong>{status?.downgrades??0} / {status?.recoveries??0}</strong><p className="music-rule">Reductions / recoveries this session</p></div>
   <div><strong>{status?.lastP90Ms??'—'} ms</strong><p className="music-rule">Recent callback p90, not GPU time</p></div>
   <div><strong>{status?.lastSlowPercent??'—'}%</strong><p className="music-rule">Recent callbacks slower than 27 ms</p></div>
   <div><strong>{status?.ignoredLongGaps??0}</strong><p className="music-rule">Ignored suspension gaps</p></div>
  </div>
  <p className="music-rule" role="status">{status?.lastEvent??'Governor not yet armed'}</p>
  <p className="music-rule">The governor uses 60-callback windows, reduction hysteresis and slower recovery. It is a convenience heuristic, not a Quest performance certification, display FPS measurement or GPU profiler. For measured before/after comparisons, use the R7 recorder and R8 comparator.</p>
 </section>;
}
