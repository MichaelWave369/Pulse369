'use client';
import {useEffect,useState} from 'react';
import type {WorldPerformance} from '../portal/world-performance.mjs';
import {showcaseManifest} from '../portal/world-showcase.mjs';
import type {PulseGame} from '../lib/game-engine';

type Info=NonNullable<ReturnType<PulseGame['getShowcaseStatus']>>;
type Props={engine:PulseGame|null;show:WorldPerformance|null;active:boolean;
 roomActive:boolean;vrAvailable:boolean};
export default function WorldShowcase({engine,show,active,roomActive,vrAvailable}:Props){
 const [info,setInfo]=useState<Info|null>(null),[notice,setNotice]=useState('Enter a private gallery of the authored worlds. No music or workout required.');
 const eligible=!!engine&&!!show&&!active&&!roomActive;
 const manifest=show?showcaseManifest(show):null;
 useEffect(()=>{
  if(!engine){setInfo(null);return;}
  const sync=()=>setInfo(engine.getShowcaseStatus());
  sync();
  const interval=window.setInterval(sync,600);
  return()=>window.clearInterval(interval);
 },[engine]);
 const act=(doAction:()=>unknown)=>{
  if(!engine)return;
  try{doAction();setInfo(engine.getShowcaseStatus());}
  catch(error){setNotice(error instanceof Error?error.message:'Gallery action could not finish.');}
 };
 const open=()=>{if(!eligible||!show)return;act(()=>{
  engine!.setShowcaseEnabled(show);
  setNotice('Gallery opened. Click the 3D stage, then use WASD to walk and Left/Right arrows to turn. Artwork is decorative; no collisions or scoring.');
 });};
 const close=()=>{if(!engine||engine.status.vr)return;act(()=>{
  engine.setShowcaseEnabled(null);setNotice('Gallery closed. Your authored show and training settings were not changed.');
 });};
 const vr=()=>{
  if(!info||!vrAvailable||engine?.status.vr)return;
  // Immediate direct invocation from the click event preserves WebXR user activation.
  void engine!.enterShowcaseVR().then(()=>setNotice('Immersive art gallery opened. Move slowly with the left thumbstick; use left/right triggers to switch rooms. Exit VR using the headset browser control.'))
   .catch(error=>setNotice(error instanceof Error?error.message:'WebXR gallery could not launch'));
 };
 return <section aria-label="Immersive Art Showcase" style={{display:'grid',gap:10,borderTop:'1px solid var(--border)',paddingTop:14,marginTop:14}}>
  <strong>Immersive Art Showcase · R11</strong>
  <p className="music-rule">Turn the same DomistikaXR artworks into a gallery of 1–3 curated exhibition rooms, each displaying one world at a time. Navigate the real stage on desktop, or enter a separate Quest gallery without starting a workout, scoring, or music playback. This is a private, offline art viewing mode, not a hosted community gallery.</p>
  {!show?<p className="music-rule">Open or create an authored World Performance first, then choose solo Rave.</p>:<>
   <strong style={{fontSize:13}}>{manifest?.title} · {manifest?.roomCount} authored exhibition rooms</strong>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    <button type="button" className="btn small" disabled={!eligible||!!info} onClick={open}>Open local art gallery</button>
    <button type="button" className="btn small ghost" disabled={!info||!!engine?.status.vr} onClick={close}>Close gallery</button>
   </div>
   {!!info&&<div style={{display:'grid',gap:8}}>
    <strong style={{fontSize:13}}>Exhibit {info.roomIndex+1}/{info.roomCount} · {info.roomTitle}</strong>
    <p className="music-rule">{info.exhibitObjects} authored objects · {info.quality==='quest'?'Quest-tessellated':'Desktop'} visual quality. {info.questHeavy?'This world exceeds the conservative Quest triangle estimate.':''}</p>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
     <button className="btn small ghost" type="button" onClick={()=>act(()=>engine!.stepShowcaseRoom(-1))} disabled={!eligible||!!engine?.status.vr}>Previous room</button>
     <button className="btn small ghost" type="button" onClick={()=>act(()=>engine!.stepShowcaseRoom(1))} disabled={!eligible||!!engine?.status.vr}>Next room</button>
    </div>
    <label style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:12}}>
     <input type="checkbox" checked={info.motion} disabled={!eligible||!!engine?.status.vr} onChange={e=>act(()=>engine!.setShowcaseMotion(e.target.checked))}/>
     <span>Play subtle authored sculpture motion (off by default for viewing comfort)</span>
    </label>
    <div style={{display:'grid',gap:5}}>
     {manifest?.rooms.map(room=><button key={room.index} type="button" className="btn small ghost"
      disabled={!eligible||!!engine?.status.vr} onClick={()=>act(()=>engine!.selectShowcaseRoom(room.index))}
      style={{height:'auto',padding:8,textAlign:'left',justifyContent:'flex-start',whiteSpace:'normal',
       opacity:room.index===info.roomIndex?1:.78}}>
      {room.index+1}. {room.title} · {room.objects} objects
     </button>)}
    </div>
    <button type="button" className="btn small" disabled={!eligible||!vrAvailable||!!engine?.status.vr} onClick={vr}>Enter gallery in VR · no workout</button>
    {!vrAvailable&&<p className="music-rule">WebXR immersive VR isn't supported in this browser. The desktop gallery remains available.</p>}
    {!!engine?.status.vr&&<p className="music-rule" role="status">Gallery VR active. Use your headset's Exit VR control to return to desktop. No workout is running.</p>}
   </div>}
  </>}
  <p className="music-rule" role="status">{notice}</p>
  <p className="music-rule">Desktop: click the stage then use W/A/S/D and Left/Right arrows. Quest: turn your head and move slowly with the left thumbstick; left/right triggers switch rooms. Movement is bounded and optional, but **artworks have no collision geometry**. Stay aware of the physical guardian boundary. Each room holds only one loaded scene to avoid unnecessarily multiplying GPU use.</p>
 </section>;
}
