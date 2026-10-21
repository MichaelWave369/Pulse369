import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { DANCE_STYLES, DANCE_BEATS, DANCE_LEAD_MS, DANCE_TEMPOS, danceMove, danceBeatAt, poseMatches, danceReceipt } from './dance-core.mjs';
import './styles.css';
import './quest-lab.css';
import './dance-lab.css';

const UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_READING = { count:0, phrase:'READY', coach:'Pick a groove and preview the eight-count phrase.', hits:0, hands:0 };

function worldTarget(target, head, right, forward) {
  return new THREE.Vector3().copy(head)
    .addScaledVector(right,target.x)
    .addScaledVector(forward,-target.z)
    .addScaledVector(UP,target.y);
}
function shortBeat(ctx, downbeat) {
  if (!ctx || ctx.state !== 'running') return;
  try {
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type='sine'; osc.frequency.setValueAtTime(downbeat ? 210 : 140,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(downbeat ? 80 : 70,ctx.currentTime+.065);
    gain.gain.setValueAtTime(.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(downbeat ? .09 : .045,ctx.currentTime+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.09);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime+.095);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  } catch { /* Optional synthetic guide audio must never break VR. */ }
}
function makeStage(scene) {
  const floor=new THREE.Mesh(new THREE.CircleGeometry(2.1,64),new THREE.MeshBasicMaterial({color:0x17345d,transparent:true,opacity:.65,side:THREE.DoubleSide}));
  floor.rotation.x=-Math.PI/2; floor.position.y=.008; scene.add(floor);
  for (let i=1;i<=4;i++) {
    const ring=new THREE.Mesh(new THREE.RingGeometry(i*.37,i*.37+.012,96),new THREE.MeshBasicMaterial({color:i%2?0x79e9f5:0xb5f977,side:THREE.DoubleSide,transparent:true,opacity:.36}));
    ring.rotation.x=-Math.PI/2; ring.position.y=.014+i*.003; scene.add(ring);
  }
  scene.add(new THREE.HemisphereLight(0x9ed8ff,0x182244,1.8));
  const light=new THREE.PointLight(0xbc94ff,25,6); light.position.set(0,2,-2);scene.add(light);
}
function DanceLab() {
  const host=useRef(null), running=useRef(null), previewTimer=useRef(null);
  const [style,setStyle]=useState('groove');
  const [bpm,setBpm]=useState(112);
  const [posture,setPosture]=useState('standing');
  const [phase,setPhase]=useState('idle');
  const [support,setSupport]=useState('Checking WebXR support…');
  const [status,setStatus]=useState('Choose a style and begin with the eight-count preview.');
  const [reading,setReading]=useState(DEFAULT_READING);
  const [receipt,setReceipt]=useState(null);
  const [preview,setPreview]=useState(false);

  useEffect(()=>{
    let active=true;
    if(!window.isSecureContext || !navigator.xr){
      setSupport('Quest VR needs HTTPS and a WebXR-compatible headset browser.');
      return;
    }
    navigator.xr.isSessionSupported('immersive-vr')
      .then(ok=>{if(active)setSupport(ok?'Immersive VR supported (hardware play still unverified).':'Immersive VR is not supported here.');})
      .catch(e=>{if(active)setSupport('VR availability check failed: '+e.message);});
    return()=>{active=false;};
  },[]);
  useEffect(()=>()=> {
    if(previewTimer.current)clearInterval(previewTimer.current);
    if(running.current)void running.current.session.end().catch(()=>{});
  },[]);

  function stopPreview(){
    if(previewTimer.current){clearInterval(previewTimer.current);previewTimer.current=null;}
    setPreview(false);
  }
  function startPreview(){
    if(phase!=='idle'||previewTimer.current)return;
    setReceipt(null);
    setPreview(true);
    setStatus('Screen-only choreography preview. It does not measure movement.');
    let i=0;
    setReading({count:1,phrase:danceMove(style,0).name,coach:danceMove(style,0).coach,hits:0,hands:0});
    previewTimer.current=setInterval(()=>{
      i++;
      if(i>=16){stopPreview();setStatus('Two phrases previewed. Put on the headset for controller cue matching.');return;}
      const move=danceMove(style,i);
      setReading({count:i+1,phrase:move.name,coach:move.coach,hits:0,hands:0});
    },60000/bpm);
  }
  function stopVR(){if(running.current)void running.current.session.end().catch(()=>{});}

  async function enterVR(){
    if(phase!=='idle'||preview||!navigator.xr)return;
    setReceipt(null);setReading(DEFAULT_READING);setPhase('starting');
    setStatus('Requesting immersive VR; remain in a clear stationary play area.');
    let session;
    try {
      session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
    }catch(error){
      setPhase('idle');setStatus('VR entry was declined or unavailable: '+(error?.message||'unknown error'));return;
    }
    let renderer=null, scene=null, audio=null, ended=false, beatAnchor=null;
    let hits=0, countDisplayed=-1, lastClicked=-1, offered=0;
    const scored=new Set(), grips=[null,null], handPos={};
    const cleanup=()=>{
      if(ended)return;
      ended=true;
      try{renderer?.setAnimationLoop(null);}catch{}
      scene?.traverse(obj=>{
        obj.geometry?.dispose?.();
        const mats=Array.isArray(obj.material)?obj.material:(obj.material?[obj.material]:[]);
        mats.forEach(m=>{m.map?.dispose?.();m.dispose?.();});
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      if(audio)void audio.close().catch(()=>{});
      running.current=null;
      setPhase('idle');
      setReceipt(danceReceipt({style,bpm,posture,hits,completedBeats:offered}));
      setStatus('Session finished. Your local, unverified controller-cue summary is below.');
    };
    session.addEventListener('end',cleanup,{once:true});

    try{
      renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      renderer.setSize(720,405);
      renderer.xr.enabled=true;
      renderer.xr.setReferenceSpaceType('local-floor');
      if(!host.current)throw new Error('Studio preview is no longer available.');
      host.current.appendChild(renderer.domElement);
      scene=new THREE.Scene();
      scene.background=new THREE.Color('#080d25');
      makeStage(scene);
      const camera=new THREE.PerspectiveCamera(70,720/405,.01,100);
      camera.position.set(0,1.6,1.5);
      const focusLight=new THREE.AmbientLight(0xffffff,.85);scene.add(focusLight);
      const targets=[0,1].map((_,i)=>{
        const mesh=new THREE.Mesh(new THREE.TorusGeometry(.12,.026,9,28),new THREE.MeshBasicMaterial({
          color:i?0x83d8ff:0xcaff70,transparent:true,opacity:.95,side:THREE.DoubleSide
        }));
        mesh.visible=false;scene.add(mesh);return mesh;
      });
      for(let i=0;i<2;i++){
        const g=renderer.xr.getControllerGrip(i);
        g.visible=false;
        g.userData.hand=null;
        const orb=new THREE.Mesh(new THREE.SphereGeometry(.065,12,12),new THREE.MeshBasicMaterial({color:i?0x83d8ff:0xcaff70}));
        g.add(orb);scene.add(g);
        g.addEventListener('connected',e=>{g.userData.hand=e.data?.handedness||null;g.visible=true;});
        g.addEventListener('disconnected',()=>{g.userData.hand=null;g.visible=false;});
        grips[i]=g;
      }
      const quit=()=>{void session.end().catch(()=>{});};
      grips.forEach(g=>g.addEventListener('selectstart',quit));
      await renderer.xr.setSession(session);
      // Only a synthesized click guide. Music import belongs to the existing local music lab.
      try{
        const Ctx=window.AudioContext||window.webkitAudioContext;
        if(Ctx){audio=new Ctx({latencyHint:'interactive'});await audio.resume();}
      }catch{audio=null;}
      if(ended)return;
      running.current={session};
      setPhase('active');
      setStatus('VR dance drill running. Follow the colored hand rings on each count. Trigger or headset menu exits.');
      const head=new THREE.Vector3(),right=new THREE.Vector3(),forward=new THREE.Vector3();
      const period=60000/bpm;
      renderer.setAnimationLoop(time=>{
        if(ended)return;
        if(beatAnchor===null)beatAnchor=time+DANCE_LEAD_MS;
        const elapsed=time-beatAnchor;
        const rawIndex=Math.round(elapsed/period);
        const index=Math.max(0,Math.min(DANCE_BEATS-1,rawIndex));
        const move=danceMove(style,index);
        const xrCamera=renderer.xr.getCamera();
        xrCamera.getWorldPosition(head);
        xrCamera.getWorldDirection(forward);forward.y=0;
        if(forward.lengthSq()<.05)forward.set(0,0,-1);
        forward.normalize();right.crossVectors(forward,UP).normalize();
        const targetPositions=move.hands.map(t=>{
          const v=worldTarget(t,head,right,forward);
          return {side:t.side,x:v.x,y:v.y,z:v.z};
        });
        for(let i=0;i<2;i++){
          const t=targetPositions.find(p=>p.side===(i===0?'left':'right')),mesh=targets[i];
          mesh.visible=!!t;
          if(t){mesh.position.set(t.x,t.y,t.z);mesh.lookAt(head);}
        }
        for(const key of Object.keys(handPos))delete handPos[key];
        for(const grip of grips){
          if(grip.visible && (grip.userData.hand==='left'||grip.userData.hand==='right')){
            const v=grip.getWorldPosition(new THREE.Vector3());
            handPos[grip.userData.hand]={x:v.x,y:v.y,z:v.z};
          }
        }
        const hit=danceBeatAt(time,beatAnchor,bpm);
        if(hit&&!scored.has(hit.index) && hit.index===index && poseMatches(handPos,targetPositions)){
          scored.add(hit.index);hits++;
        }
        if(elapsed>=0){
          offered=Math.min(DANCE_BEATS,Math.max(offered,Math.floor(elapsed/period)+1));
          const clicking=Math.floor(elapsed/period);
          if(clicking!==lastClicked && clicking>=0 && clicking<DANCE_BEATS){
            shortBeat(audio,clicking%8===0);lastClicked=clicking;
          }
        }
        if(index!==countDisplayed){
          countDisplayed=index;
          setReading({count:index+1,phrase:move.name,coach:move.coach,hits,hands:Object.keys(handPos).length});
        }
        for(let i=0;i<targets.length;i++){
          const mat=targets[i].material;
          mat.opacity=0.72+.22*Math.sin(time/135+i);
          targets[i].scale.setScalar(1+0.12*Math.sin(time/180+i));
        }
        renderer.render(scene,camera);
        if(elapsed>(DANCE_BEATS-1)*period+DANCE_WINDOW_MS+900)quit();
      });
    }catch(error){
      setStatus('VR setup failed: '+(error?.message||'unknown error'));
      try{await session.end();}catch{cleanup();}
    }
  }

  const disabled=phase!=='idle'||preview;
  const groove=DANCE_STYLES[style];
  return <div className="quest-shell dance-shell">
    <header className="quest-header"><a className="logo" href="index.html"><span className="sigil">ϕ</span>PULSE <b>369</b></a><a href="class.html">CHOREOGRAPHER R1 ↗</a></header>
    <main className="quest-main dance-main">
      <p className="eyebrow"><span className="dot"/> MOVEMENT LAB / EXPERIMENTAL VR CHOREOGRAPHY</p>
      <h1>DANCE<em>FLOW</em></h1>
      <div className="dance-r1-link"><strong>NEW · THE CHOREOGRAPHER</strong><p>Ready for a longer guided dance class? Learn the eight-count, rehearse, dance and cool down with optional local songs.</p><a className="btn solid" href="class.html">ENTER DANCEFLOW R1 ↗</a></div>
      <p className="quest-sub">Real eight-count dance phrases with workout-friendly arm movement, directional grooves and a neon studio. Learn the steps, repeat the phrase, then follow controller cues in your Quest. <strong>Never confuse controller accuracy with judging someone's dancing.</strong></p>
      <div className="dance-styles" aria-label="Dance style selection">
        {Object.entries(DANCE_STYLES).map(([key,data])=><button key={key} type="button" disabled={disabled} className={style===key?'selected':''} onClick={()=>{setStyle(key);setReading(DEFAULT_READING);}}>
          <small>{data.tag}</small><strong>{data.name}</strong><span>{data.moves[0].coach}</span>
        </button>)}
      </div>
      <div className="quest-grid">
        <section className="quest-card">
          <h2>YOUR SESSION</h2>
          <label className="quest-tempo">TEMPO
            <select value={bpm} disabled={disabled} onChange={e=>setBpm(Number(e.target.value))}>
              {DANCE_TEMPOS.map(x=><option key={x} value={x}>{x} BPM · {x===96?'EASY':x===112?'GROOVE':'ENERGY'}</option>)}
            </select>
            <small>64 counts (8 repetitions of an eight-count phrase). A short technique drill, not a complete fitness class.</small>
          </label>
          <fieldset className="quest-posture" disabled={disabled}>
            <legend>MOVEMENT ADAPTATION</legend>
            <label><input type="radio" name="posture" checked={posture==='standing'} onChange={()=>setPosture('standing')}/> Standing in place</label>
            <label><input type="radio" name="posture" checked={posture==='seated'} onChange={()=>setPosture('seated')}/> Seated arm-groove</label>
          </fieldset>
          <p className="dance-warning">Move only within your cleared play area. Footwork, squats, spins, leaps and big traveling steps are NOT required or scored. Keep shoulders relaxed, use comfortable ranges, stop for dizziness or pain, and follow your headset safety boundary.</p>
          <div className="quest-actions">
            <button onClick={preview?stopPreview:startPreview} disabled={phase!=='idle'}>{preview?'STOP PREVIEW':'PREVIEW COUNTS · SCREEN'}</button>
            <button className="secondary" onClick={phase==='active'?stopVR:enterVR} disabled={preview||phase==='starting'||(phase==='idle'&&!support.startsWith('Immersive VR supported'))}>{phase==='active'?'EXIT VR':'ENTER QUEST VR'}</button>
          </div>
          <p className="notice" role="status">{status}</p>
          <p className="dance-support">{support}</p>
          <p className="dance-warning">The built-in guide uses a simple synthesized beat, not imported music. For your own local songs, <a href="music.html">use the separate Music Lab</a>. Neither lab uploads your recordings or controller poses.</p>
        </section>
        <section className="quest-card">
          <h2>THE LIVE EIGHT-COUNT</h2>
          <div className="dance-live" aria-live="polite">
            <div className="dance-count"><span>COUNT</span><strong>{reading.count?((reading.count-1)%8)+1:'·'}</strong><small>{reading.count ? Math.min(8,Math.floor((reading.count-1)/8)+1)+'/8 PHRASES':'READY'}</small></div>
            <div className="dance-phrase"><span>{groove.name}</span><strong>{reading.phrase}</strong><p>{reading.coach}</p></div>
          </div>
          <div className="quest-metrics">
            <div><span>CONTROLLER CUES MATCHED</span><strong>{reading.hits}</strong></div>
            <div><span>TRACKED CONTROLLERS</span><strong>{reading.hands}</strong></div>
          </div>
          <h2>VR STUDIO PREVIEW</h2>
          <div ref={host} className="quest-preview"><span>WEBXR · DEVICE TEST REQUIRED</span>{phase==='idle'&&<p>No headset session running.</p>}</div>
          <p>Green and blue rings guide the left and right hands. Reach gently on the beat. The display scores only nearby tracked hands within the cue window. No body or foot tracking.</p>
        </section>
      </div>
      {receipt&&<section className="quest-card quest-receipt">
        <h2>LOCAL UNVERIFIED SESSION RECEIPT</h2>
        <p>Only the style, tempo, posture, count and matched controller cues are included. Hardware accuracy and workout effectiveness have not been established.</p>
        <button onClick={()=>navigator.clipboard?.writeText(JSON.stringify(receipt,null,2)).catch(()=>{})}>COPY SANITIZED RECEIPT</button>
        <pre>{JSON.stringify(receipt,null,2)}</pre>
      </section>}
      <footer className="quest-foot"><span>PULSE369 / DANCEFLOW R0 · LOCAL-ONLY EXPERIMENT</span><a href="index.html">BACK TO PORTAL ↗</a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<DanceLab />);
