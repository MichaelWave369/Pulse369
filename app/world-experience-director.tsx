'use client';
import {useEffect,useMemo,useState} from 'react';
import {samplePerformance,type WorldPerformance} from '../portal/world-performance.mjs';
import {experiencePreflight,type DirectorStatus}
 from '../portal/world-experience-director.mjs';
import type {PulseGame} from '../lib/game-engine';

type Props={engine:PulseGame|null;show:WorldPerformance|null;enabled:boolean;
 active:boolean;roomActive:boolean;trackBpm:number;vrAvailable:boolean;onEnterVR:()=>void};
const initial:DirectorStatus={enabled:false,playing:false,seconds:0,durationSeconds:0};
export default function WorldExperienceDirector({engine,show,enabled,active,roomActive,trackBpm,vrAvailable,onEnterVR}:Props){
 const [clock,setClock]=useState<DirectorStatus>(initial);
 const [message,setMessage]=useState('Choose a performance and enable the silent stage rehearsal.');
 const plan=useMemo(()=>show?experiencePreflight(show,trackBpm):null,[show,trackBpm]);
 const available=!!engine&&!!show&&enabled&&!active&&!roomActive;
 const sampling=available&&!!clock.enabled;
 useEffect(()=>{
  setClock(initial);
  // The real game resets its rehearsal on every authored show change.
 },[show]);
 useEffect(()=>{
  if(!engine)return;
  const refresh=()=>setClock(engine.getDirectorRehearsalStatus());
  refresh();
  const id=window.setInterval(refresh,180);
  return()=>window.clearInterval(id);
 },[engine]);
 const apply=(action:()=>void)=>{
  if(!engine)return;
  try{action();setClock(engine.getDirectorRehearsalStatus());}
  catch(error){setMessage(error instanceof Error?error.message:'Could not rehearse this visual show.');}
 };
 const toggle=(value:boolean)=>apply(()=>{
  engine!.setDirectorRehearsalEnabled(value);
  setMessage(value?'Silent rehearsal enabled. Scrub or play the authored scenery on the real stage.':
   'Rehearsal stopped and reset. Authored data remains unchanged.');
 });
 const seek=(time:number)=>apply(()=>engine!.seekDirectorRehearsal(time));
 const play=(value:boolean)=>apply(()=>engine!.setDirectorRehearsalPlaying(value));
 const current=useMemo(()=>show&&plan?samplePerformance(show,Math.min(clock.seconds,plan.sheet.durationSeconds)):null,
  [show,plan,clock.seconds]);
 const launch=()=>{
  if(!available)return;
  // The PulseGame.start call immediately disables rehearsal and starts the original canonical session.
  apply(()=>engine!.setDirectorRehearsalEnabled(false));
  onEnterVR();
 };
 return <section aria-label="World Experience Director" style={{display:'grid',gap:10,borderTop:'1px solid var(--border)',marginTop:14,paddingTop:14}}>
  <strong>Immersive Experience Director · R10</strong>
  <p className="music-rule">Review the actual DanceFlow phrase-to-world show, rehearse scenery silently on the existing 3D stage, then launch the normal solo VR workout. Preview is visual-only. It never plays music, starts scoring, generates targets, or saves a workout result.</p>
  {!plan?<p className="music-rule">Import a DanceFlow World Performance in the composer to begin.</p>:<>
   <strong style={{fontSize:13}}>{plan.sheet.title} · {plan.sheet.phrases.length} phrases · {plan.sheet.counts} counts</strong>
   <p className="music-rule">Authored {plan.sheet.bpm} BPM · {plan.sheet.durationSeconds}s per loop · {plan.questMaxTriangles.toLocaleString()} estimated Quest triangles at the heaviest scene.</p>
   {plan.warnings.map(warning=><p className="music-rule" key={warning} role="status">{warning}</p>)}
   <label style={{display:'flex',alignItems:'flex-start',gap:8,fontSize:13}}>
    <input type="checkbox" checked={clock.enabled} disabled={!available} onChange={e=>toggle(e.target.checked)}/>
    <span>Enable silent visual rehearsal on the existing stage</span>
   </label>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    <button type="button" className="btn small" disabled={!sampling} onClick={()=>play(!clock.playing)}>
     {clock.playing?'Pause visuals':'Play visuals'}
    </button>
    <button type="button" className="btn small ghost" disabled={!sampling} onClick={()=>{play(false);seek(0);}}>Return to start</button>
   </div>
   <label htmlFor="r10-rehearsal-seek">Visual timeline · {clock.seconds.toFixed(1)} / {plan.sheet.durationSeconds.toFixed(1)} seconds</label>
   <input id="r10-rehearsal-seek" type="range" min="0" max={plan.sheet.durationSeconds} step=".05"
    value={Math.min(clock.seconds,plan.sheet.durationSeconds)} disabled={!sampling}
    onChange={e=>seek(Number(e.target.value))}/>
   {!!current&&sampling&&<p className="music-rule" role="status">
    Showing: {current.phraseName} · {plan.sheet.phrases[current.phraseIndex].worldTitle} · {current.palette} · transition blend {Math.round(current.blend*100)}%
   </p>}
   <strong style={{fontSize:12}}>Authored cue sheet (tap a phrase to rehearse)</strong>
   <div style={{display:'grid',gap:6}}>
    {plan.sheet.phrases.map(phrase=><button key={phrase.index} type="button"
     className="btn small ghost"
     disabled={!sampling}
     aria-label={'Seek to phrase '+(phrase.index+1)+' '+phrase.name}
     onClick={()=>{play(false);seek(phrase.startSeconds);}}
     style={{textAlign:'left',display:'grid',gap:2,height:'auto',whiteSpace:'normal',justifyContent:'stretch',padding:'8px 10px'}}>
     <strong>{phrase.index+1}. {phrase.name} · {phrase.worldTitle}</strong>
     <span style={{fontSize:11,opacity:.78}}>{phrase.startSeconds.toFixed(2)}–{phrase.endSeconds.toFixed(2)}s · {phrase.endCount-phrase.startCount} counts · {phrase.palette} · {phrase.transitionCounts===0?'cut':phrase.transitionCounts+'-count fade'}</span>
    </button>)}
   </div>
   <div style={{display:'grid',gap:5}}>
    <button type="button" className="btn small" disabled={!available||!vrAvailable} onClick={launch}>
     Enter the authored show in VR
    </button>
    <p className="music-rule">{!vrAvailable?'Immersive WebXR is unavailable in this browser. Desktop rehearsal still works.':
      'VR launch starts the original Pulse369 workout and soundtrack. The original Quest performance limits and adaptive governor still apply.'}</p>
   </div>
  </>}
  <p className="music-rule" role="status">{message}</p>
 </section>;
}
