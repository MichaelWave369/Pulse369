import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LESSONS,LESSON_IDS} from './dance-academy.mjs';
import {preflightLocalAudio} from './quest-local-music.mjs';
import {encodeChart} from './choreo-model.mjs';
import {
  WORKOUT_MINUTES,WORKOUT_BPM,MAX_PLAYLIST,MAX_RECIPE_BYTES,
  starterWorkout,normalizeWorkout,parseWorkout,encodeWorkout,editPlaylist,
  buildWorkout,workoutCue,nextSection,workoutTrackError,workoutChoreoChart,workoutReceipt
} from './dance-workout.mjs';
import './styles.css';
import './quest-lab.css';
import './academy.css';
import './workout.css';

const neutralStatus='Arrange your dance sections, then start the screen-guided session. No body movement is measured.';
function downloadFile(filename,content){
  const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}
function click(ctx,strong){
  if(ctx?.state!=='running')return;
  try{
    const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(strong?210:130,t);
    o.frequency.exponentialRampToValueAtTime(80,t+.072);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(strong?.065:.031,t+.01);
    g.gain.exponentialRampToValueAtTime(.0001,t+.1);
    o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.11);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }catch{ /* Audio click is optional. */ }
}
function Floor({cue,calm}){
  if(!cue)return null;
  return <div className={'academy-feet workout-floor'+(calm?' calm':'')} role="img"
    aria-label={'Illustration of '+(cue.seated?'seated neutral feet':'in-place dance feet')+', with '+cue.focus+' highlighted. Feet are not sensed.'}>
    <div className="academy-floor-guide"/><div className="academy-center-line"/>
    <div className="academy-floor-label top">NO TRAVEL · STAY IN PLACE</div>
    {['left','right'].map(side=><div key={side}
      className={'academy-foot '+side+((cue.focus===side||cue.focus==='both')?' active':'')}
      style={{left:(50+cue.feet[side].x*88)+'%',top:(53+cue.feet[side].z*110)+'%'}}>
      <span>{side==='left'?'L':'R'}</span>
    </div>)}
    <div className="academy-floor-label bottom">{cue.seated?'SEATED TOE-TAPS OR STILLNESS':'OPTIONAL TINY STEPS'}</div>
  </div>;
}
function Workout(){
  const [recipe,setRecipe]=useState(starterWorkout);
  const [selectedSlot,setSelectedSlot]=useState(0);
  const [status,setStatus]=useState(neutralStatus);
  const [audioMode,setAudioMode]=useState('guide');
  const [audioStatus,setAudioStatus]=useState('No audio selected. Local files are never uploaded.');
  const [audioReady,setAudioReady]=useState(false);
  const [running,setRunning]=useState(false);
  const [index,setIndex]=useState(-1);
  const [done,setDone]=useState(0);
  const [receipt,setReceipt]=useState(null);
  const [reducedMotion,setReducedMotion]=useState(false);
  const audio=useRef(null),audioToken=useRef(0),run=useRef(null),recipeRef=useRef(recipe);
  recipeRef.current=recipe;
  const plan=buildWorkout(recipe);
  const danceSegments=plan.segments.filter(s=>s.kind==='dance');
  const selectedSegment=danceSegments.find(s=>s.slot===selectedSlot)||danceSegments[0];
  const current=index>=0&&running?index:selectedSegment?.start||0;
  const cue=workoutCue(plan,current);
  const next=index>=0&&running?nextSection(plan,index):null;
  const audioError=audioMode==='local'?
    (!audioReady?'Select a valid local MP3/WAV (24 MB max).':workoutTrackError(plan,audio.current?.duration)):null;
  useEffect(()=>()=>{audioToken.current++;run.current?.stop(false);audio.current=null;},[]);

  function update(patch,message){
    if(running)return;
    try{
      const next=normalizeWorkout(typeof patch==='function'?patch(recipeRef.current):{...recipeRef.current,...patch});
      recipeRef.current=next;setRecipe(next);
      setSelectedSlot(s=>Math.min(s,next.playlist.length-1));
      setReceipt(null);setDone(0);setIndex(-1);
      setStatus(message||'Workout updated. Export recipe JSON to keep a copy.');
    }catch(err){setStatus('Workout change rejected: '+err.message);}
  }
  function playlist(op,msg){
    update(old=>editPlaylist(old,op),msg);
    if(op.type==='add')setSelectedSlot(Math.min(selectedSlot+1,MAX_PLAYLIST-1));
    if(op.type==='move'){
      const target=op.index+op.direction;
      if(target>=0&&target<recipe.playlist.length)setSelectedSlot(target);
    }
  }
  async function importFile(event){
    const file=event.target.files?.[0];
    event.target.value='';
    if(!file||running)return;
    if(file.size>MAX_RECIPE_BYTES){setStatus('Recipe is over 16 KiB.');return;}
    try{
      const safe=parseWorkout(await file.text());
      if(run.current)return;
      update(safe,'Loaded saved workout recipe locally. No song or tracking data imported.');
      setSelectedSlot(0);
    }catch(err){setStatus('Recipe rejected: '+err.message);}
  }
  async function pickAudio(event){
    const token=++audioToken.current;
    audio.current=null;setAudioReady(false);
    const file=event.target.files?.[0];if(!file){setAudioStatus('No file selected.');return;}
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){setAudioStatus('This browser does not support Web Audio.');return;}
    let ctx;
    try{
      setAudioStatus('Checking your song locally…');
      ctx=new Ctx();
      const buffer=await preflightLocalAudio(file,bytes=>ctx.decodeAudioData(bytes));
      if(token!==audioToken.current||run.current)return;
      audio.current=buffer;setAudioReady(true);
      setAudioStatus('Local audio ready: '+buffer.duration.toFixed(1)+' seconds. No upload.');
    }catch(err){if(token===audioToken.current)setAudioStatus('Audio rejected: '+err.message);}
    finally{if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});}
  }
  async function play(){
    if(run.current||audioError)return;
    const snapshot=recipeRef.current;
    const program=buildWorkout(snapshot),music=audioMode;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){setStatus('Web Audio is unavailable; inspect the playlist manually instead.');return;}
    let ctx=null,source=null,raf=0,stopped=false,lastBeat=-1,lastClick=-1,shown=0;
    const stop=complete=>{
      if(stopped)return;stopped=true;
      cancelAnimationFrame(raf);
      try{source?.stop();}catch{}
      try{source?.disconnect();}catch{}
      if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});
      run.current=null;setRunning(false);setIndex(-1);setDone(shown);
      setReceipt(workoutReceipt(snapshot,shown,music));
      setStatus(complete?'Screen session ended. No actual workout completion or movement was measured.':'Stopped safely. Your local screen-demo summary is below.');
    };
    run.current={stop};
    setRunning(true);setIndex(-1);setDone(0);setReceipt(null);
    try{
      ctx=new Ctx({latencyHint:'interactive'});await ctx.resume();
      if(stopped)return;
      const start=ctx.currentTime+1.4;
      const anchor=start+(music==='local'?snapshot.offsetMs/1000:0);
      if(music==='local'){
        const buffer=audio.current;
        if(!buffer)throw new Error('Song was cleared.');
        const bad=workoutTrackError(program,buffer.duration);
        if(bad)throw new Error(bad);
        source=ctx.createBufferSource();source.buffer=buffer;
        const gain=ctx.createGain();gain.gain.value=.46;source.connect(gain);gain.connect(ctx.destination);
        source.start(start);
      }
      setStatus('Screen-guided dance mix started. Follow only the instructions that feel comfortable.');
      const frame=()=>{
        if(stopped)return;
        const clock=ctx.currentTime,beat=Math.floor((clock-anchor)*snapshot.bpm/60+1e-8);
        if(beat>=program.totalCounts){shown=program.totalCounts;stop(true);return;}
        if(beat>=0){
          shown=Math.max(shown,beat+1);
          if(beat!==lastBeat){lastBeat=beat;setIndex(beat);}
          if(music==='guide'&&beat!==lastClick){
            lastClick=beat;click(ctx,beat%8===0);
          }
        }
        raf=requestAnimationFrame(frame);
      };
      raf=requestAnimationFrame(frame);
    }catch(err){stop(false);setStatus('Audio preview failed: '+(err?.message||'Unknown error'));}
  }
  const percentage=Math.round(((running&&index>=0?index+1:done)/plan.totalCounts)*100);
  return <div className="academy-shell workout-shell">
    <header className="academy-header"><a className="logo" href="index.html"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <nav><a href="performance.html">PERFORMANCE STUDIO ↗</a><a href="academy.html">DANCE ACADEMY ↗</a><a href="create.html">CHOREOGRAPHY CREATOR ↗</a><a href="class.html">QUEST CLASS ↗</a></nav></header>
    <main className="academy-main workout-main">
      <p className="eyebrow"><span className="dot"/> DANCEFLOW R6 / THE WORKOUT BUILDER</p>
      <h1>BUILD YOUR <em>SET.</em></h1>
      <p className="academy-intro">Make your own dance workout by mixing the techniques from Dance Academy. Start easy, flow through different styles, take recovery breaks, then cool down. Every cue has an optional seated alternative, and the session runs locally in your browser.</p>
      <div className="workout-actions-header">
        <button disabled={running} onClick={()=>downloadFile('pulse369-dance-workout.json',encodeWorkout(recipe))}>↓ SAVE WORKOUT RECIPE</button>
        <label className="workout-import">↑ LOAD SAVED WORKOUT
          <input type="file" accept=".json,application/json" disabled={running} onChange={importFile}/>
        </label>
      </div>
      <div className="academy-layout workout-layout">
        <section className="academy-panel">
          <div className="academy-panel-head"><h2>01 / BUILD YOUR MIX</h2><span>{plan.sectionCount} DANCE SECTIONS · {plan.recoveryCount} BREAKS</span></div>
          <div className="workout-settings">
            <label>WORKOUT NAME
              <input type="text" maxLength={60} disabled={running} value={recipe.title}
                onChange={e=>{const v=e.target.value;if(v.trim())update({title:v},'Renamed your set.');}}/>
            </label>
            <label>MANUAL TEMPO<select disabled={running} value={recipe.bpm} onChange={e=>update({bpm:Number(e.target.value)},'Manual BPM updated.')}>
              {WORKOUT_BPM.map(n=><option key={n} value={n}>{n} BPM</option>)}
            </select></label>
            <label>SESSION LENGTH<select disabled={running} value={recipe.minutes} onChange={e=>update({minutes:Number(e.target.value)},'Workout length updated.')}>
              {WORKOUT_MINUTES.map(n=><option key={n} value={n}>{n} MINUTES</option>)}
            </select></label>
            <label>BEAT OFFSET (MS)
              <input type="number" min="0" max="1000" step="25" disabled={running} value={recipe.offsetMs}
                onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0&&n<=1000)update({offsetMs:n},'Song beat offset updated.');}}/>
            </label>
          </div>
          <fieldset className="academy-posture" disabled={running}><legend>MY VERSION</legend>
            <label><input type="radio" checked={recipe.posture==='standing'} onChange={()=>update({posture:'standing'},'Standing instructions selected.')}/> Standing, small steps</label>
            <label><input type="radio" checked={recipe.posture==='seated'} onChange={()=>update({posture:'seated'},'Seated adaptations selected.')}/> Seated toe taps / arm movement</label>
          </fieldset>
          <fieldset className="academy-posture" disabled={running}><legend>MY PACE OPTION (NOT A FITNESS SCORE)</legend>
            <label><input type="radio" checked={recipe.pace==='easy'} onChange={()=>update({pace:'easy'},'Easy optional movements selected.')}/> Easy: minimal range or watch</label>
            <label><input type="radio" checked={recipe.pace==='steady'} onChange={()=>update({pace:'steady'},'Steady comfortable rhythm selected.')}/> Steady: comfortable rhythm, no extra effort required</label>
          </fieldset>
          <h2>02 / ORDER YOUR DANCE SECTIONS</h2>
          <p>Each selection is an eight-count technique. Your playlist repeats as needed to fill the chosen time; a recovery break appears after pairs of dance sections. Select any row to preview its footwork.</p>
          <div className="workout-playlist">
            {recipe.playlist.map((id,i)=><div key={i} className={'workout-playlist-row'+(i===selectedSlot?' active':'')}>
              <button disabled={running} className="workout-select-row" onClick={()=>setSelectedSlot(i)} aria-pressed={i===selectedSlot}>
                <span>{String(i+1).padStart(2,'0')}</span><strong>{LESSONS[id].name}</strong>
              </button>
              <select disabled={running} aria-label={'Technique for section '+(i+1)} value={id}
                onChange={e=>playlist({type:'replace',index:i,lesson:e.target.value},'Dance technique changed.')}>
                {LESSON_IDS.map(key=><option key={key} value={key}>{LESSONS[key].name}</option>)}
              </select>
              <button aria-label={'Move section '+(i+1)+' earlier'} disabled={running||i===0} onClick={()=>playlist({type:'move',index:i,direction:-1},'Section moved earlier.')}>↑</button>
              <button aria-label={'Move section '+(i+1)+' later'} disabled={running||i===recipe.playlist.length-1} onClick={()=>playlist({type:'move',index:i,direction:1},'Section moved later.')}>↓</button>
              <button aria-label={'Remove section '+(i+1)} disabled={running||recipe.playlist.length===1} onClick={()=>playlist({type:'remove',index:i},'Section removed.')}>×</button>
            </div>)}
          </div>
          <div className="workout-playlist-add">
            <button disabled={running||recipe.playlist.length>=MAX_PLAYLIST}
              onClick={()=>playlist({type:'add',index:selectedSlot,lesson:recipe.playlist[selectedSlot]},'Duplicated selected section.')}>+ DUPLICATE SECTION</button>
            <button disabled={running} onClick={()=>{update(starterWorkout(),'Reset to the original three-style mix.');setSelectedSlot(0);}}>RESET SAMPLE</button>
          </div>
          <h2>03 / SOUNDTRACK</h2>
          <fieldset className="academy-posture" disabled={running}><legend>SOUND SOURCE</legend>
            <label><input type="radio" checked={audioMode==='guide'} onChange={()=>setAudioMode('guide')}/> Synthesized beat guide</label>
            <label><input type="radio" checked={audioMode==='local'} onChange={()=>setAudioMode('local')}/> Local MP3/WAV, no upload</label>
          </fieldset>
          {audioMode==='local'&&<div className="workout-song">
            <label>CHOOSE A LOCALLY DOWNLOADED SONG (24 MB MAX)
              <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={running} onChange={pickAudio}/>
            </label>
            <p role="status">{audioStatus}</p>
            {audioError&&<p role="alert" className="workout-audio-error">{audioError}</p>}
          </div>}
          <label className="workout-reduced"><input type="checkbox" checked={reducedMotion} disabled={running}
            onChange={e=>setReducedMotion(e.target.checked)}/> Reduced-motion floor guide (no shoe animation)</label>
          <div className="academy-warning"><strong>SAFETY:</strong> All movement is optional. Keep your feet inside your cleared space; avoid spins, jumps, deep bends and forced stretches. Use stable seating for seated options. Stop for pain, dizziness or imbalance and take more recovery whenever you want.</div>
          <div className="academy-actions">
            <button disabled={running||!!audioError} onClick={play}>▶ START MY DANCE SET</button>
            <button disabled={!running} onClick={()=>run.current?.stop(false)}>■ STOP SESSION</button>
          </div>
          <p className="academy-status" role="status">{status}</p>
        </section>
        <section className="academy-panel workout-stage">
          <div className="academy-panel-head"><h2>04 / YOUR DANCE FLOOR</h2><span>ILLUSTRATION ONLY · NO SENSOR TRACKING</span></div>
          <div className="academy-live-cue">
            <div><small>{cue.kind.toUpperCase()}</small><strong>{cue.countWithinEight}</strong><span>COUNT / 8</span></div>
            <article><small>{cue.label}</small><strong>{cue.name}</strong><p>{cue.instruction}</p></article>
          </div>
          <Floor cue={cue} calm={reducedMotion}/>
          <p className="academy-tip"><strong>COACHING NOTE · {recipe.pace==='easy'?'EASY':'STEADY'} OPTION</strong>
            {cue.tip} {recipe.pace==='easy'?'A small gesture, stillness or watching is completely acceptable.':'Follow the rhythm comfortably; you never need to increase your effort.'}
          </p>
          {next&&<div className="workout-up-next"><small>COMING UP IN {next.inCounts} COUNT{next.inCounts!==1?'S':''}</small><strong>{next.label}</strong></div>}
          <div className="academy-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
            <div style={{width:percentage+'%'}}/></div>
          <div className="workout-counter"><span>{running?'GUIDED COUNTS DISPLAYED':'PREVIEW / PAST DISPLAYED'}</span><strong>{running?Math.max(0,index+1):done} / {plan.totalCounts}</strong></div>
          <h2>THE SESSION TIMELINE</h2>
          <div className="workout-timeline">
            {plan.segments.map((s,i)=><div key={i} className={'workout-timeline-segment '+s.kind+((current>=s.start&&current<s.end)?' current':'')}>
              <span>{String(i+1).padStart(2,'0')}</span>
              <strong>{s.label}</strong>
              <small>{Math.round(s.counts*60/recipe.bpm)} SEC</small>
            </div>)}
          </div>
          <h2>EXPORT THE HAND-CUE CHOREOGRAPHY</h2>
          <p>The workout recipe JSON preserves your section order, duration, seated preference and settings. The separate Creator-compatible file exports only hand cues, because the older choreography format has no footwork, breaks or workout metadata.</p>
          <button className="academy-export" disabled={running}
            onClick={()=>downloadFile('pulse369-workout-hand-cues.danceflow.json',encodeChart(workoutChoreoChart(recipe)))}>
            ↓ EXPORT R2 HAND-CUE CHART
          </button>
          <p className="academy-footnote">Import the hand-cue file into <a href="create.html">Choreography Creator</a> or <a href="class.html">The Choreographer</a>. For the complete workout sequence, use <strong>Save Workout Recipe</strong> above and load it back into this page.</p>
          {receipt&&<details className="academy-receipt"><summary>LOCAL SCREEN DEMONSTRATION RECEIPT</summary><pre>{JSON.stringify(receipt,null,2)}</pre></details>}
        </section>
      </div>
      <footer className="academy-footer"><span>PULSE369 / DANCEFLOW R6 · OPEN, LOCAL & OPTIONAL MOVEMENT</span><a href="academy.html">LEARN THE STEPS ↗</a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<Workout/>);
