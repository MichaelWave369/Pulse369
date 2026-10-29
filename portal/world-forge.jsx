import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import * as THREE from 'three';
import './styles.css';
import './world-forge.css';
import {MAX_FILE_BYTES,SAMPLE_WORLD,readWorldFile,writeWorldPack,activeCue} from './world-bridge.mjs';
import {createWorldVisual} from './world-bridge-three.mjs';

const domistika='https://michaelwave369.github.io/Domistika/xr.html';
function WorldForge(){
  const mount=useRef(null),engine=useRef(null),settings=useRef({bpm:120,reduced:false,playing:true});
  const [pack,setPack]=useState(SAMPLE_WORLD);
  const [bpm,setBpm]=useState(120),[reduced,setReduced]=useState(false),[playing,setPlaying]=useState(true);
  const [support,setSupport]=useState('Checking WebXR…'),[vr,setVr]=useState(false);
  const [notice,setNotice]=useState('Sample stage ready. Load a Domistika Showpack or workshop JSON to preview your own.');
  const [cue,setCue]=useState(SAMPLE_WORLD.show.cues[0].title);
  useEffect(()=>{settings.current={bpm,reduced,playing};},[bpm,reduced,playing]);
  useEffect(()=>{
    let live=true;
    if(!window.isSecureContext || !navigator.xr){setSupport('VR needs HTTPS and a WebXR-capable headset. Desktop preview is available.');return;}
    navigator.xr.isSessionSupported('immersive-vr').then(ok=>{
      if(live)setSupport(ok?'Quest/WebXR available':'Immersive VR unavailable on this browser');
    }).catch(()=>{if(live)setSupport('Could not check VR support');});
    return()=>{live=false;};
  },[]);
  useEffect(()=>{
    if(!mount.current)return;
    let renderer,scene,visual,observer;
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
      renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
      renderer.xr.enabled=true;
      renderer.xr.setReferenceSpaceType('local-floor');
      renderer.setClearColor(0x071220,1);
      mount.current.appendChild(renderer.domElement);
      scene=new THREE.Scene();
      scene.background=new THREE.Color(0x071220);
      visual=createWorldVisual(SAMPLE_WORLD);
      scene.add(visual.stage);
      const live={renderer,scene,visual,seconds:0,lastFrame:null,session:null};
      engine.current=live;
      const resize=()=>{
        if(!mount.current)return;
        const w=Math.max(1,mount.current.clientWidth),h=Math.max(1,mount.current.clientHeight);
        renderer.setSize(w,h,false);
        if(live.visual){
          live.visual.camera.aspect=w/h;
          live.visual.camera.updateProjectionMatrix();
        }
      };
      observer=new ResizeObserver(resize);observer.observe(mount.current);resize();
      let lastCue='';
      renderer.setAnimationLoop(time=>{
        if(!engine.current)return;
        const dt=live.lastFrame===null?0:Math.min(.1,Math.max(0,(time-live.lastFrame)/1000));
        live.lastFrame=time;
        if(settings.current.playing)live.seconds+=dt;
        const current=live.visual.update(live.seconds,settings.current.bpm,settings.current.reduced);
        if(current?.title!==lastCue){lastCue=current?.title;setCue(lastCue);}
        renderer.render(scene,live.visual.camera);
      });
    }catch(error){setNotice('WebGL preview failed: '+(error?.message||'Unknown renderer error'));}
    return()=>{
      if(renderer)renderer.setAnimationLoop(null);
      const session=engine.current?.session;
      if(session)void session.end().catch(()=>{});
      observer?.disconnect();
      visual?.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
      engine.current=null;
    };
  },[]);
  useEffect(()=>{
    const live=engine.current;
    if(!live || live.session)return;
    const fresh=createWorldVisual(pack);
    live.scene.add(fresh.stage);
    const old=live.visual;
    live.visual=fresh;
    live.seconds=0;live.lastFrame=null;
    fresh.camera.aspect=Math.max(.1,live.renderer.domElement.clientWidth/Math.max(1,live.renderer.domElement.clientHeight));
    fresh.camera.updateProjectionMatrix();
    old?.dispose();
    setCue(pack.show.cues[0].title);
  },[pack]);
  const load=async event=>{
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file || vr)return;
    try{
      if(file.size>MAX_FILE_BYTES)throw Error('File exceeds 2.25 MB');
      const next=readWorldFile(await file.text());
      setPack(next);
      setNotice('Imported locally: '+next.workshop.objects.length+' objects · '+next.show.cues.length+' visual cues. No upload or data transfer.');
    }catch(error){setNotice('Import rejected (previous world preserved): '+(error?.message||'Unknown format'));}
  };
  const exportWorld=()=>{
    try{
      const data=writeWorldPack(pack);
      const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
      const a=document.createElement('a');
      a.href=url;a.download='pulse369-worldpack-v1.json';
      a.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice('Worldpack exported locally. Original Domistika project remains unchanged.');
    }catch(error){setNotice('Export failed: '+error.message);}
  };
  const enterVR=async()=>{
    const live=engine.current;
    if(!live || live.session || !navigator.xr)return;
    let session;
    try{
      // Request from the direct user gesture, not a React effect.
      session=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});
      live.session=session;
      const onEnd=()=>{live.session=null;live.lastFrame=null;setVr(false);setNotice('Exited VR preview. World still loaded locally.');};
      session.addEventListener('end',onEnd,{once:true});
      await live.renderer.xr.setSession(session);
      setVr(true);setNotice('VR visual preview active. No room movement, targets, or gameplay scoring.');
    }catch(error){
      if(session)void session.end().catch(()=>{});
      live.session=null;setVr(false);
      setNotice('Could not enter VR: '+(error?.message||'WebXR session failed'));
    }
  };
  const leaveVR=()=>{if(engine.current?.session)void engine.current.session.end().catch(()=>{});};
  const duration=pack.show.cues.reduce((n,c)=>n+c.duration,0);
  return <div className="wf-shell">
    <header className="wf-header"><a className="wf-brand" href="index.html">ϕ PULSE <strong>369</strong></a><nav><a href="quest.html">QUEST LAB</a><a href={domistika} target="_blank" rel="noreferrer">DOMISTIKA XR ↗</a></nav></header>
    <main className="wf-main">
      <p className="wf-eyebrow">[ PULSE369 × DOMISTIKA XR / WORLD BRIDGE R1 ]</p>
      <h1>WORLD <em>FORGE</em></h1>
      <p className="wf-intro">Build a 3D installation in DomistikaXR. Export its <strong>Showpack JSON</strong> or workshop JSON. Open it here for a safe, visual-only desktop or Quest 3 preview. The original workout and dance engines remain untouched.</p>
      <div className="wf-layout">
        <section className="wf-card wf-stage" aria-label="3D world preview">
          <div className="wf-bar"><strong>{pack.title}</strong><span>LOCAL PREVIEW · {pack.workshop.objects.length} OBJECTS</span></div>
          <div ref={mount} className="wf-canvas" aria-label="Three-dimensional installation preview"/>
          <div className="wf-caption"><span>Visual act: <strong aria-live="polite">{cue}</strong></span><span>{duration}s repeating show · no soundtrack</span></div>
          <p className="wf-minor">This prototype does not place actual workout targets, score movements, measure fitness, use cameras or microphones, or synchronize to an audio file. The BPM control is a silent visual metronome only.</p>
        </section>
        <section className="wf-card">
          <h2>01 · LOAD YOUR WORLD</h2>
          <label className="wf-upload">IMPORT DOMISTIKA JSON
            <input type="file" accept=".json,application/json" onChange={load} disabled={vr}/>
          </label>
          <div className="wf-actions">
            <button type="button" onClick={()=>{if(!vr){setPack(SAMPLE_WORLD);setNotice('Loaded the built-in Pulse Portal sample.');}}} disabled={vr}>TRY SAMPLE</button>
            <button type="button" onClick={exportWorld}>EXPORT WORLD PACK</button>
          </div>
          <p className="wf-status" role="status">{notice}</p>
          <h2>02 · PREVIEW SETTINGS</h2>
          <label className="wf-field">VISUAL BEAT RATE <strong>{bpm} BPM</strong>
            <input type="range" min="60" max="180" step="5" value={bpm} onChange={e=>setBpm(Number(e.target.value))}/>
          </label>
          <label className="wf-check"><input type="checkbox" checked={reduced} onChange={e=>setReduced(e.target.checked)}/> Reduced motion / steady lighting</label>
          <label className="wf-check"><input type="checkbox" checked={playing} onChange={e=>setPlaying(e.target.checked)}/> Play visual timeline</label>
          <h2>03 · STEP INSIDE</h2>
          <p className="wf-minor">{support}</p>
          <div className="wf-actions">
            <button type="button" className="wf-primary" onClick={enterVR} disabled={vr || !engine.current || !navigator.xr}>ENTER VR PREVIEW</button>
            <button type="button" onClick={leaveVR} disabled={!vr}>EXIT VR</button>
          </div>
          <p className="wf-minor">While in Quest, use the headset's normal browser Exit VR control. No teleporting, artificial locomotion, collisions, or physical boundary changes. Keep a clear play area.</p>
        </section>
      </div>
      <div className="wf-how">
        <div><b>CREATE</b><span>DomistikaXR → Show Forge / Spatial Workshop</span></div>
        <div><b>EXPORT</b><span>Download Showpack v1 JSON (not static GLB)</span></div>
        <div><b>PREVIEW</b><span>Import → desktop visual → optional Quest 3</span></div>
      </div>
      <p className="wf-footer">RUNG 1 · Portable geometry, rest poses, motion and visual cue descriptions. Dedicated Pulse369 workout integration, audio-clock sync, anchors and scoring remain follow-on work. <a href="https://github.com/MichaelWave369/Pulse369">VIEW SOURCE ↗</a></p>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<WorldForge/>);
