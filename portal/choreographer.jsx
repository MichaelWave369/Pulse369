import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { DANCE_STYLES } from './dance-core.mjs';
import { preflightLocalAudio } from './quest-local-music.mjs';
import { CLASS_MINUTES, createDanceClass, classCue, classPosition, classHitAt, validateClassTrack, classReceipt } from './dance-class.mjs';
import './styles.css';
import './quest-lab.css';
import './music-lab.css';
import './choreographer.css';

const UP = new THREE.Vector3(0,1,0);
const IDLE = {count:0,phaseName:'READY',phase:'ready',phrase:0,beat:0,name:'THE FLOOR IS YOURS',coach:'Choose your groove. Your instructor will break down every eight-count.',hands:[],matched:0,secondsLeft:0,progress:0};

function clickGuide(ctx, strong) {
  if(!ctx || ctx.state!=='running') return;
  try {
    const t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';
    osc.frequency.setValueAtTime(strong?220:120,t);
    osc.frequency.exponentialRampToValueAtTime(75,t+.07);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(strong?.08:.035,t+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,t+.095);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.11);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }catch{ /* Audio is optional. */ }
}
function relativeTarget(t,head,right,forward) {
  return new THREE.Vector3().copy(head).addScaledVector(right,t.x).addScaledVector(forward,-t.z).addScaledVector(UP,t.y);
}
function makeRoom(scene) {
  scene.background=new THREE.Color('#080d1d');
  scene.add(new THREE.HemisphereLight(0xaad8ff,0x1b1b52,2));
  const floor=new THREE.Mesh(new THREE.CircleGeometry(2,64),new THREE.MeshBasicMaterial({color:0x18304f,side:THREE.DoubleSide}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.015;scene.add(floor);
  for(let i=1;i<=5;i++){
    const ring=new THREE.Mesh(new THREE.RingGeometry(.36*i,.36*i+.009,72),
      new THREE.MeshBasicMaterial({color:i%2?0x89fcb5:0x8bd7ff,side:THREE.DoubleSide,transparent:true,opacity:.3}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.017+i*.002;scene.add(ring);
  }
  return ['left','right'].map((side,i)=>{
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.13,.032,10,30),new THREE.MeshBasicMaterial({color:i?0x87dfff:0xc7f876,transparent:true,opacity:.85}));
    ring.visible=false;scene.add(ring);
    return {side,ring};
  });
}
function createInstructor(scene) {
  const group=new THREE.Group();
  const translucent=new THREE.MeshBasicMaterial({color:0xe3a7ff,transparent:true,opacity:.35});
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.4,4,10),translucent);body.position.y=-.24;group.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),translucent);head.position.y=.16;group.add(head);
  const wrists=['left','right'].map((_,i)=>{
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(.065,10,8),
      new THREE.MeshBasicMaterial({color:i?0x87dfff:0xc7f876,transparent:true,opacity:.7}));
    group.add(mesh);return mesh;
  });
  scene.add(group);
  return {group,wrists};
}

function Choreographer() {
  const host=useRef(null), running=useRef(null), decoded=useRef(null), version=useRef(0);
  const [style,setStyle]=useState('groove');
  const [bpm,setBpm]=useState(112);
  const [minutes,setMinutes]=useState(5);
  const [posture,setPosture]=useState('standing');
  const [musicMode,setMusicMode]=useState('guide');
  const [offset,setOffset]=useState(0);
  const [fileStatus,setFileStatus]=useState('Choose a local MP3 or WAV up to 24 MB. It never leaves this device.');
  const [fileReady,setFileReady]=useState(false);
  const [support,setSupport]=useState('Checking WebXR availability…');
  const [state,setState]=useState('idle');
  const [status,setStatus]=useState('Your instructor is ready.');
  const [reading,setReading]=useState(IDLE);
  const [receipt,setReceipt]=useState(null);

  const plan=createDanceClass(bpm,minutes);
  const invalidAudio=musicMode==='local' ? (!fileReady?'Choose a valid local MP3/WAV first.':validateClassTrack(decoded.current?.duration,plan,offset)) : null;
  const busy=state!=='idle';

  useEffect(()=>{
    let active=true;
    if(!window.isSecureContext||!navigator.xr){setSupport('VR requires HTTPS and a compatible headset browser. Desktop preview works without a headset.');return;}
    navigator.xr.isSessionSupported('immersive-vr')
      .then(ok=>{if(active)setSupport(ok?'Immersive VR available (real headset acceptance unverified).':'Immersive VR not available in this browser.');})
      .catch(()=>{if(active)setSupport('WebXR support check unavailable.');});
    return()=>{active=false;};
  },[]);
  useEffect(()=>()=>{version.current++;running.current?.stop();decoded.current=null;},[]);

  async function pickMusic(event) {
    const token=++version.current;
    decoded.current=null;setFileReady(false);setReceipt(null);
    const file=event.target.files?.[0];
    if(!file){setFileStatus('No local file selected.');return;}
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){setFileStatus('Web Audio is unavailable here. Use guide beat.');return;}
    let ctx;
    setFileStatus('Checking and decoding locally…');
    try{
      ctx=new Ctx();
      const result=await preflightLocalAudio(file,bytes=>ctx.decodeAudioData(bytes));
      if(version.current!==token)return;
      decoded.current=result;setFileReady(true);
      setFileStatus('Audio ready in memory · '+result.duration.toFixed(1)+' seconds · No upload');
    }catch(err){
      if(version.current===token)setFileStatus('Audio rejected: '+(err?.message||'Unsupported file'));
    }finally{if(ctx && ctx.state!=='closed')await ctx.close().catch(()=>{});}
  }

  function endCurrent(){running.current?.stop();}
  function makeUI(cue,index,matched,total) {
    return {...cue,count:index+1,matched,secondsLeft:Math.max(0,(total-index-1)*60/bpm),progress:(index+1)/total};
  }

  function completeSession(counters, mode, stopped) {
    if(running.current && running.current.counters!==counters)return;
    running.current=null;
    setState('idle');
    setReceipt(classReceipt({style,plan,posture,completedBeats:counters.offered,
      eligibleBeats:counters.eligible,matchedCues:counters.hits,musicMode:mode}));
    setStatus(stopped?'Class ended early. Your local unverified summary is available.':'Class complete. Nice movement! Your controller summary is available.');
  }

  async function previewDesktop(){
    if(busy || invalidAudio || !plan)return;
    setReading(IDLE);setReceipt(null);setState('starting');
    const Ctx=window.AudioContext||window.webkitAudioContext;
    let ctx=null,src=null,raf=0,ended=false;
    const counters={offered:0,eligible:0,hits:0};
    const music=musicMode;
    let anchor=0,lastIndex=-1,lastClick=-1;
    const stop=(finished=false)=>{
      if(ended)return;
      ended=true;cancelAnimationFrame(raf);
      try{src?.stop();}catch{}
      try{src?.disconnect();}catch{}
      if(ctx)void ctx.close().catch(()=>{});
      completeSession(counters,music,!finished);
    };
    running.current={kind:'desktop',stop:()=>stop(false),counters};
    try{
      if(Ctx){ctx=new Ctx({latencyHint:'interactive'});await ctx.resume();}
      if(ended)return;
      if(music==='local'&&!ctx)throw new Error('Web Audio required for local music playback.');
      const now=ctx?ctx.currentTime:performance.now()/1000;
      const lead=1.5,offsetSec=music==='local'?offset/1000:0;
      anchor=now+lead+offsetSec;
      if(music==='local'){
        src=ctx.createBufferSource();src.buffer=decoded.current;
        const gain=ctx.createGain();gain.gain.value=.48;
        src.connect(gain);gain.connect(ctx.destination);src.start(now+lead);
      }
      setState('desktop');setStatus('Desktop choreography playing. Movement is illustrated, never scored.');
      const animate=()=>{
        if(ended)return;
        const clock=ctx?ctx.currentTime:performance.now()/1000;
        const index=classPosition(clock,anchor,bpm,plan.totalBeats);
        if(index>=plan.totalBeats){counters.offered=plan.totalBeats;stop(true);return;}
        if(index>=0 && index!==lastIndex){
          const cue=classCue(plan,style,index);
          counters.offered=Math.max(counters.offered,index+1);
          counters.eligible=plan.blocks.filter(b=>b.scored).reduce((n,b)=>n+Math.max(0,Math.min(index+1,b.end)-b.start),0);
          setReading(makeUI(cue,index,0,plan.totalBeats));
          lastIndex=index;
        }
        const click=Math.floor((clock-anchor)*bpm/60);
        if(music==='guide'&&click>=0&&click<plan.totalBeats&&click!==lastClick){
          lastClick=click;clickGuide(ctx,click%8===0);
        }
        raf=requestAnimationFrame(animate);
      };
      raf=requestAnimationFrame(animate);
    }catch(err){setStatus('Desktop class failed: '+(err?.message||'Unavailable'));stop(false);}
  }

  async function enterVR(){
    if(busy||invalidAudio||!plan||!navigator.xr)return;
    setReceipt(null);setReading(IDLE);setState('starting');
    setStatus('Requesting immersive VR. Stay in a clear, stationary play area.');
    let session=null,renderer=null,scene=null,ctx=null,src=null,ended=false,anchor=0;
    const counters={offered:0,eligible:0,hits:0},scored=new Set();
    let indexDrawn=-1,lastClicked=-1;
    const music=musicMode;
    const stop=(finished=false)=>{
      if(ended)return;ended=true;
      try{renderer?.setAnimationLoop(null);}catch{}
      try{src?.stop();}catch{}
      try{src?.disconnect();}catch{}
      scene?.traverse(o=>{
        o.geometry?.dispose?.();
        for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){
          m.map?.dispose?.();m.dispose?.();
        }
      });
      try{renderer?.dispose();renderer?.domElement.remove();}catch{}
      if(ctx)void ctx.close().catch(()=>{});
      completeSession(counters,music,!finished);
    };
    let finishNormally=false;
    try{
      // Request both XR and AudioContext activation directly inside this click.
      const request=navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)throw new Error('Web Audio unavailable. Use the screen preview.');
      ctx=new Ctx({latencyHint:'interactive'});
      const resume=ctx.resume();
      session=await request;
      if(ended)return;
      await resume;
      if(music==='local'&&!decoded.current)throw new Error('Local audio is no longer ready.');
      if(music==='local'){
        src=ctx.createBufferSource();src.buffer=decoded.current;
        const gain=ctx.createGain();gain.gain.value=.48;
        src.connect(gain);gain.connect(ctx.destination);
      }
      renderer=new THREE.WebGLRenderer({antialias:true});
      renderer.setPixelRatio(1);renderer.setSize(700,394);
      renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');
      if(!host.current)throw new Error('VR stage was unmounted.');
      host.current.appendChild(renderer.domElement);
      scene=new THREE.Scene();
      const rings=makeRoom(scene),instructor=createInstructor(scene);
      const camera=new THREE.PerspectiveCamera(70,700/394,.01,50);
      const controllers=[];
      for(let i=0;i<2;i++){
        const grip=renderer.xr.getControllerGrip(i);
        const input=renderer.xr.getController(i);
        const orb=new THREE.Mesh(new THREE.SphereGeometry(.06,12,10),new THREE.MeshBasicMaterial({color:0xe6f6ff}));
        grip.add(orb);scene.add(grip,input);
        const entry={grip,input,handedness:null,connected:false};
        input.addEventListener('connected',e=>{
          entry.handedness=['left','right'].includes(e.data?.handedness)?e.data.handedness:null;
          entry.connected=true;
        });
        input.addEventListener('disconnected',()=>{entry.connected=false;entry.handedness=null;});
        input.addEventListener('selectstart',()=>{void session.end().catch(()=>{});});
        controllers.push(entry);
      }
      session.addEventListener('end',()=>stop(finishNormally),{once:true});
      await renderer.xr.setSession(session);
      const now=ctx.currentTime;
      anchor=now+2.4+(music==='local'?offset/1000:0);
      if(src)src.start(now+2.4);
      running.current={kind:'vr',counters,stop:()=>{void session.end().catch(()=>stop(false));}};
      setState('vr');
      setStatus('VR class running. Follow the instructor gestures and colored hand rings. Trigger or headset menu exits.');
      const head=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3();
      const controllerPositions={};
      renderer.setAnimationLoop(()=>{
        if(ended)return;
        const clock=ctx.currentTime;
        const index=classPosition(clock,anchor,bpm,plan.totalBeats);
        const cue=classCue(plan,style,Math.max(0,Math.min(index,plan.totalBeats-1)));
        const hit=index<plan.totalBeats?classHitAt(clock,anchor,bpm,plan.totalBeats):null;
        // During the early half of a beat window, guide the upcoming cue so
        // legitimate early hand movements can count as well as late ones.
        const guideCue=hit ? classCue(plan,style,hit.index) : cue;
        const xrCamera=renderer.xr.getCamera();
        xrCamera.getWorldPosition(head);
        xrCamera.getWorldDirection(forward);forward.y=0;
        if(forward.lengthSq()<.03)forward.set(0,0,-1);
        forward.normalize();
        right.crossVectors(forward,UP).normalize();
        // Procedural torso and hands present motion cues; never represent a captured body.
        instructor.group.position.copy(head).addScaledVector(forward,1.55);
        instructor.group.position.y=head.y-.10;
        instructor.group.rotation.y=Math.atan2(forward.x,forward.z)+Math.PI;
        const targets=guideCue.hands.map(t=>{
          const p=relativeTarget(t,head,right,forward);
          return {side:t.side,x:p.x,y:p.y,z:p.z};
        });
        for(let i=0;i<2;i++){
          const side=i?'right':'left';
          const t=targets.find(x=>x.side===side);
          rings[i].ring.visible=!!t && index>=0;
          if(t){rings[i].ring.position.set(t.x,t.y,t.z);rings[i].ring.lookAt(head);}
          const gesture=guideCue.hands.find(x=>x.side===side);
          instructor.wrists[i].visible=!!gesture;
          if(gesture){instructor.wrists[i].position.set(gesture.x*.85,gesture.y-.12,-.10);}
        }
        for(const side of ['left','right'])delete controllerPositions[side];
        for(const c of controllers){
          if(c.connected&&c.handedness){
            const p=c.grip.getWorldPosition(new THREE.Vector3());
            controllerPositions[c.handedness]={x:p.x,y:p.y,z:p.z};
          }
        }
        if(index>=0&&index<plan.totalBeats){
          if(hit && !scored.has(hit.index) && guideCue.scoreEligible &&
            targets.every(t=>{
              const p=controllerPositions[t.side];
              return p&&Math.hypot(t.x-p.x,t.y-p.y,t.z-p.z)<=.28;
            })){
            scored.add(hit.index);counters.hits++;
          }
          if(index!==indexDrawn){
            indexDrawn=index;
            counters.offered=Math.max(counters.offered,index+1);
            counters.eligible=plan.blocks.filter(b=>b.scored)
              .reduce((n,b)=>n+Math.max(0,Math.min(index+1,b.end)-b.start),0);
            setReading(makeUI(cue,index,counters.hits,plan.totalBeats));
          }
          const click=Math.floor((clock-anchor)*bpm/60);
          if(music==='guide'&&click>=0&&click<plan.totalBeats&&click!==lastClicked){
            lastClicked=click;clickGuide(ctx,click%8===0);
          }
        }
        renderer.render(scene,camera);
        if(index>=plan.totalBeats){
          finishNormally=true;counters.offered=plan.totalBeats;
          void session.end().catch(()=>stop(true));
        }
      });
    }catch(err){
      setStatus('VR class could not start: '+(err?.message||'Unknown error'));
      if(session)try{await session.end();}catch{ /* Fall through to cleanup. */ }
      // A setup failure can happen before the session-end listener was attached.
      // Always cleanup explicitly; stop is idempotent if end already fired.
      stop(false);
    }
  }

  const minutesRemaining=(reading.secondsLeft/60).toFixed(1);
  const chosen=DANCE_STYLES[style];
  return <div className="quest-shell choreo-shell">
    <header className="quest-header">
      <a className="logo" href="index.html"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <a href="dance.html">← DANCEFLOW R0</a>
    </header>
    <main className="quest-main choreo-main">
      <p className="eyebrow"><span className="dot"/> THE CHOREOGRAPHER / DANCEFLOW R1</p>
      <h1>FIND YOUR <em>GROOVE.</em></h1>
      <p className="quest-sub">The workout disguised as a dance class. Warm up, learn the moves, rehearse the eight-count, dance the full routine, and cool down. The instructor demonstrates hand motions; optional footwork is never tracked or judged.</p>
      <section className="choreo-stages" aria-label="Five class phases">
        {plan.blocks.map((b,i)=><div key={b.id} className={reading.phase===b.id?'active':''}><small>{String(i+1).padStart(2,'0')}</small><strong>{b.name}</strong><span>{Math.round(b.beats*60/bpm)} sec</span></div>)}
      </section>
      <div className="quest-grid">
        <section className="quest-card">
          <h2>BUILD YOUR CLASS</h2>
          <div className="choreo-settings">
            <label>STYLE<select disabled={busy} value={style} onChange={e=>setStyle(e.target.value)}>
              {Object.entries(DANCE_STYLES).map(([id,s])=><option key={id} value={id}>{s.name}</option>)}
            </select></label>
            <label>MANUAL TEMPO<select disabled={busy} value={bpm} onChange={e=>setBpm(Number(e.target.value))}>
              {[96,112,128].map(b=><option key={b} value={b}>{b} BPM</option>)}
            </select></label>
            <label>CLASS LENGTH<select disabled={busy} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>
              {CLASS_MINUTES.map(m=><option key={m} value={m}>ABOUT {m} MIN</option>)}
            </select></label>
          </div>
          <fieldset className="quest-posture" disabled={busy}><legend>YOUR COMFORT</legend>
            <label><input type="radio" checked={posture==='standing'} onChange={()=>setPosture('standing')}/> Standing in place</label>
            <label><input type="radio" checked={posture==='seated'} onChange={()=>setPosture('seated')}/> Seated arm movement</label>
          </fieldset>
          <h2>YOUR SOUNDTRACK</h2>
          <fieldset className="quest-posture" disabled={busy}><legend>AUDIO MODE</legend>
            <label><input type="radio" checked={musicMode==='guide'} onChange={()=>setMusicMode('guide')}/> Synthesized beat guide</label>
            <label><input type="radio" checked={musicMode==='local'} onChange={()=>setMusicMode('local')}/> My own local MP3/WAV</label>
          </fieldset>
          {musicMode==='local'&&<>
            <label className="music-picker">LOCAL AUDIO (24 MB MAX)
              <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={busy} onChange={pickMusic}/>
            </label>
            <p role="status" className="choreo-file-status">{fileStatus}</p>
            <label className="quest-tempo">MANUAL BEAT OFFSET (0–1000 MS)
              <input type="number" min="0" max="1000" step="25" value={offset} disabled={busy} onChange={e=>setOffset(Number(e.target.value))}/>
            </label>
            {invalidAudio&&<p className="music-validation" role="alert">{invalidAudio}</p>}
            <p>Set the tempo and offset yourself. Music is decoded only inside this browser. No auto beat detection or file upload.</p>
          </>}
          <p className="choreo-safety">Safety: Clear your play area, stay stationary, respect your headset boundary, and stop for dizziness or pain. No spins, jumps or deep bends are required. Camera, lower-body tracking, calorie and heart-rate measurements are not used.</p>
          <div className="quest-actions">
            <button disabled={busy||!!invalidAudio} onClick={previewDesktop}>START SCREEN CLASS</button>
            <button disabled={busy||!!invalidAudio||!support.startsWith('Immersive VR available')} className="secondary" onClick={enterVR}>ENTER QUEST CLASS</button>
            <button disabled={!['desktop','vr'].includes(state)} className="secondary" onClick={endCurrent}>END CLASS</button>
          </div>
          <p className="notice" role="status">{status}</p>
          <p className="choreo-support">{support}</p>
        </section>
        <section className="quest-card choreo-instructor-card">
          <h2>THE INSTRUCTOR</h2>
          <div className="choreo-live">
            <div className="choreo-count"><span>{reading.phaseName}</span><strong>{reading.beat||'·'}</strong><small>COUNT / 8</small></div>
            <div className="choreo-move">
              <span>{chosen.name} · PHRASE {reading.phrase||'·'}</span>
              <strong>{reading.name}</strong>
              <p>{reading.coach}</p>
            </div>
          </div>
          <div className="choreo-figure" aria-label="Illustrated virtual instructor with left and right hand positions">
            <div className="choreo-head"/>
            <div className="choreo-torso"/>
            {reading.hands?.map(t=><div key={t.side} className={'choreo-hand '+t.side}
              style={{left:(50+t.x*66)+'%',top:(55-t.y*82)+'%'}} aria-hidden="true"/>)}
            <div className="choreo-stage-label">SIMULATED INSTRUCTOR · UPPER-BODY CUES</div>
          </div>
          <div className="choreo-progress"><div style={{width:(reading.progress*100)+'%'}}/></div>
          <div className="choreo-stats">
            <div><span>TIME LEFT</span><strong>{reading.count?minutesRemaining+'m':'—'}</strong></div>
            <div><span>CONTROLLER MATCHES</span><strong>{reading.matched}</strong></div>
          </div>
          <div ref={host} className="quest-preview choreo-xr"><span>OPTIONAL WEBXR PREVIEW · REAL HEADSET QA PENDING</span></div>
          <p>Screen classes are demonstrations only. Quest matches reflect hand-controller proximity to authored cues, not whole-body form, fitness or footwork.</p>
        </section>
      </div>
      {receipt&&<section className="quest-card quest-receipt">
        <h2>UNVERIFIED SESSION RECEIPT</h2><p>Aggregate controller counts only, with no song data, pose traces, personal identifiers or health claims.</p>
        <button onClick={()=>navigator.clipboard?.writeText(JSON.stringify(receipt,null,2)).catch(()=>{})}>COPY LOCAL RECEIPT</button>
        <pre>{JSON.stringify(receipt,null,2)}</pre>
      </section>}
      <footer className="quest-foot"><span>PULSE369 / DANCEFLOW R1 · LOCAL FIRST</span><a href="index.html">BACK TO PULSE369 ↗</a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<Choreographer/>);
