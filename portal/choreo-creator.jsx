import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DANCE_STYLES } from './dance-core.mjs';
import { preflightLocalAudio } from './quest-local-music.mjs';
import { sampleDirectedPose, directionAt } from './dance-director.mjs';
import MotionCoachFigure from './motion-coach-figure.jsx';
import {
  MAX_CHART_BYTES, MAX_PHRASES, STYLES, starterChart,normalizeChart,
  encodeChart,parseChart,totalCounts,cueForCount,replaceStep,replacePhrase,
  addPhrase,duplicatePhrase,deletePhrase,movePhrase,trackLengthError,
  chartPreviewReceipt, makeStep
} from './choreo-model.mjs';
import './styles.css';
import './quest-lab.css';
import './choreo-creator.css';

function beep(ctx,accent){
  try{
    if(ctx.state!=='running')return;
    const t=ctx.currentTime;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(accent?218:124,t);
    osc.frequency.exponentialRampToValueAtTime(82,t+.07);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(accent?.075:.035,t+.01);
    gain.gain.exponentialRampToValueAtTime(.0001,t+.1);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+.11);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }catch{ /* Count pulse is optional. */ }
}
function downloadChart(chart){
  const encoded=encodeChart(chart);
  const blob=new Blob([encoded],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=(chart.title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9-_]+/g,'-').replace(/^-|-$/g,'')||'pulse369-routine')+'.danceflow.json';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}

const INITIAL='Select a count, choose a move, then preview your routine. Nothing uploads or saves automatically.';

function Creator(){
  const [chart,setChart]=useState(starterChart);
  const [phraseIndex,setPhraseIndex]=useState(0);
  const [beatIndex,setBeatIndex]=useState(0);
  const [titleDraft,setTitleDraft]=useState('MY DANCEFLOW MIX');
  const [nameDraft,setNameDraft]=useState('OPENING GROOVE');
  const [status,setStatus]=useState(INITIAL);
  const [mode,setMode]=useState('guide');
  const [trackReady,setTrackReady]=useState(false);
  const [trackStatus,setTrackStatus]=useState('No local audio selected.');
  const [playing,setPlaying]=useState(false);
  const [playingIndex,setPlayingIndex]=useState(-1);
  const [coachPose,setCoachPose]=useState(null);
  const [reducedMotion,setReducedMotion]=useState(false);
  const [expression,setExpression]=useState('showtime');
  const [lastCount,setLastCount]=useState(0);
  const [undoCount,setUndoCount]=useState(0);
  const audio=useRef(null),audioToken=useRef(0),run=useRef(null),history=useRef([]);
  const chartRef=useRef(chart);
  chartRef.current=chart;

  const total=totalCounts(chart);
  const phrase=chart.phrases[phraseIndex];
  const beat=phrase.steps[beatIndex];
  const selectedAbsolute=chart.phrases.slice(0,phraseIndex).reduce((sum,p)=>sum+p.repeat*8,0)+beatIndex;
  const activeIndex=playingIndex>=0?playingIndex:selectedAbsolute;
  const cue=cueForCount(chart,activeIndex);
  const displayedPose=playing&&coachPose?coachPose:sampleDirectedPose(i=>cueForCount(chart,i),activeIndex,{reducedMotion,expression});
  const director=directionAt(i=>cueForCount(chart,i),activeIndex);
  const mediaError=mode==='local'?(!trackReady?'Choose and decode a local MP3/WAV first.':trackLengthError(chart,audio.current?.duration)):null;
  const editingDisabled=playing;

  useEffect(()=>{
    setNameDraft(chart.phrases[phraseIndex]?.name||'');
  },[phraseIndex,chart.phrases[phraseIndex]?.name]);
  useEffect(()=>()=>{audioToken.current++;run.current?.stop(false);audio.current=null;},[]);

  function change(next,description){
    if(editingDisabled)return;
    try{
      const clean=normalizeChart(typeof next==='function'?next(chartRef.current):next);
      history.current.push(chartRef.current);
      if(history.current.length>40)history.current.shift();
      chartRef.current=clean;setChart(clean);setUndoCount(history.current.length);
      setStatus(description);
    }catch(err){setStatus('Could not update routine: '+err.message);}
  }
  function undo(){
    if(editingDisabled)return;
    const previous=history.current.pop();if(!previous)return;
    chartRef.current=previous;setChart(previous);setUndoCount(history.current.length);
    setPhraseIndex(i=>Math.min(i,previous.phrases.length-1));setBeatIndex(0);
    setTitleDraft(previous.title);setStatus('Undid the last chart edit.');
  }
  function selectPhrase(i){
    if(playing)return;
    setPhraseIndex(i);setBeatIndex(0);
  }
  function applyStep(step){
    change(c=>replaceStep(c,phraseIndex,beatIndex,step),'Updated count '+(beatIndex+1)+'.');
  }
  function saveTitle(){
    if(titleDraft===chart.title)return;
    try{change(c=>({...c,title:titleDraft}),'Renamed your routine.');}
    catch{setTitleDraft(chart.title);}
  }
  function savePhraseName(){
    if(nameDraft===phrase.name)return;
    change(c=>replacePhrase(c,phraseIndex,{name:nameDraft}),'Renamed the selected phrase.');
  }
  function insert(style){
    if(chart.phrases.length>=MAX_PHRASES){setStatus('Maximum 16 phrases.');return;}
    change(c=>addPhrase(c,style,phraseIndex+1),'Added a new eight-count phrase.');
    setPhraseIndex(i=>i+1);setBeatIndex(0);
  }
  function copyPhrase(){
    if(chart.phrases.length>=MAX_PHRASES){setStatus('Maximum 16 phrases.');return;}
    change(c=>duplicatePhrase(c,phraseIndex),'Duplicated your phrase.');
    setPhraseIndex(i=>i+1);setBeatIndex(0);
  }
  function removePhrase(){
    if(chart.phrases.length<=1){setStatus('A routine must contain at least one eight-count phrase.');return;}
    change(c=>deletePhrase(c,phraseIndex),'Deleted the selected phrase.');
    setPhraseIndex(i=>Math.min(i,chart.phrases.length-2));setBeatIndex(0);
  }
  function shiftPhrase(delta){
    const at=phraseIndex+delta;
    if(at<0||at>=chart.phrases.length)return;
    change(c=>movePhrase(c,phraseIndex,delta),'Reordered your choreography.');
    setPhraseIndex(at);
  }

  async function importChart(event){
    if(playing)return;
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file)return;
    if(file.size>MAX_CHART_BYTES){setStatus('JSON chart is over 64 KiB.');return;}
    try{
      const imported=parseChart(await file.text());
      if(run.current)return;
      change(imported,'Imported '+imported.phrases.length+' locally authored phrases. No audio or files uploaded.');
      setTitleDraft(imported.title);setPhraseIndex(0);setBeatIndex(0);
    }catch(err){setStatus('Import rejected: '+err.message);}
  }
  async function pickAudio(event){
    const id=++audioToken.current;
    audio.current=null;setTrackReady(false);
    const file=event.target.files?.[0];
    if(!file){setTrackStatus('No local audio selected.');return;}
    setTrackStatus('Reading and decoding audio on this device…');
    let ctx=null;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;
      if(!Ctx)throw new Error('Web Audio is unavailable.');
      ctx=new Ctx();
      const buffer=await preflightLocalAudio(file,bytes=>ctx.decodeAudioData(bytes));
      if(id!==audioToken.current)return;
      audio.current=buffer;
      setTrackReady(true);
      setTrackStatus('Decoded '+buffer.duration.toFixed(1)+' seconds locally. File never uploaded.');
    }catch(err){if(id===audioToken.current)setTrackStatus('Audio rejected: '+err.message);}
    finally{if(ctx&&ctx.state!=='closed')await ctx.close().catch(()=>{});}
  }

  async function play(){
    if(run.current||mediaError)return;
    const current=chartRef.current,counts=totalCounts(current),music=mode;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){setStatus('Web Audio is unavailable in this browser.');return;}
    let ctx=null,source=null,raf=0,stopped=false,index=-1,lastBeep=-1,displayed=0,lastVisual=0;
    const end=(finished=false)=>{
      if(stopped)return;stopped=true;
      cancelAnimationFrame(raf);
      try{source?.stop();}catch{}
      try{source?.disconnect();}catch{}
      if(ctx)void ctx.close().catch(()=>{});
      run.current=null;
      setPlaying(false);setPlayingIndex(-1);setLastCount(displayed);setCoachPose(null);
      setStatus(finished?'Routine preview complete. Your choreography remains here until the page is closed.':'Preview stopped; audio released.');
    };
    run.current={stop:end};
    setPlaying(true);setPlayingIndex(-1);setLastCount(0);setCoachPose(sampleDirectedPose(i=>cueForCount(current,i),0,{reducedMotion,expression}));
    try{
      // Start Web Audio within direct user activation. The audio clock drives
      // both the optional song and the authored visual count.
      ctx=new Ctx({latencyHint:'interactive'});
      await ctx.resume();
      if(stopped)return;
      const initial=ctx.currentTime+1.2;
      const anchor=initial+(music==='local'?current.offsetMs/1000:0);
      if(music==='local'){
        const buffer=audio.current;
        if(!buffer)throw new Error('Local song was cleared.');
        const invalid=trackLengthError(current,buffer.duration);
        if(invalid)throw new Error(invalid);
        source=ctx.createBufferSource();source.buffer=buffer;
        const gain=ctx.createGain();gain.gain.value=.5;
        source.connect(gain);gain.connect(ctx.destination);
        source.start(initial);
      }
      setStatus('Playing authored count cues. This is screen-only choreography, not motion tracking.');
      const frame=()=>{
        if(stopped)return;
        const clock=ctx.currentTime;
        const elapsed=(clock-anchor)*current.bpm/60;
        const currentCount=Math.floor(elapsed+1e-8);
        if(currentCount>=counts){displayed=counts;end(true);return;}
        if(currentCount>=0){
          if(performance.now()-lastVisual>=32){
            setCoachPose(sampleDirectedPose(i=>cueForCount(current,i),elapsed,{reducedMotion,expression}));
            lastVisual=performance.now();
          }
          displayed=Math.max(displayed,currentCount+1);
          if(index!==currentCount){index=currentCount;setPlayingIndex(index);}
          if(music==='guide'&&lastBeep!==currentCount){
            lastBeep=currentCount;beep(ctx,currentCount%8===0);
          }
        }
        raf=requestAnimationFrame(frame);
      };
      raf=requestAnimationFrame(frame);
    }catch(err){end(false);setStatus('Preview error: '+(err?.message||'Unknown error'));}
  }

  const phaseStyles=STYLES.map(key=>DANCE_STYLES[key]);
  const safeReceipt=chartPreviewReceipt(chart,mode,lastCount);
  return <div className="creator-shell">
    <header className="creator-header">
      <a className="logo" href="index.html"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <nav><a href="academy.html">DANCE ACADEMY R5 ↗</a><a href="class.html">CHOREOGRAPHER R1 ↗</a><a href="dance.html">DANCEFLOW R0 ↗</a></nav>
    </header>
    <main className="creator-main">
      <p className="eyebrow"><span className="dot"/> DANCEFLOW R2 / CHOREOGRAPHY WORKSHOP</p>
      <div className="creator-heading"><div><h1>MAKE YOUR <em>MOVE.</em></h1>
        <p>Arrange your own eight-count routines. Build a sequence, mirror a move, sync to a downloaded track, preview, and take your choreography anywhere as a JSON file.</p></div>
        <div className="creator-export"><button type="button" disabled={editingDisabled} onClick={()=>downloadChart(chart)}>EXPORT ROUTINE JSON ↓</button>
          <label className="creator-import">IMPORT ROUTINE JSON
            <input type="file" accept=".json,application/json" disabled={editingDisabled} onChange={importChart}/>
          </label></div>
      </div>
      <div className="creator-toolbar">
        <label>ROUTINE NAME
          <input value={titleDraft} disabled={editingDisabled} maxLength={64}
            onChange={e=>setTitleDraft(e.target.value)} onBlur={saveTitle}
            onKeyDown={e=>{if(e.key==='Enter')e.target.blur();}}/>
        </label>
        <label>MANUAL BPM
          <input type="number" min="60" max="180" step="1" disabled={editingDisabled} value={chart.bpm}
            onChange={e=>{const n=Number(e.target.value);if(n>=60&&n<=180&&Number.isInteger(n))change(c=>({...c,bpm:n}),'Set manual tempo.');}}/>
        </label>
        <label>SONG BEAT OFFSET (MS)
          <input type="number" min="0" max="1000" step="25" disabled={editingDisabled} value={chart.offsetMs}
            onChange={e=>{const n=Number(e.target.value);if(n>=0&&n<=1000&&Number.isInteger(n))change(c=>({...c,offsetMs:n}),'Updated manual audio offset.');}}/>
        </label>
        <div className="creator-toolbar-actions"><button disabled={!undoCount||editingDisabled} onClick={undo}>↶ UNDO</button>
          <button disabled={editingDisabled} onClick={()=>{change(starterChart(),'Reset to the sample routine.');setTitleDraft('MY DANCEFLOW MIX');setPhraseIndex(0);setBeatIndex(0);}}>RESET SAMPLE</button>
        </div>
      </div>

      <div className="creator-grid">
        <section className="creator-panel">
          <div className="creator-panel-head"><h2>01 / YOUR PHRASES</h2><span>{chart.phrases.length} PHRASES · {total} COUNTS · {(total*60/chart.bpm).toFixed(1)} SEC</span></div>
          <div className="creator-phrase-list" aria-label="Your ordered eight-count phrases">
            {chart.phrases.map((p,i)=><button key={i} disabled={editingDisabled} type="button" className={i===phraseIndex?'creator-phrase active':'creator-phrase'} onClick={()=>selectPhrase(i)}>
              <span>{String(i+1).padStart(2,'0')}</span><strong>{p.name}</strong><small>×{p.repeat}</small>
            </button>)}
          </div>
          <div className="creator-phrase-actions">
            <button disabled={editingDisabled||chart.phrases.length>=MAX_PHRASES} onClick={()=>insert('groove')}>+ NEW GROOVE</button>
            <button disabled={editingDisabled||chart.phrases.length>=MAX_PHRASES} onClick={copyPhrase}>DUPLICATE</button>
            <button disabled={editingDisabled||phraseIndex===0} onClick={()=>shiftPhrase(-1)} aria-label="Move selected phrase earlier">↑</button>
            <button disabled={editingDisabled||phraseIndex===chart.phrases.length-1} onClick={()=>shiftPhrase(1)} aria-label="Move selected phrase later">↓</button>
            <button disabled={editingDisabled||chart.phrases.length===1} onClick={removePhrase}>DELETE</button>
          </div>
          <div className="creator-phrase-settings">
            <label>SELECTED PHRASE NAME
              <input maxLength={40} value={nameDraft} disabled={editingDisabled} onChange={e=>setNameDraft(e.target.value)}
                onBlur={savePhraseName} onKeyDown={e=>{if(e.key==='Enter')e.target.blur();}}/>
            </label>
            <label>REPEAT THIS EIGHT
              <select disabled={editingDisabled} value={phrase.repeat} onChange={e=>change(c=>replacePhrase(c,phraseIndex,{repeat:Number(e.target.value)}),'Updated phrase repeats.')}>
                {[1,2,3,4].map(n=><option key={n} value={n}>{n}×</option>)}
              </select>
            </label>
          </div>
          <h2>02 / EIGHT-COUNT TIMELINE</h2>
          <div className="creator-beats" aria-label="Eight editable counts">
            {phrase.steps.map((step,i)=>{
              const m=DANCE_STYLES[step.style].moves[step.moveIndex];
              return <button key={i} type="button" disabled={editingDisabled} aria-pressed={beatIndex===i}
                className={i===beatIndex?'creator-beat selected':'creator-beat'} onClick={()=>setBeatIndex(i)}>
                <small>COUNT {i+1}</small><strong>{m.name}</strong>
                <span>{DANCE_STYLES[step.style].name}{step.mirror?' · MIRROR':''}</span>
              </button>;
            })}
          </div>
          <h2>03 / CHOOSE A MOVE FOR COUNT {beatIndex+1}</h2>
          <div className="creator-style-tabs" role="group" aria-label="Movement style palette">
            {STYLES.map(s=><button key={s} disabled={editingDisabled} className={beat.style===s?'active':''}
              onClick={()=>applyStep(makeStep(s,Math.min(beat.moveIndex,7),beat.mirror))}>{DANCE_STYLES[s].name}</button>)}
          </div>
          <div className="creator-move-grid">
            {DANCE_STYLES[beat.style].moves.map((move,i)=><button key={i} disabled={editingDisabled}
              className={i===beat.moveIndex?'active':''} onClick={()=>applyStep(makeStep(beat.style,i,beat.mirror))}>
              <span>{i+1}</span><strong>{move.name}</strong><small>{move.coach}</small>
            </button>)}
          </div>
          <label className="creator-mirror"><input type="checkbox" disabled={editingDisabled} checked={beat.mirror}
              onChange={e=>applyStep(makeStep(beat.style,beat.moveIndex,e.target.checked))}/>
            MIRROR THIS MOVE (SWAP LEFT AND RIGHT)</label>
        </section>

        <section className="creator-panel creator-stage-panel">
          <div className="creator-panel-head"><h2>04 / REHEARSAL STAGE</h2><span>SCREEN DEMONSTRATION · NO BODY SCORING</span></div>
          <div className="director-banner" aria-live="off">
            <strong>{director?.styleName||'DANCE DIRECTOR'}</strong>
            <span>{director?.headline||'READY TO DANCE'}</span>
          </div>
          <div className="creator-stage">
            <div className="creator-stage-spot"/>
            <div className="creator-motion-stage">
              <MotionCoachFigure pose={displayedPose} reducedMotion={reducedMotion}
                label="Animated, authored choreography instructor with neon arms and stationary illustrated feet"/>
            </div>
            <div className="creator-count"><span>COUNT</span><strong>{cue?.beat||'·'}</strong><small>OF EIGHT</small></div>
          </div>
          {director?.upcoming&&playing&&<div className="director-up-next" role="status">
            <span>COMING UP IN {director.upcoming.inCounts} COUNT{director.upcoming.inCounts!==1?'S':''}</span>
            <strong>{director.upcoming.label} · {director.upcoming.name}</strong>
          </div>}
          <div className="creator-current">
            <span>PHRASE {(cue?.phraseIndex??0)+1} · {cue?.phraseName}</span>
            <strong>{cue?.name||'READY'}</strong>
            <p>{cue?.coach||'Preview the routine.'}</p>
          </div>
          <div className="creator-progress" role="progressbar" aria-valuenow={Math.round((Math.max(0,playingIndex+1)/total)*100)} aria-valuemin={0} aria-valuemax={100}>
            <div style={{width:(Math.max(0,playingIndex+1)/total*100)+'%'}}/>
          </div>
          <div className="director-intensity" role="group" aria-label="Instructor expression">
            <span>DIRECTOR EXPRESSION</span>
            <button disabled={playing} className={expression==='subtle'?'selected':''} onClick={()=>setExpression('subtle')}>SUBTLE</button>
            <button disabled={playing} className={expression==='showtime'?'selected':''} onClick={()=>setExpression('showtime')}>SHOWTIME</button>
          </div>
          <label className="creator-calm"><input type="checkbox" checked={reducedMotion} disabled={playing}
              onChange={e=>setReducedMotion(e.target.checked)}/>
            REDUCED MOTION · HOLD EACH COUNT WITHOUT SWAY
          </label>
          <fieldset className="creator-audio-select" disabled={playing}><legend>AUDIO SOURCE</legend>
            <label><input type="radio" checked={mode==='guide'} onChange={()=>setMode('guide')}/> SYNTH COUNT GUIDE</label>
            <label><input type="radio" checked={mode==='local'} onChange={()=>setMode('local')}/> MY LOCAL MP3/WAV</label>
          </fieldset>
          {mode==='local'&&<div className="creator-local-audio">
            <label>LOCALLY DOWNLOADED MUSIC
              <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={playing} onChange={pickAudio}/>
            </label>
            <p role="status">{trackStatus}</p>
            {mediaError&&<p className="creator-error" role="alert">{mediaError}</p>}
          </div>}
          <div className="creator-play-actions">
            <button disabled={playing||!!mediaError} onClick={play}>▶ PREVIEW ENTIRE ROUTINE</button>
            <button disabled={!playing} onClick={()=>run.current?.stop(false)}>■ STOP</button>
          </div>
          <p className="creator-status" role="status">{status}</p>
          <div className="creator-note">Make routines with your own original moves, then select a downloaded track you have permission to use, including music you've created for More Bounce Labs. BPM/offset are set manually; the app does not analyze songs. Import/export contains only choreography settings. Songs stay in browser memory and are never embedded in a routine.</div>
          {lastCount>0&&<details className="creator-receipt"><summary>LOCAL PREVIEW RECEIPT</summary><pre>{JSON.stringify(safeReceipt,null,2)}</pre></details>}
          <p className="creator-note">Comfort-first choreography. The figure illustrates upper-body hand cues only. No footwork, body pose, fitness, calories, heart rate, or dancing ability is measured. Clear your movement space and stop if you feel uncomfortable.</p>
        </section>
      </div>
      <footer className="creator-footer"><span>PULSE369 / DANCEFLOW R2 · OPEN CHOREOGRAPHY FORMAT · NO CLOUD ACCOUNT</span><a href="class.html">BACK TO THE CHOREOGRAPHER ↗</a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<Creator/>);
