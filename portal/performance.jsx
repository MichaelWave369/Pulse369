import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {starterWorkout,parseWorkout,MAX_RECIPE_BYTES} from './dance-workout.mjs';
import {parseChart,MAX_CHART_BYTES} from './choreo-model.mjs';
import {preflightLocalAudio} from './quest-local-music.mjs';
import {
  STAGES,SHOW_MAX_BYTES,starterShow,normalizeShow,parseShow,encodeShow,
  replaceSource,changeScene,buildShow,sampleShow,performanceTrackError,showReceipt
} from './dance-performance.mjs';
import MotionCoachFigure from './motion-coach-figure.jsx';
import {BUILTIN_PRESETS,builtInPreset,capturePreset,applyPreset,parsePreset,encodePreset,cueSheetRows,cueSheetText,rehearsalStart,MAX_PRESET_BYTES} from './dance-show-runner.mjs';
import './styles.css';
import './quest-lab.css';
import './performance.css';

const DEMO='Performance ready. Import an authored chart or workout, assign scenes, and rehearse.';
const pad=n=>String(n).padStart(2,'0');
const fileDownload=(name,content)=>{
  const url=URL.createObjectURL(new Blob([content],{type:name.endsWith('.txt')?'text/plain':'application/json'}));
  const a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const click=(ctx,downbeat)=>{
  if(!ctx||ctx.state!=='running')return;
  try{
    const at=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(downbeat?224:132,at);
    o.frequency.exponentialRampToValueAtTime(78,at+.08);
    g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(downbeat?.075:.028,at+.01);
    g.gain.exponentialRampToValueAtTime(.0001,at+.09);
    o.connect(g);g.connect(ctx.destination);o.start(at);o.stop(at+.1);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }catch{/* Audio guide is optional. */}
};
function Performance(){
  const [show,setShow]=useState(starterShow);
  const [selected,setSelected]=useState(0);
  const [presetChoice,setPresetChoice]=useState('royal');
  const [paused,setPaused]=useState(false);
  const [theater,setTheater]=useState(false);
  const [mode,setMode]=useState('guide');
  const [audioStatus,setAudioStatus]=useState('No local music loaded. Synthesized guide is ready.');
  const [ready,setReady]=useState(false);
  const [status,setStatus]=useState(DEMO);
  const [playing,setPlaying]=useState(false);
  const [liveFrame,setLiveFrame]=useState(null);
  const [shown,setShown]=useState(0);
  const [receipt,setReceipt]=useState(null);
  const audio=useRef(null),token=useRef(0),run=useRef(null),showRef=useRef(show);
  showRef.current=show;
  const plan=buildShow(show);
  const cueRows=cueSheetRows(show);
  const segment=plan.segments[Math.min(selected,plan.segments.length-1)];
  const current=playing&&liveFrame?liveFrame:sampleShow(plan,segment.start);
  const scene=current?.scene;
  const palette=scene?.palette||STAGES.neon;
  const error=mode==='local'?
    !ready?'Select and decode a local MP3 or WAV first.':performanceTrackError(plan,audio.current?.duration):null;
  useEffect(()=>()=>{token.current++;run.current?.stop(false);audio.current=null;},[]);
  function update(next,note){
    if(run.current||playing)return;
    try{
      const safe=normalizeShow(typeof next==='function'?next(showRef.current):next);
      showRef.current=safe;setShow(safe);setSelected(i=>Math.min(i,buildShow(safe).segments.length-1));
      setShown(0);setReceipt(null);setLiveFrame(null);
      setStatus(note||'Stage direction updated. Save your show JSON to keep these settings.');
    }catch(err){setStatus('Could not edit show: '+err.message);}
  }
  async function load(event){
    const file=event.target.files?.[0];event.target.value='';
    if(!file||playing||run.current)return;
    if(file.size>SHOW_MAX_BYTES){setStatus('File exceeds performance 128 KiB import limit.');return;}
    try{
      const contents=await file.text();
      if(run.current)return;
      let imported;
      const raw=JSON.parse(contents);
      if(raw?.schema==='pulse369.dance-performance.v1')imported=parseShow(contents);
      else if(raw?.schema==='pulse369.dance-workout.v1'){
        if(file.size>MAX_RECIPE_BYTES)throw new Error('Workout recipe exceeds its 16 KiB limit.');
        imported=replaceSource(showRef.current,'workout',parseWorkout(contents));
      }else if(raw?.schema==='pulse369.choreography.v1'){
        if(file.size>MAX_CHART_BYTES)throw new Error('Chart exceeds its 64 KiB limit.');
        imported=replaceSource(showRef.current,'chart',parseChart(contents));
      }else throw new Error('Unsupported JSON schema. Choose an R2 chart, R6 workout, or R7 show.');
      update(imported,'Imported '+(imported.source.kind==='chart'?'custom choreography': 'workout')+' and its valid stage settings. Everything stayed local.');
      setSelected(0);
    }catch(err){setStatus('Import rejected: '+err.message);}
  }
  async function importPreset(event){
    const file=event.target.files?.[0];event.target.value='';
    if(!file||run.current)return;
    if(file.size>MAX_PRESET_BYTES){setStatus('Preset file exceeds 8 KiB.');return;}
    try{
      const content=await file.text();
      if(run.current)return;
      const preset=parsePreset(content);
      update(old=>applyPreset(old,preset),'Applied preset '+preset.name+' without changing source choreography.');
    }catch(err){setStatus('Preset rejected: '+err.message);}
  }
  function savePreset(){
    try{
      const preset=capturePreset(showRef.current,showRef.current.title.slice(0,44)+' STAGE');
      fileDownload('pulse369-stage-preset.json',encodePreset(preset));
      setStatus('Saved a portable stage preset (appearance only, no choreography or audio).');
    }catch(err){setStatus('Could not save stage preset: '+err.message);}
  }
  async function togglePause(){await run.current?.pause?.();}
  async function loadSong(event){
    const t=++token.current;
    audio.current=null;setReady(false);
    const file=event.target.files?.[0];event.target.value='';
    if(!file){setAudioStatus('No song selected.');return;}
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){setAudioStatus('Web Audio unsupported in this browser.');return;}
    let ctx;
    try{
      setAudioStatus('Validating and decoding the song locally…');
      ctx=new Ctx();
      const buffer=await preflightLocalAudio(file,bytes=>ctx.decodeAudioData(bytes));
      if(t!==token.current||run.current)return;
      audio.current=buffer;setReady(true);
      setAudioStatus('Local song ready: '+buffer.duration.toFixed(1)+' seconds · no upload');
    }catch(err){if(t===token.current)setAudioStatus('Audio rejected: '+err.message);}
    finally{if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});}
  }
  async function start(fromSelected=false){
    if(run.current||error)return;
    const program=buildShow(showRef.current),sound=mode;
    const cueStart=rehearsalStart(program.show,fromSelected?selected:0,sound);
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){setStatus('Web Audio is not supported. You can still preview each scene manually.');return;}
    let ctx=null,source=null,raf=0,ended=false,prior=-1,lastClick=-1,priorDraw=0,completed=0,pauseBusy=false;
    const stop=finished=>{
      if(ended)return;ended=true;cancelAnimationFrame(raf);
      try{source?.stop();}catch{}
      try{source?.disconnect();}catch{}
      if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});
      run.current=null;setPlaying(false);setPaused(false);setLiveFrame(null);setShown(cueStart.count+completed);
      setReceipt(showReceipt(program,completed,sound));
      setStatus(finished?'The staged show finished. This was a screen demonstration only.':'Rehearsal stopped; local playback resources were released.');
    };
    const pause=async()=>{
      if(ended||!ctx||pauseBusy)return;
      pauseBusy=true;
      try{
        if(ctx.state==='running'){await ctx.suspend();if(!ended)setPaused(true);}
        else if(ctx.state==='suspended'){await ctx.resume();if(!ended)setPaused(false);}
      }catch(err){if(!ended)setStatus('Pause control unavailable: '+(err?.message||'Audio system error'));}
      finally{pauseBusy=false;}
    };
    run.current={stop,pause};setPlaying(true);setPaused(false);
    setLiveFrame(sampleShow(program,cueStart.count));setShown(cueStart.count);setReceipt(null);
    try{
      ctx=new Ctx({latencyHint:'interactive'});await ctx.resume();
      if(ended)return;
      const startAt=ctx.currentTime+1.3;
      const anchor=startAt+cueStart.leadInSeconds-cueStart.count*cueStart.beatSeconds;
      if(sound==='local'){
        const buffer=audio.current;
        if(!buffer)throw new Error('The local audio was cleared.');
        const invalid=performanceTrackError(program,buffer.duration);
        if(invalid)throw new Error(invalid);
        source=ctx.createBufferSource();source.buffer=buffer;
        const gain=ctx.createGain();gain.gain.value=.48;
        source.connect(gain);gain.connect(ctx.destination);source.start(startAt,cueStart.audioSeconds);
      }
      setStatus('Running from cue '+(cueStart.segmentIndex+1)+'. Pause/resume shares the audio clock; no motion or camera sensing.');
      const frame=()=>{
        if(ended)return;
        const time=ctx.currentTime,beat=(time-anchor)*program.bpm/60;
        const count=Math.floor(beat+1e-8);
        if(count>=program.totalCounts){completed=program.totalCounts-cueStart.count;stop(true);return;}
        if(count>=0){
          completed=Math.max(completed,count-cueStart.count+1);
          if(count!==prior){prior=count;setShown(count+1);}
          if(time-priorDraw>.034){
            const sample=sampleShow(program,beat);
            if(sample)setLiveFrame(sample);
            priorDraw=time;
          }
          if(sound==='guide'&&lastClick!==count){
            lastClick=count;click(ctx,count%8===0);
          }
        }
        raf=requestAnimationFrame(frame);
      };
      raf=requestAnimationFrame(frame);
    }catch(err){stop(false);setStatus('Playback failed: '+(err?.message||'Unexpected audio issue'));}
  }
  const progress=playing?shown:0;
  const frames=(n)=>((n*60/plan.bpm)/60).toFixed(1);
  const active=scene?.index??0;
  return <div className={'perf-shell'+(theater?' theater':'')}>
    <header className="perf-header">
      <a className="perf-logo" href="index.html">ϕ PULSE <strong>369</strong></a>
      <nav><a href="workout.html">WORKOUT BUILDER ↗</a><a href="create.html">CHOREOGRAPHY CREATOR ↗</a><a href="academy.html">DANCE ACADEMY ↗</a></nav>
    </header>
    <main className="perf-main">
      <div className="perf-heading">
        <div><p className="perf-eyebrow">DANCEFLOW R8 / THE SHOW RUNNER</p>
          <h1>OWN THE <em>STAGE.</em></h1>
          <p>Direct, rehearse and run a full dance show with reusable stage presets, exact section cue points, and a printable show cue sheet. Your choreography and music remain local.</p>
        </div>
        <div className="perf-head-actions">
          <button disabled={playing} onClick={()=>fileDownload('pulse369-stage-show.json',encodeShow(show))}>↓ SAVE SHOW JSON</button>
          <label tabIndex={playing?-1:0} className="perf-upload">↑ IMPORT SHOW / R2 / R6
            <input type="file" accept=".json,application/json" disabled={playing} onChange={load}/>
          </label>
        </div>
      </div>
      <div className="perf-layout">
        <section className="perf-editor">
          <div className="perf-panel">
            <h2>01 / SHOW SOURCE</h2>
            <p className="perf-hint">Use a built-in sample, or import your own R2 choreography chart, R6 workout recipe or previously saved R7 show. Imports replace the current show in memory.</p>
            <div className="perf-source-row"><span>SOURCE</span><strong>{show.source.kind==='workout'?'R6 WORKOUT RECIPE':'R2 CHOREOGRAPHY CHART'}</strong></div>
            <label>SHOW TITLE
              <input maxLength={64} value={show.title} disabled={playing}
                onChange={e=>{if(e.target.value.trim())update({...show,title:e.target.value},'Show title updated.');}}/>
            </label>
            <button className="perf-reset" disabled={playing} onClick={()=>{update(starterShow(),'Loaded the sample House / Funk / Disco show.');setSelected(0);}}>RESET SAMPLE SHOW</button>
            <div className="perf-figures">
              <div><small>MANUAL BPM</small><strong>{plan.bpm}</strong></div>
              <div><small>SECTIONS</small><strong>{plan.segments.length}</strong></div>
              <div><small>PLAY LENGTH</small><strong>{frames(plan.totalCounts)} MIN</strong></div>
            </div>
          </div>
          <div className="perf-panel">
            <h2>02 / DIRECTOR CONTROLS</h2>
            <div className="perf-controls">
              <label>DEFAULT STAGE
                <select value={show.settings.defaultStage} disabled={playing}
                  onChange={e=>update({...show,settings:{...show.settings,defaultStage:e.target.value}},'Default stage changed.')}>
                  {Object.entries(STAGES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
                </select>
              </label>
              <label>CAMERA FRAMING
                <select value={show.settings.frame} disabled={playing}
                  onChange={e=>update({...show,settings:{...show.settings,frame:e.target.value}},'Camera crop changed. This is a virtual viewpoint.')}>
                  <option value="wide">WIDE STAGE</option><option value="medium">MEDIUM COACH</option>
                </select>
              </label>
              <label>INSTRUCTOR EXPRESSION
                <select value={show.settings.expression} disabled={playing}
                  onChange={e=>update({...show,settings:{...show.settings,expression:e.target.value}},'Instructor expression changed.')}>
                  <option value="showtime">SHOWTIME</option><option value="subtle">SUBTLE</option>
                </select>
              </label>
            </div>
            <label className="perf-checkbox">
              <input type="checkbox" checked={show.settings.reducedMotion} disabled={playing}
                onChange={e=>update({...show,settings:{...show.settings,reducedMotion:e.target.checked}},'Reduced-motion stage option changed.')}/>
              REDUCED MOTION · STATIC LIGHTING AND COUNT POSES
            </label>
          </div>
          <div className="perf-panel perf-preset-panel">
            <h2>03 / REUSABLE STAGE PRESETS</h2>
            <p className="perf-hint">Preset files contain visual direction only. Apply one to any R2/R6 show without replacing its choreography or timing.</p>
            <div className="perf-preset-row">
              <label>BUILT-IN LOOK
                <select value={presetChoice} disabled={playing} onChange={e=>setPresetChoice(e.target.value)}>
                  {Object.entries(BUILTIN_PRESETS).map(([id,p])=><option value={id} key={id}>{p.name}</option>)}
                </select>
              </label>
              <button disabled={playing} onClick={()=>update(old=>applyPreset(old,builtInPreset(presetChoice)),
                'Applied '+BUILTIN_PRESETS[presetChoice].name+'. Choreography unchanged.')}>APPLY LOOK</button>
            </div>
            <p className="perf-hint">{BUILTIN_PRESETS[presetChoice].description}</p>
            <div className="perf-preset-actions">
              <button disabled={playing} onClick={savePreset}>↓ SAVE MY STAGE PRESET</button>
              <label className="perf-preset-import">↑ LOAD STAGE PRESET
                <input type="file" disabled={playing} accept=".json,application/json" onChange={importPreset}/>
              </label>
            </div>
          </div>
          <div className="perf-panel">
            <h2>04 / SCENE TIMELINE</h2>
            <p className="perf-hint">Choose a section to inspect its pose. Each section can use its own stage lighting; the choreography and timing remain untouched.</p>
            <div className="perf-timeline">
              {plan.segments.map(s=><div className={'perf-segment'+(s.index===active?' current':'')} key={s.index}>
                <button onClick={()=>setSelected(s.index)} disabled={playing}
                  aria-pressed={!playing&&selected===s.index} className="perf-section-button">
                  <span>{pad(s.index+1)}</span>
                  <strong>{s.label}</strong>
                  <small>{Math.round((s.end-s.start)*60/plan.bpm)} SEC</small>
                </button>
                <select value={s.stage} disabled={playing} aria-label={'Stage lighting for section '+(s.index+1)}
                  onChange={e=>update(old=>changeScene(old,s.index,e.target.value),'Section stage updated.')}>
                  {Object.entries(STAGES).map(([id,v])=><option value={id} key={id}>{v.name}</option>)}
                </select>
              </div>)}
            </div>
          </div>
          <div className="perf-panel">
            <h2>05 / SHOW TRANSPORT</h2>
            <fieldset disabled={playing} className="perf-audio-mode">
              <legend>REHEARSAL SOUND</legend>
              <label><input type="radio" checked={mode==='guide'} onChange={()=>setMode('guide')}/> SYNTH COUNT GUIDE</label>
              <label><input type="radio" checked={mode==='local'} onChange={()=>setMode('local')}/> LOCAL MP3 / WAV</label>
            </fieldset>
            {mode==='local'&&<div className="perf-song">
              <label>CHOOSE A LOCALLY DOWNLOADED TRACK
                <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={playing} onChange={loadSong}/>
              </label>
              <p>{audioStatus}</p>
              {error&&<p role="alert" className="perf-error">{error}</p>}
            </div>}
            <div className="perf-play-buttons">
              <button disabled={playing||!!error} onClick={()=>start(false)}>▶ FULL SHOW</button>
              <button disabled={playing||!!error} onClick={()=>start(true)}>↪ REHEARSE SELECTED SECTION</button>
              <button disabled={!playing} onClick={togglePause}>{paused?'▶ RESUME':'Ⅱ PAUSE'}</button>
              <button disabled={!playing} onClick={()=>run.current?.stop(false)}>■ STOP</button>
            </div>
            <p className="perf-hint">Cue from section {selected+1}, {plan.segments[selected]?.label}. Synthesized guide starts on that count. Local music seeks to the matching time; the manual BPM/offset remain unchanged.</p>
            <p className="perf-status" role="status">{status}</p>
          </div>
        </section>
        <section className="perf-visual-column">
          <div className="perf-stage-wrapper">
            <div className="perf-stage-toolbar">
              <div><small>NOW ON STAGE</small><strong>{scene?.label||'SHOW READY'}</strong></div>
              <div className="perf-theater-controls">
                {playing&&<button onClick={togglePause}>{paused?'▶ RESUME':'Ⅱ PAUSE'}</button>}
                {playing&&<button onClick={()=>run.current?.stop(false)}>■ STOP</button>}
                <button onClick={()=>setTheater(v=>!v)}>{theater?'↙ EXIT THEATER':'↗ THEATER MODE'}</button>
              </div>
            </div>
            <div className={'perf-stage perf-'+(scene?.theme||'neon')+(show.settings.reducedMotion?' still':'')}
              style={{'--stage-accent':palette.accent,'--stage-secondary':palette.secondary,'--pulse':current?.lightEnergy||0}}>
              <div className="perf-stage-backdrop"/>
              <div className="perf-light-beam beam-left"/><div className="perf-light-beam beam-right"/>
              <div className="perf-light-beam beam-center"/><div className="perf-stage-grid"/>
              <div className={'perf-dancer '+show.settings.frame}>
                <MotionCoachFigure pose={current?.pose} reducedMotion={show.settings.reducedMotion}
                  label="Procedural dance figure performing authored cues. This is not actual live dancer tracking."/>
              </div>
              <div className="perf-stage-top-caption">ϕ / {palette.name}</div>
              <div className="perf-stage-footer"><span>{current?.cue?.name||'READY'}</span><strong>{current?.cue?.countInEight||'·'} / 8</strong></div>
            </div>
            <div className="perf-stage-readout">
              <div><small>DISPLAYED BEATS</small><strong>{playing?shown:0} / {plan.totalCounts}</strong></div>
              <div><small>SECTION</small><strong>{(scene?.index||0)+1} / {plan.segments.length}</strong></div>
              <div><small>ART DIRECTOR</small><strong>{palette.name}</strong></div>
            </div>
            <div className="perf-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={Math.round((playing?shown:0)/plan.totalCounts*100)}>
              <div style={{width:((playing?shown:0)/plan.totalCounts*100)+'%'}}/>
            </div>
            {scene?.next&&playing&&<div className="perf-upcoming" role="status">
              <span>NEXT SCENE IN {scene.next.inCounts} COUNTS</span>
              <strong>{scene.next.label} · {STAGES[scene.next.stage].name}</strong>
            </div>}
          </div>
          <section className="perf-panel perf-sheet" aria-label="Show cue sheet">
            <div className="perf-sheet-head">
              <h2>06 / THE SHOW CUE SHEET</h2>
              <div className="perf-sheet-actions">
                <button onClick={()=>fileDownload('pulse369-show-cue-sheet.txt',cueSheetText(show))}>↓ EXPORT TXT</button>
                <button onClick={()=>window.print()}>⎙ PRINT CUE SHEET</button>
              </div>
            </div>
            <p className="perf-hint">Times refer to the local soundtrack starting at zero, including the manually authored beat offset. The guide sound starts counting immediately. No automatic beat detection or measured stage timing.</p>
            <div className="perf-sheet-meta">
              <strong>{show.title}</strong>
              <span>{plan.bpm} BPM · {plan.offsetMs} MS OFFSET · {plan.totalCounts} COUNTS</span>
            </div>
            <div className="perf-sheet-scroll">
              <table>
                <thead><tr><th>CUE</th><th>TIME</th><th>COUNTS</th><th>SECTION</th><th>STAGE</th></tr></thead>
                <tbody>{cueRows.map(row=><tr key={row.number}>
                  <td>{String(row.number).padStart(2,'0')}</td>
                  <td>{Math.floor(row.atSeconds/60).toString().padStart(2,'0')}:{(row.atSeconds%60).toFixed(2).padStart(5,'0')}</td>
                  <td>{row.count}–{row.endCount}</td><td>{row.section}</td><td>{row.stageName}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <p className="perf-sheet-limits">AUTHORED CUE SHEET ONLY · R2/R6 COUNT TIMELINE · NO TRACK FILE STORED</p>
          </section>
          <div className="perf-note">
            <strong>SCREEN PERFORMANCE · NOT MOTION CAPTURE</strong>
            <p>Everything you see is procedural choreography, not an observation of you. This studio doesn't record video, listen to the room, analyze dancing, measure fitness, or upload your music. A complete show file includes the authored routine and scene settings, never audio bytes.</p>
            {receipt&&<details><summary>LOCAL SHOW RECEIPT</summary><pre>{JSON.stringify(receipt,null,2)}</pre></details>}
          </div>
        </section>
      </div>
      <footer className="perf-bottom">PULSE369 · DANCE SHOW RUNNER R8 · MIT · LOCAL-FIRST <a href="index.html">RETURN TO STUDIO ↗</a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<Performance/>);
