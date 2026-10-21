import React, {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ACADEMY_MINUTES,ACADEMY_BPMS,LESSON_IDS,LESSONS,academyPlan,academyCue,academyExportChart,academyReceipt} from './dance-academy.mjs';
import {encodeChart} from './choreo-model.mjs';
import './styles.css';
import './quest-lab.css';
import './academy.css';

const READY='Pick a dance technique. Tap the eight-count cards to learn the pattern before practicing.';
function metronome(ctx,down){
  if(!ctx||ctx.state!=='running')return;
  try{
    const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();
    o.type='sine';o.frequency.setValueAtTime(down?205:128,t);
    o.frequency.exponentialRampToValueAtTime(70,t+.08);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(down?.075:.032,t+.009);
    g.gain.exponentialRampToValueAtTime(.0001,t+.1);
    o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.11);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }catch{ /* Audio is an optional simple count guide. */ }
}
function exportChart(id,bpm){
  const chart=academyExportChart(id,bpm);
  const url=URL.createObjectURL(new Blob([encodeChart(chart)],{type:'application/json'}));
  const link=document.createElement('a');
  link.href=url;link.download='pulse369-'+id+'-academy.danceflow.json';
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),0);
}
function FeetDiagram({cue,reducedMotion}){
  if(!cue)return null;
  const positions=cue.footDiagram;
  const active=cue.focus;
  return <div className={'academy-feet'+(reducedMotion?' calm':'')} role="img"
    aria-label={'Illustrative top-down foot placement: left and right shoes, '+(cue.seated?'seated, feet neutral':'optional small in-place foot taps')+'. Active cue: '+active+'. No tracking.'}>
    <div className="academy-floor-guide"/><div className="academy-center-line"/>
    <div className="academy-floor-label top">FRONT</div>
    {['left','right'].map(side=>{
      const p=positions[side];
      return <div key={side} className={'academy-foot '+side+((active===side||active==='both')?' active':'')}
        style={{left:(50+p.x*88)+'%',top:(53+p.z*110)+'%'}}>
        <div className="academy-toe"/>
        <span>{side==='left'?'L':'R'}</span>
      </div>;
    })}
    <div className="academy-floor-label bottom">STAY INSIDE YOUR OWN SPACE</div>
  </div>;
}
function Academy(){
  const [lesson,setLesson]=useState('house');
  const [bpm,setBpm]=useState(96);
  const [minutes,setMinutes]=useState(2);
  const [posture,setPosture]=useState('standing');
  const [reducedMotion,setReducedMotion]=useState(false);
  const [guideOn,setGuideOn]=useState(true);
  const [selected,setSelected]=useState(0);
  const [running,setRunning]=useState(false);
  const [displayed,setDisplayed]=useState(-1);
  const [lastCount,setLastCount]=useState(0);
  const [status,setStatus]=useState(READY);
  const [receipt,setReceipt]=useState(null);
  const run=useRef(null);
  const plan=academyPlan(lesson,bpm,minutes);
  const segment=plan.segments.find(p=>p.id==='join');
  const selectedCueIndex=segment.start+selected;
  const cue=academyCue(plan,running&&displayed>=0?displayed:selectedCueIndex,posture);
  const previewProgress=running&&displayed>=0?(displayed+1)/plan.total:0;
  const fullLesson=LESSONS[lesson];

  useEffect(()=>()=>{run.current?.stop(false);},[]);
  function changeLesson(id){
    if(running)return;
    setLesson(id);setSelected(0);setReceipt(null);setLastCount(0);
    setStatus('Technique selected. Click each count to read its standing and seated instructions.');
  }
  async function start(){
    if(running||run.current)return;
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx){setStatus('Web Audio unavailable. You can still step through the lesson cards manually.');return;}
    let ctx=null,raf=0,stopped=false,lastTick=-1,lastUI=-1,shown=0;
    const captured={lesson,bpm,minutes,posture,guideOn,plan};
    const stop=complete=>{
      if(stopped)return;stopped=true;
      cancelAnimationFrame(raf);
      if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});
      run.current=null;setRunning(false);setDisplayed(-1);setLastCount(shown);
      setReceipt(academyReceipt(captured.plan,shown,captured.posture));
      setStatus(complete?'Practice demonstration complete. No physical movements were measured.':'Practice stopped. Your local screen-only receipt is available.');
    };
    run.current={stop};setRunning(true);setDisplayed(-1);setReceipt(null);setLastCount(0);
    setStatus('Practice running. Follow the instruction only if comfortable; seated alternatives are equally valid.');
    try{
      ctx=new Ctx({latencyHint:'interactive'});await ctx.resume();
      if(stopped)return;
      const anchor=ctx.currentTime+1.25;
      const frame=()=>{
        if(stopped)return;
        const now=ctx.currentTime;
        const count=Math.floor((now-anchor)*captured.bpm/60+1e-8);
        if(count>=captured.plan.total){shown=captured.plan.total;stop(true);return;}
        if(count>=0){
          shown=Math.max(shown,count+1);
          if(count!==lastUI){lastUI=count;setDisplayed(count);}
          if(captured.guideOn&&count!==lastTick){lastTick=count;metronome(ctx,count%8===0);}
        }
        raf=requestAnimationFrame(frame);
      };
      raf=requestAnimationFrame(frame);
    }catch(err){stop(false);setStatus('Count guide failed: '+(err?.message||'unknown error'));}
  }
  return <div className="academy-shell">
    <header className="academy-header"><a className="logo" href="index.html"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <nav><a href="workout.html">BUILD A DANCE WORKOUT ↗</a><a href="create.html">CHOREOGRAPHY CREATOR ↗</a><a href="class.html">DANCE CLASS ↗</a></nav>
    </header>
    <main className="academy-main">
      <p className="eyebrow"><span className="dot"/> DANCEFLOW R5 / TECHNIQUE TRAINING</p>
      <h1>LEARN THE <em>FLOOR.</em></h1>
      <p className="academy-intro">Learn recognizable beginner dance techniques one count at a time, then string them into a gentle dance workout. Every standing cue has a seated alternative. This is an instructional screen demo, not a camera or foot-tracking system.</p>
      <div className="academy-lesson-grid" aria-label="Choose a dance lesson">
        {LESSON_IDS.map(id=><button key={id} disabled={running} aria-pressed={id===lesson} className={'academy-lesson'+(id===lesson?' selected':'')} onClick={()=>changeLesson(id)}>
          <span>0{LESSON_IDS.indexOf(id)+1} / TECHNIQUE</span>
          <strong>{LESSONS[id].name}</strong><small>{LESSONS[id].tag}</small>
        </button>)}
      </div>
      <div className="academy-layout">
        <section className="academy-panel">
          <div className="academy-panel-head"><h2>THE TECHNIQUE</h2><span>{fullLesson.style.toUpperCase()} · EIGHT COUNTS</span></div>
          <p>{fullLesson.intro}</p>
          <div className="academy-settings">
            <label>MANUAL TEMPO<select value={bpm} disabled={running} onChange={e=>setBpm(Number(e.target.value))}>
              {ACADEMY_BPMS.map(v=><option key={v} value={v}>{v} BPM</option>)}
            </select></label>
            <label>PRACTICE LENGTH<select value={minutes} disabled={running} onChange={e=>setMinutes(Number(e.target.value))}>
              {ACADEMY_MINUTES.map(v=><option key={v} value={v}>{v} MINUTES</option>)}
            </select></label>
          </div>
          <fieldset className="academy-posture" disabled={running}><legend>MY MOVEMENT VERSION</legend>
            <label><input type="radio" checked={posture==='standing'} onChange={()=>setPosture('standing')}/> Standing, small in-place steps</label>
            <label><input type="radio" checked={posture==='seated'} onChange={()=>setPosture('seated')}/> Seated, toe taps and arm rhythm</label>
          </fieldset>
          <div className="academy-checks">
            <label><input type="checkbox" checked={reducedMotion} disabled={running} onChange={e=>setReducedMotion(e.target.checked)}/> Reduced motion diagrams</label>
            <label><input type="checkbox" checked={guideOn} disabled={running} onChange={e=>setGuideOn(e.target.checked)}/> Audio count guide</label>
          </div>
          <h2>THE EIGHT-COUNT</h2>
          <div className="academy-beat-grid">
            {fullLesson.counts.map((c,i)=><button type="button" disabled={running} key={i} className={'academy-beat'+(selected===i?' active':'')}
              aria-pressed={selected===i} onClick={()=>setSelected(i)}>
              <span>{i+1}</span><strong>{c.label}</strong>
            </button>)}
          </div>
          <div className="academy-warning"><strong>COMFORT FIRST.</strong> {fullLesson.safety} Clear the floor, use supportive seating if seated, and stop for pain, dizziness or loss of balance. You can always watch instead of moving.</div>
          <div className="academy-actions">
            <button onClick={start} disabled={running}>▶ START GUIDED PRACTICE</button>
            <button onClick={()=>run.current?.stop(false)} disabled={!running}>■ STOP</button>
          </div>
          <p className="academy-status" role="status">{status}</p>
        </section>
        <section className="academy-panel academy-visual">
          <div className="academy-panel-head"><h2>THE FLOOR GUIDE</h2><span>ILLUSTRATION ONLY · NO SENSORS</span></div>
          <div className="academy-live-cue">
            <div><small>{cue.phaseName}</small><strong>{cue.count}</strong><span>COUNT / 8</span></div>
            <article><small>{posture==='seated'?'SEATED ADAPTATION':'IN-PLACE FOOTWORK'}</small>
              <strong>{cue.label}</strong><p>{cue.instruction}</p></article>
          </div>
          <FeetDiagram cue={cue} reducedMotion={reducedMotion}/>
          <p className="academy-tip"><strong>INSTRUCTOR TIP</strong> {cue.tip}</p>
          <div className="academy-progress"><div style={{width:(previewProgress*100)+'%'}}/></div>
          <div className="academy-stats"><div><small>SESSION PHASES</small><strong>6</strong></div>
            <div><small>GUIDED COUNTS</small><strong>{running?Math.max(0,displayed+1):lastCount} / {plan.total}</strong></div></div>
          <h2>LESSON STRUCTURE</h2>
          <div className="academy-phases">
            {plan.segments.map((s,i)=><div className={cue.phase===s.id?'current':''} key={s.id}>
              <span>{String(i+1).padStart(2,'0')}</span><strong>{s.label}</strong><small>{s.counts} COUNTS</small>
            </div>)}
          </div>
          <h2>TAKE THIS INTO CHOREOGRAPHY CREATOR</h2>
          <p>The export includes the original style's eight hand-movement cues. Footwork teaching notes and diagrams stay in this Academy; the existing portable format does not encode feet.</p>
          <button className="academy-export" onClick={()=>exportChart(lesson,bpm)}>↓ EXPORT COMPATIBLE ROUTINE JSON</button>
          <p className="academy-footnote">Open <a href="create.html">Choreography Creator</a>, import the JSON, customize your arm routine, then load it into <a href="class.html">The Choreographer</a>. The file contains no personal data, audio, or tracked movement.</p>
          {receipt&&<details className="academy-receipt"><summary>LOCAL SCREEN-PREVIEW RECEIPT</summary>
            <pre>{JSON.stringify(receipt,null,2)}</pre></details>}
        </section>
      </div>
      <footer className="academy-footer"><span>PULSE369 / DANCE ACADEMY R5 · LOW-IMPACT OPTIONS · NO UPLOADS</span><a href="index.html">BACK TO PULSE369 ↗</a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<Academy/>);
