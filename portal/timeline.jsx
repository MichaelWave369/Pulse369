import React,{useState,useMemo} from 'react';
import {createRoot} from 'react-dom/client';
import {
  STAGES,starterShow,replaceSource,parseShow,buildShow,sampleShow
} from './dance-performance.mjs';
import {STYLES,parseChart,MAX_CHART_BYTES} from './choreo-model.mjs';
import {parseWorkout,MAX_RECIPE_BYTES} from './dance-workout.mjs';
import {
  TIMELINE_SCHEMA,TIMELINE_MAX_BYTES,starterTimeline,timelineFromSource,
  parseTimeline,encodeTimeline,editPhrase,editCount,updateNote,updateStage,
  timelineRows,timelineCueSheet
} from './dance-timeline.mjs';
import MotionCoachFigure from './motion-coach-figure.jsx';
import './styles.css';
import './quest-lab.css';
import './timeline.css';

const save=(filename,text,type='application/json')=>{
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const ftime=s=>{
  const n=Math.max(0,s);
  return Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toFixed(2).padStart(5,'0');
};
function Timeline(){
  const [timeline,setTimeline]=useState(starterTimeline);
  const [chosen,setChosen]=useState(0);
  const [scrub,setScrub]=useState(0);
  const [status,setStatus]=useState('Ready. Load a choreography/show or edit the sample stage cues.');
  const [newStyle,setNewStyle]=useState('groove');
  const plan=useMemo(()=>buildShow(timeline.show),[timeline]);
  const rows=useMemo(()=>timelineRows(timeline),[timeline]);
  const segment=rows[Math.min(chosen,rows.length-1)];
  const chart=timeline.show.source.kind==='chart'?timeline.show.source.data:null;
  const phrase=chart?.phrases[segment.index]||null;
  const count=phrase?Math.floor(Math.max(0,scrub-segment.start))%8:0;
  const step=phrase?.steps[count]||null;
  const display=sampleShow(plan,Math.min(scrub,plan.totalCounts-1));
  const scale=3.2;
  function select(i){
    setChosen(i);setScrub(rows[i].start);
  }
  function apply(action,message,nextSelected){
    try{
      const next=action(timeline);
      const nextRows=timelineRows(next);
      const i=Math.max(0,Math.min(nextSelected??chosen,nextRows.length-1));
      const oldLocal=Math.max(0,scrub-(rows[chosen]?.start||0));
      const preserve=(nextSelected===undefined||nextSelected===chosen)?oldLocal:0;
      setTimeline(next);setChosen(i);setScrub(Math.min(nextRows[i].end-1,nextRows[i].start+preserve));
      setStatus(message);
    }catch(err){setStatus('Edit rejected: '+(err?.message||'Invalid operation'));}
  }
  async function importFile(event){
    const file=event.target.files?.[0];event.target.value='';
    if(!file)return;
    if(file.size>TIMELINE_MAX_BYTES){setStatus('Import exceeds 128 KiB.');return;}
    try{
      const text=await file.text(),raw=JSON.parse(text);
      let next;
      if(raw?.schema===TIMELINE_SCHEMA)next=parseTimeline(text);
      else if(raw?.schema==='pulse369.dance-performance.v1')next=timelineFromSource(parseShow(text));
      else if(raw?.schema==='pulse369.choreography.v1'){
        if(file.size>MAX_CHART_BYTES)throw new Error('R2 chart exceeds 64 KiB.');
        next=timelineFromSource(replaceSource(starterShow(),'chart',parseChart(text)));
      }else if(raw?.schema==='pulse369.dance-workout.v1'){
        if(file.size>MAX_RECIPE_BYTES)throw new Error('R6 recipe exceeds 16 KiB.');
        next=timelineFromSource(replaceSource(starterShow(),'workout',parseWorkout(text)));
      }else throw new Error('Unrecognized DanceFlow JSON format.');
      setTimeline(next);setChosen(0);setScrub(0);
      setStatus('Loaded '+next.show.source.kind+' locally. No audio, camera data or uploads.');
    }catch(err){setStatus('Import rejected: '+(err?.message||'Invalid file'));}
  }
  const styleOption=STYLES.includes(newStyle)?newStyle:'groove';
  return <div className="tl-shell">
    <header className="tl-header">
      <a href="index.html" className="tl-logo">ϕ PULSE <strong>369</strong></a>
      <nav><a href="performance.html">PERFORMANCE STUDIO ↗</a><a href="create.html">CHOREOGRAPHY CREATOR ↗</a><a href="workout.html">WORKOUT BUILDER ↗</a></nav>
    </header>
    <main className="tl-main">
      <p className="tl-eyebrow">DANCEFLOW R9 / THE TIMELINE COMPOSER</p>
      <h1>DIRECT EVERY <em>COUNT.</em></h1>
      <p className="tl-intro">Put movements, music-count positions, stage changes, and director notes on a shared timeline. Edit original R2 hand-cue choreography in eight-count phrases, then send the finished show to R8's Performance Studio. All data stays in your browser until you export it.</p>
      <div className="tl-toolbar">
        <label className="tl-upload" tabIndex={0}>↑ IMPORT R2 / R6 / R7 / R9
          <input type="file" accept=".json,application/json" onChange={importFile}/>
        </label>
        <button onClick={()=>save('pulse369-director-timeline.json',encodeTimeline(timeline))}>↓ SAVE R9 EDITING DOCUMENT</button>
        <button onClick={()=>save('pulse369-stage-show.json',JSON.stringify(timeline.show,null,2)+'\n')}>↓ EXPORT R7 PERFORMANCE SHOW</button>
        <button onClick={()=>save('pulse369-timeline-cues.txt',timelineCueSheet(timeline),'text/plain')}>↓ EXPORT CUE SHEET</button>
        <button onClick={()=>{setTimeline(starterTimeline());setChosen(0);setScrub(0);setStatus('Reset to sample workout.');}}>↺ RESET</button>
      </div>
      <p className="tl-status" role="status">{status}</p>
      <div className="tl-stats">
        <div><span>SHOW TITLE</span><strong>{timeline.show.title}</strong></div>
        <div><span>SOURCE</span><strong>{chart?'R2 EDITABLE CHART':'R6 GENERATED WORKOUT'}</strong></div>
        <div><span>MANUAL BPM</span><strong>{plan.bpm}</strong></div>
        <div><span>TOTAL COUNTS</span><strong>{plan.totalCounts}</strong></div>
        <div><span>END TIME</span><strong>{ftime(plan.durationSeconds+plan.offsetMs/1000)}</strong></div>
      </div>
      <section className="tl-tracks">
        <div className="tl-section-head"><h2>01 / THE SHOW TIMELINE</h2><span>CLICK ANY CLIP TO SELECT · SCROLL HORIZONTALLY</span></div>
        <div className="tl-timeline-scroll" tabIndex={0} aria-label="Horizontal dance timeline, scroll to explore later counts">
          <div className="tl-time-ruler">
            <div className="tl-lane-label">MUSICAL CLOCK</div>
            <div className="tl-ruler-cells">{rows.map(r=><div key={r.index} className="tl-ruler-cell"
                style={{width:Math.max(140,r.counts*scale)}}>
                <b>{ftime(r.startSeconds)}</b><span>BEAT {r.start+1}</span>
              </div>)}</div>
          </div>
          <div className="tl-lane">
            <div className="tl-lane-label">01 / MOVEMENTS</div>
            <div className="tl-lane-clips">{rows.map(r=><button key={r.index}
              style={{width:Math.max(140,r.counts*scale)}}
              className={'tl-clip move'+(r.index===chosen?' chosen':'')}
              aria-pressed={r.index===chosen} onClick={()=>select(r.index)}>
              <span>#{r.index+1} / {r.kind.toUpperCase()}</span><strong>{r.label}</strong>
              <small>{r.counts} COUNTS · {r.durationSeconds.toFixed(1)} S</small>
            </button>)}</div>
          </div>
          <div className="tl-lane">
            <div className="tl-lane-label">02 / STAGE LOOKS</div>
            <div className="tl-lane-clips">{rows.map(r=><button key={r.index}
              style={{width:Math.max(140,r.counts*scale),borderTopColor:STAGES[r.stage].accent}}
              className={'tl-clip stage'+(r.index===chosen?' chosen':'')}
              onClick={()=>select(r.index)}
              aria-label={'Edit stage '+STAGES[r.stage].name+' for '+r.label}>
              <span>SCENE {r.index+1}</span><strong style={{color:STAGES[r.stage].accent}}>{STAGES[r.stage].name}</strong>
            </button>)}</div>
          </div>
          <div className="tl-lane">
            <div className="tl-lane-label">03 / DIRECTOR NOTES</div>
            <div className="tl-lane-clips">{rows.map(r=><button key={r.index}
              style={{width:Math.max(140,r.counts*scale)}}
              className={'tl-clip note'+(r.index===chosen?' chosen':'')}
              onClick={()=>select(r.index)}
              aria-label={'Edit director note for '+r.label}>
              <span>CUE NOTE {r.index+1}</span><strong>{r.note||'ADD A CUE NOTE…'}</strong>
            </button>)}</div>
          </div>
        </div>
        <div className="tl-scrub">
          <label htmlFor="tl-playhead">PREVIEW AUTHOR-SET COUNT: {scrub+1} / {plan.totalCounts} · MUSIC TIME {ftime(scrub*60/plan.bpm+plan.offsetMs/1000)}</label>
          <input id="tl-playhead" type="range" min="0" max={plan.totalCounts-1} step="1" value={scrub}
            onChange={e=>{
              const index=Number(e.target.value),target=rows.find(r=>index>=r.start&&index<r.end);
              setScrub(index);if(target)setChosen(target.index);
            }}/>
          <p>No waveform, beat detection or song playback here. The ruler uses your authored BPM and offset. Use R8 Performance Studio to rehearse to a locally chosen song.</p>
        </div>
      </section>
      <div className="tl-bottom">
        <section className="tl-panel tl-editor">
          <div className="tl-section-head"><h2>02 / EDIT SELECTED SECTION</h2><span>#{chosen+1} · {segment.kind.toUpperCase()}</span></div>
          <div className="tl-readout"><b>{segment.label}</b><span>COUNT {segment.start+1}–{segment.end}</span></div>
          <label>SHOW TITLE
            <input maxLength={64} value={timeline.show.title}
              onChange={e=>{
                if(e.target.value.trim())apply(t=>({...t,show:{...t.show,title:e.target.value}}),'Show title updated.',chosen);
              }}/>
          </label>
          <label>STAGE LOOK
            <select value={segment.stage} onChange={e=>apply(t=>updateStage(t,chosen,e.target.value),'Stage direction updated.',chosen)}>
              {Object.entries(STAGES).map(([id,s])=><option value={id} key={id}>{s.name}</option>)}
            </select>
          </label>
          <label>DIRECTOR'S SECTION NOTES (MAX 240)
            <textarea rows={3} maxLength={240} value={segment.note}
              onChange={e=>apply(t=>updateNote(t,chosen,e.target.value),'Section cue note updated.',chosen)}
              placeholder="Entrance, musical accent, stage directions or rehearsal reminders…"/>
          </label>
          {chart&&phrase?<>
            <h3>PHRASE EDITOR · EIGHT-COUNT</h3>
            <label>PHRASE NAME
              <input maxLength={40} value={phrase.name}
                onChange={e=>{if(e.target.value.trim())apply(t=>editPhrase(t,chosen,'rename',{name:e.target.value}),'Phrase renamed.',chosen);}}/>
            </label>
            <div className="tl-two">
              <label>PHRASE REPEATS
                <select value={phrase.repeat}
                  onChange={e=>apply(t=>editPhrase(t,chosen,'repeat',{repeat:Number(e.target.value)}),'Repeat count updated.',chosen)}>
                  {[1,2,3,4].map(n=><option key={n} value={n}>{n}× EIGHT COUNTS</option>)}
                </select>
              </label>
              <label>CHANGE PHRASE STYLE
                <select value={phrase.steps[0].style}
                  onChange={e=>apply(t=>editPhrase(t,chosen,'style',{style:e.target.value}),'Restyled eight hand cues.',chosen)}>
                  {STYLES.map(s=><option value={s} key={s}>{s.toUpperCase()}</option>)}
                </select>
              </label>
            </div>
            <div className="tl-phrase-actions">
              <button disabled={chosen===0} onClick={()=>apply(t=>editPhrase(t,chosen,'move',{direction:-1}),'Moved phrase with its lighting and notes.',chosen-1)}>← MOVE EARLIER</button>
              <button disabled={chosen===rows.length-1} onClick={()=>apply(t=>editPhrase(t,chosen,'move',{direction:1}),'Moved phrase with its lighting and notes.',chosen+1)}>MOVE LATER →</button>
              <button disabled={rows.length>=16} onClick={()=>apply(t=>editPhrase(t,chosen,'duplicate'),'Duplicated phrase without copying private notes.',chosen+1)}>+ DUPLICATE</button>
              <button disabled={rows.length===1} onClick={()=>apply(t=>editPhrase(t,chosen,'delete'),'Deleted selected phrase.',Math.max(0,chosen-1))}>× DELETE</button>
            </div>
            <div className="tl-add">
              <select value={styleOption} aria-label="Style for next new phrase" onChange={e=>setNewStyle(e.target.value)}>
                {STYLES.map(s=><option value={s} key={s}>{s.toUpperCase()}</option>)}
              </select>
              <button disabled={rows.length>=16} onClick={()=>apply(t=>editPhrase(t,chosen,'add',{style:styleOption}),'Inserted new eight-count phrase.',chosen+1)}>+ INSERT NEW PHRASE</button>
            </div>
            <h3>EDIT INDIVIDUAL COUNTS</h3>
            <div className="tl-count-grid">
              {phrase.steps.map((s,i)=><button key={i} className={count===i?'active':''}
                aria-pressed={count===i} onClick={()=>setScrub(segment.start+i)}>
                <span>{i+1}</span><small>{s.style}</small>
              </button>)}
            </div>
            <div className="tl-two">
              <label>GESTURE STYLE
                <select value={step.style} onChange={e=>apply(t=>editCount(t,chosen,count,{style:e.target.value}),'Edited single hand cue.',chosen)}>
                  {STYLES.map(s=><option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              </label>
              <label>GESTURE INDEX
                <select value={step.moveIndex} onChange={e=>apply(t=>editCount(t,chosen,count,{moveIndex:Number(e.target.value)}),'Changed hand gesture index.',chosen)}>
                  {Array.from({length:8},(_,i)=><option value={i} key={i}>MOVE {i+1}</option>)}
                </select>
              </label>
            </div>
            <label className="tl-mirror"><input type="checkbox" checked={step.mirror} onChange={e=>apply(t=>editCount(t,chosen,count,{mirror:e.target.checked}),'Mirrored hand target.',chosen)}/> MIRROR THIS GESTURE</label>
          </>:<p className="tl-limits">R6 workout blocks are generated from the saved playlist. Stage looks and director notes are editable here, but warm-up, recovery and dance interval lengths remain governed by the R6 Workout Builder. For editable hand-gesture phrases, import an R2 choreography chart.</p>}
        </section>
        <section className="tl-panel tl-preview">
          <div className="tl-section-head"><h2>03 / PREVIEW THE CUE</h2><span>VISUAL ONLY · NOT BODY TRACKING</span></div>
          <div className="tl-coach" style={{'--scene-primary':STAGES[display?.scene?.theme||'neon'].accent}}>
            <MotionCoachFigure pose={display?.pose} reducedMotion={timeline.show.settings.reducedMotion}
              label="Procedurally authored dance cue figure, not the user's movements."/>
          </div>
          <div className="tl-preview-text">
            <small>{display?.scene?.label||'STAGE READY'}</small>
            <strong>{display?.cue?.name||'SELECT A COUNT'}</strong>
            <p>{display?.cue?.coach||'This is a script preview, not an assessment.'}</p>
          </div>
          <h3>TRACK CONTRACT</h3>
          <p>This editor rearranges authored R2 hand cues and their stage direction. It does not encode foot tracking, a musical waveform, captured dancers, video, real audio, or measured fitness results. Source R6 workout intervals are read-only here.</p>
          <p>After exporting **R7 Performance Show JSON**, open <a href="performance.html">Performance Studio</a> and import the file for actual local-music rehearsal.</p>
        </section>
      </div>
      <footer className="tl-footer">PULSE369 · DANCE TIMELINE COMPOSER R9 · MIT · LOCAL ONLY <a href="performance.html">OPEN PERFORMANCE STUDIO ↗</a></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<Timeline/>);
