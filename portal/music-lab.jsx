import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { computeReachLayout, makeQuestReceipt } from './quest-math.mjs';
import { classifyMusicTouch, checkMusicSettings, inspectAudioFile, musicBeatAt, nextMusicBeat } from './quest-local-music.mjs';
import { RHYTHM_BEATS, summarizeRhythm } from './quest-rhythm.mjs';
import './styles.css';
import './quest-lab.css';
import './music-lab.css';

// WebXR and audio experiments run entirely inside the visitor's browser.
// Audio files never leave memory; no fetch/upload/account/analytics calls.
const fmt = value => Number.isFinite(value) ? value.toFixed(1) : '—';

function makeSign(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas text rendering is unavailable.');
  ctx.fillStyle = '#0f2434'; ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle = '#d1fc74'; ctx.lineWidth = 8; ctx.strokeRect(5,5,1014,246);
  ctx.fillStyle = '#d1fc74'; ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center'; ctx.fillText('PULSE 369 · LOCAL MUSIC',512,90);
  ctx.fillStyle = '#e4f6ff'; ctx.font = '33px sans-serif'; ctx.fillText(text,512,171);
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.75,.44),
    new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  mesh.visible = false;
  return mesh;
}

function tryHaptic(input) {
  try {
    const old = input.gamepad?.hapticActuators?.[0];
    if (old?.pulse) { void Promise.resolve(old.pulse(.28,45)).catch(()=>{}); return; }
    const modern = input.gamepad?.vibrationActuator;
    if (modern?.playEffect) void Promise.resolve(modern.playEffect('dual-rumble', {
      duration:45, strongMagnitude:.28, weakMagnitude:.18
    })).catch(()=>{});
  } catch { /* Haptics are optional. */ }
}

function MusicLab() {
  const host = useRef(null);
  const running = useRef(null);
  const [phase,setPhase] = useState('idle');
  const [support,setSupport] = useState('Checking WebXR…');
  const [file,setFile] = useState(null);
  const [audioCheck,setAudioCheck] = useState('Choose a downloaded MP3 or WAV under 24 MB.');
  const [fileReady,setFileReady] = useState(false);
  const [posture,setPosture] = useState('standing');
  const [bpm,setBpm] = useState(120);
  const [offsetMs,setOffsetMs] = useState(0);
  const [status,setStatus] = useState('Nothing is uploaded. Select a file to start.');
  const [reading,setReading] = useState({beat:'—',left:0,right:0,controllers:0,recenters:0});
  const [receipt,setReceipt] = useState(null);

  useEffect(()=>{
    let live=true;
    if (!window.isSecureContext || !navigator.xr) {
      setSupport('Immersive VR requires HTTPS and a compatible headset browser.');
      return;
    }
    navigator.xr.isSessionSupported('immersive-vr')
      .then(ok=>{if(live)setSupport(ok?'Immersive VR is available.':'This browser does not support immersive VR.');})
      .catch(error=>{if(live)setSupport('Could not query VR support: '+error.message);});
    return ()=>{live=false;};
  },[]);
  useEffect(()=>()=>{if(running.current)void running.current.session.end().catch(()=>{});},[]);

  async function pickFile(event) {
    const chosen = event.target.files?.[0] || null;
    setFile(null); setFileReady(false); setReceipt(null);
    if (!chosen) {setAudioCheck('Choose a downloaded MP3 or WAV under 24 MB.');return;}
    try {
      if (chosen.size > 24*1024*1024 || chosen.size<=0) {
        setAudioCheck('This file is empty or over the 24 MB limit.'); return;
      }
      const bytes = new Uint8Array(await chosen.slice(0,12).arrayBuffer());
      const verdict = inspectAudioFile(chosen,bytes);
      if (!verdict.ok) {setAudioCheck(verdict.reason);return;}
      setFile(chosen);setFileReady(true);
      setAudioCheck('Ready locally: '+chosen.name+' · '+(chosen.size/1048576).toFixed(1)+' MB. No upload.');
    } catch (error) {setAudioCheck('Unable to inspect this file: '+error.message);}
  }

  async function enter() {
    if (phase!=='idle'||!fileReady||!file||!navigator.xr) return;
    const configError = checkMusicSettings(bpm,offsetMs,90);
    if (configError && !configError.startsWith('This 24-beat drill')) {setStatus(configError);return;}
    setPhase('starting');setReceipt(null);
    setReading({beat:'—',left:0,right:0,controllers:0,recenters:0});
    setStatus('Requesting VR and preparing local audio…');
    let session=null,ctx=null,renderer=null,scene=null,sourceNode=null;
    let started=false,finished=false,ended=false,problem=null;
    const startedAt=Date.now(),touches=[0,0],seen=new Set(),errors=[];
    let maxControllers=0,recenters=0,startAudioAt=0;

    const clean=()=>{
      if (ended) return;
      ended=true;
      try{renderer?.setAnimationLoop(null);}catch{}
      try{sourceNode?.stop();}catch{}
      try{sourceNode?.disconnect();}catch{}
      if (scene) scene.traverse(obj=>{
        obj.geometry?.dispose();
        for(const material of Array.isArray(obj.material)?obj.material:obj.material?[obj.material]:[]) {
          material.map?.dispose();material.dispose();
        }
      });
      try{renderer?.dispose();renderer?.domElement.remove();}catch{}
      if (ctx && ctx.state!=='closed') void ctx.close().catch(()=>{});
      running.current=null;
      if(started) setReceipt({
        ...makeQuestReceipt({
          posture,touches,controllers:maxControllers,
          recenters:Math.max(0,recenters-1),elapsedMs:Date.now()-startedAt
        }),
        schema:'pulse369.local-music-lab.v1',
        localMusic:{source:'local-file-not-uploaded',manualBpm:bpm,manualBeatOffsetMs:offsetMs},
        rhythm:summarizeRhythm(errors,bpm),
      });
      setPhase('idle');
      setStatus(problem || (finished?'Finished all 24 visual beats. Anonymous summary available.':
        'VR ended. Anonymous summary available if music started.'));
    };

    let resumePromise;
    try {
      // Both calls occur in the user's direct click handler for browser activation.
      const xrPromise=navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
      const AudioCtor=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtor) throw new Error('Web Audio is not supported in this browser.');
      ctx=new AudioCtor({latencyHint:'interactive'});
      resumePromise=ctx.resume();
      session=await xrPromise;
      session.addEventListener('end',clean,{once:true});
      await resumePromise;
      const audioBytes=await file.arrayBuffer();
      const buffer=await ctx.decodeAudioData(audioBytes);
      const validation=checkMusicSettings(bpm,offsetMs,buffer.duration);
      if(validation) throw new Error(validation);
      sourceNode=ctx.createBufferSource();
      sourceNode.buffer=buffer;
      const gain=ctx.createGain();
      gain.gain.value=.55;
      sourceNode.connect(gain);gain.connect(ctx.destination);

      renderer=new THREE.WebGLRenderer({antialias:true});
      renderer.setPixelRatio(1);renderer.setSize(640,360);
      renderer.xr.enabled=true;
      renderer.xr.setReferenceSpaceType('local-floor');
      if(!host.current) throw new Error('Scene mount no longer exists.');
      host.current.appendChild(renderer.domElement);
      scene=new THREE.Scene();
      scene.background=new THREE.Color('#0b1429');
      const camera=new THREE.PerspectiveCamera(70,640/360,.05,50);
      camera.position.set(0,1.6,0);camera.lookAt(0,1.3,-.9);
      scene.add(new THREE.GridHelper(3.5,10,0x63b2d6,0x374e6d));
      const sign=makeSign('GRIP = RECENTER  ·  TRIGGER = FINISH');
      scene.add(sign);
      const colors=[0xc1a4ff,0xc7f876];
      const targets=colors.map(color=>{
        const mesh=new THREE.Mesh(new THREE.TorusGeometry(.17,.035,8,28),
          new THREE.MeshBasicMaterial({color}));
        mesh.visible=false;scene.add(mesh);return mesh;
      });
      const gripNodes=[],sources=[null,null],touching=[false,false],hands=[];
      let shouldRecenter=true;
      for(let i=0;i<2;i++){
        const grip=renderer.xr.getControllerGrip(i), controller=renderer.xr.getController(i);
        const hand=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),
          new THREE.MeshBasicMaterial({color:0xe7f7ff}));
        hand.visible=false;grip.add(hand);
        scene.add(grip,controller);
        gripNodes.push(grip);hands.push(hand);
        controller.addEventListener('connected',event=>{sources[i]=event.data;hand.visible=true;});
        controller.addEventListener('disconnected',()=>{sources[i]=null;hand.visible=false;touching[i]=false;});
        controller.addEventListener('selectstart',()=>{void session.end().catch(()=>{});});
        controller.addEventListener('squeezestart',()=>{shouldRecenter=true;});
      }

      running.current={session};
      await renderer.xr.setSession(session);
      // The *same* audio clock drives file playback and authored beat evaluation.
      startAudioAt=ctx.currentTime+2.4;
      sourceNode.start(startAudioAt);
      started=true;setPhase('active');
      setStatus('Playing only in this browser. Touch alternating rings on the beat; press trigger to finish.');
      const position=new THREE.Vector3(),head=new THREE.Vector3(),forward=new THREE.Vector3();
      const periodSec=60/bpm;
      let lastRead=-Infinity;
      renderer.setAnimationLoop(frameTime=>{
        if(ended)return;
        const xrCamera=renderer.xr.getCamera();
        xrCamera.getWorldPosition(head);
        if(shouldRecenter){
          xrCamera.getWorldDirection(forward);
          const layout=computeReachLayout(head,forward,posture);
          if(layout){
            targets[0].position.fromArray(layout.left);
            targets[1].position.fromArray(layout.right);
            targets.forEach(mesh=>{mesh.visible=true;});
            sign.position.fromArray(layout.label);sign.rotation.y=layout.labelYaw;sign.visible=true;
            touching.fill(false);recenters++;shouldRecenter=false;
          }
        }
        const clock=ctx.currentTime;
        const next=nextMusicBeat(clock,startAudioAt,bpm,offsetMs);
        const nearest=musicBeatAt(clock,startAudioAt,bpm,offsetMs);
        const cue=[1,1];
        if(next && next.untilMs>=0 && next.untilMs<=190){
          cue[next.index%2]=1.12+.16*(1-next.untilMs/190);
        }
        if(nearest && Math.abs(nearest.errorMs)<=125)cue[nearest.index%2]=1.29;
        for(let i=0;i<2;i++){
          targets[i].material.color.setHex(cue[i]>1?0xffffff:colors[i]);
          targets[i].scale.setScalar(cue[i]);
        }
        maxControllers=Math.max(maxControllers,sources.filter(Boolean).length);
        for(let i=0;i<gripNodes.length;i++){
          const input=sources[i];
          if(!input)continue;
          const side=input.handedness==='left'?0:input.handedness==='right'?1:-1;
          if(side<0)continue;
          gripNodes[i].getWorldPosition(position);
          const inside=targets[side].visible && !shouldRecenter
            && position.distanceTo(targets[side].position)<.21;
          if(inside&&!touching[i]){
            const beat=classifyMusicTouch(clock,startAudioAt,bpm,offsetMs,input.handedness,seen);
            if(beat){
              seen.add(beat.index);errors.push(beat.errorMs);
              touches[side]++;tryHaptic(input);
            }
          }
          touching[i]=inside;
          targets[side].scale.setScalar(inside?1.35:cue[side]);
        }
        if(frameTime-lastRead>300){
          lastRead=frameTime;
          const songSeconds=clock-startAudioAt-offsetMs/1000;
          const count=Math.max(0,Math.min(RHYTHM_BEATS,Math.floor(songSeconds/periodSec)+1));
          setReading({beat:count+' / '+RHYTHM_BEATS,left:touches[0],right:touches[1],
            controllers:sources.filter(Boolean).length,recenters:Math.max(0,recenters-1)});
        }
        const afterLast=offsetMs/1000+(RHYTHM_BEATS-1)*periodSec+.7;
        if(!finished && clock-startAudioAt>afterLast){
          finished=true;
          void session.end().catch(()=>{});
        }
        renderer.render(scene,camera);
      });
    } catch(e) {
      problem='Could not start local music VR: '+(e?.message||'Unknown error');
      if(session){try{await session.end();}catch{}}
      clean();
    }
  }

  const exit=()=>{
    if(running.current)void running.current.session.end().catch(e=>setStatus(e.message));
  };
  const copy=async()=>{
    if(!receipt)return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(receipt,null,2));
      setStatus('Anonymous result copied. The selected audio file was not included.');
    } catch {setStatus('Clipboard unavailable. Select the report text to copy it manually.');}
  };

  return <div className="shell quest-shell">
    <header className="quest-header">
      <a href="./" className="logo"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <a href="quest.html">← QUEST LAB</a>
    </header>
    <main className="quest-main">
      <p className="eyebrow">PULSE 369 / LOCAL MUSIC / NO CLOUD</p>
      <h1>MUSIC <em>LAB.</em></h1>
      <p className="quest-sub">Put one of your own downloaded tracks into a tiny, experimental WebXR rhythm drill. Your file stays on this device. Manually enter the BPM and beat offset. No Suno connection or music upload is involved.</p>
      <div className="quest-grid">
        <section className="quest-card">
          <h2>01 / PREPARE YOUR OWN MUSIC</h2>
          <p><strong>{support}</strong></p>
          <label className="music-picker">LOCAL MP3 OR WAV
            <input aria-label="Choose local MP3 or WAV file" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav"
              disabled={phase!=='idle'} onChange={pickFile}/>
          </label>
          <p role="status">{audioCheck}</p>
          <div className="music-fields">
            <label>BPM (MANUAL)
              <input type="number" min="60" max="180" step="1" value={bpm} disabled={phase!=='idle'}
                onChange={e=>setBpm(Number(e.target.value))}/>
            </label>
            <label>BEAT OFFSET (MS)
              <input type="number" min="0" max="1000" step="25" value={offsetMs} disabled={phase!=='idle'}
                onChange={e=>setOffsetMs(Number(e.target.value))}/>
            </label>
          </div>
          <fieldset className="quest-posture" disabled={phase!=='idle'}><legend>REACH MODE</legend>
            <label><input type="radio" checked={posture==='standing'} onChange={()=>setPosture('standing')}/> Standing</label>
            <label><input type="radio" checked={posture==='seated'} onChange={()=>setPosture('seated')}/> Seated</label>
          </fieldset>
          <p>In Quest Browser, enter VR. Your song will begin after a short lead-in. Follow the alternating left/right cues. Grip to recenter; trigger to exit. The 24-beat test ends automatically.</p>
          <div className="quest-actions">
            <button disabled={phase!=='idle'||!fileReady||!navigator.xr} onClick={enter}>START LOCAL MUSIC VR ↗</button>
            <button className="secondary" disabled={phase!=='active'} onClick={exit}>FINISH</button>
          </div>
          <p role="status" className="notice">{status}</p>
          <div className="quest-preview" ref={host}><span>WEBXR · LOCAL AUDIO · NO UPLOAD</span></div>
        </section>
        <section className="quest-card">
          <h2>02 / LIVE RHYTHM</h2>
          <div className="quest-metrics">
            <div><span>VISUAL BEATS</span><strong>{reading.beat}</strong></div>
            <div><span>CONTROLLERS</span><strong>{reading.controllers} / 2</strong></div>
            <div><span>LEFT TOUCHES</span><strong>{reading.left}</strong></div>
            <div><span>RIGHT TOUCHES</span><strong>{reading.right}</strong></div>
            <div><span>RECENTERS</span><strong>{reading.recenters}</strong></div>
          </div>
          <h2>03 / WHAT THIS DOES NOT MEASURE</h2>
          <p>Music playback and the authored visual chart share the Web Audio clock. That doesn't calibrate headset rendering latency, speaker output latency, precise audio transients, or physical reaction time. BPM and beat offset are entered by you, not detected automatically.</p>
          <p>File bytes, names, controller poses and health data are not uploaded or included in the optional receipt. Don't turn up the volume enough to drown out your surroundings. Stay in a clear space and stop if uncomfortable.</p>
          {receipt && <div className="quest-receipt"><h2>04 / ANONYMOUS RESULTS</h2>
            <p>Aggregate timing only. No music filename, audio data or individual touch timestamps.</p>
            <button type="button" onClick={copy}>COPY QA RECEIPT</button>
            <pre aria-label="Local music diagnostic receipt">{JSON.stringify(receipt,null,2)}</pre>
          </div>}
        </section>
      </div>
      <footer className="quest-foot">
        <a href="https://github.com/MichaelWave369/Pulse369">SOURCE ↗</a>
        <span>LOCAL BROWSER EXPERIMENT · NO SUNO API · NO CLOUD UPLOAD</span>
      </footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<MusicLab/>);
