'use client';
import { useState } from 'react';
import { Check, Circle, ListChecks, Play, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { COACHES, type Career, type Preset } from '@/lib/training';
import { MODES } from '@/lib/pulse';
import { JOURNEYS, journeyPresets, nextJourneyPreset, type Journey } from '@/lib/journeys';

type Props={career:Career;selected?:string;signedIn:boolean;disabled:boolean;busy:boolean;hasClan:boolean;onChoose:(j:Journey,group?:boolean)=>Promise<void>;onPractice:(p:Preset)=>void};
export default function PathHub({career,selected,signedIn,disabled,busy,hasClan,onChoose,onPractice}:Props){
 const [view,setView]=useState(selected||career.journeys.find(j=>!j.completed_at)?.id||JOURNEYS[0].id);
 const journey=JOURNEYS.find(j=>j.id===view)!,steps=journeyPresets(journey),state=career.journeys.find(j=>j.id===view),next=state?nextJourneyPreset(journey,state):steps[0];
 const completed=state?.next_step??0,done=!!state?.completed_at,coach=COACHES.find(c=>c.id===journey.coach)!;
 return <>
  <div className="intro"><div><h1>A routine you can return to.</h1><p className="sub">Four training paths. One session at a time, with space to rest.</p></div><span className="tag">No daily deadline</span></div>
  {!signedIn&&<p className="notice" style={{marginBottom:20}}>Sign in to save your next step. You can practice any session without starting a path.</p>}
  <div className="path-picker">{JOURNEYS.map(j=>{const enrolled=career.journeys.find(s=>s.id===j.id);return <button className={`path-choice ${view===j.id?'selected':''}`} key={j.id} onClick={()=>setView(j.id)} aria-pressed={view===j.id} style={{'--path-color':j.color} as React.CSSProperties}><span className="eyebrow">{j.focus}</span><strong>{j.title}</strong><span>{enrolled?.completed_at?'Completed':enrolled?`${enrolled.next_step} / ${j.presets.length} steps complete`:`${j.presets.length} sessions · ${journeyPresets(j).reduce((n,p)=>n+p.minutes,0)} total min`}</span></button>;})}</div>
  <div className="path-layout" style={{'--path-color':journey.color} as React.CSSProperties}>
   <section className="card path-map"><div className="room-top"><div><p className="eyebrow">{journey.focus}</p><h2>{journey.title}</h2></div><ListChecks size={28}/></div><p className="sub">{journey.description}</p><div className="path-progress"><Progress className="progress" value={completed/steps.length*100} aria-label={`${journey.title}: ${completed} of ${steps.length} steps complete`}/><span>{completed} / {steps.length} steps</span></div>
    <ol className="path-steps">{steps.map((p,index)=>{const finished=index<completed,current=!done&&index===completed;return <li key={index} className={`${finished?'complete':''} ${current?'current':''}`} aria-current={current?'step':undefined}><span className="path-step-marker">{finished?<Check size={18}/>:current?<Play size={16}/>:<Circle size={12}/>}</span><div><span className="eyebrow">STEP {index+1}{current?' · NEXT':''}</span><h3>{p.title}</h3><p>{MODES.find(m=>m.id===p.mode)?.title} · {p.minutes} min · {p.difficulty}</p></div>{finished&&<button className="btn small ghost" disabled={disabled} onClick={()=>onPractice(p)}>Practice</button>}<span className="path-step-time">{p.minutes}<small>MIN</small></span></li>;})}</ol>
   </section>
   <aside className="stack"><section className="card path-next"><p className="eyebrow">{done?'PATH COMPLETE':'YOUR NEXT SESSION'}</p><h2>{done?'You made a routine.':next?.title}</h2><p className="sub">{done?'Your achievement is on the shelf. Return to any step for practice, or choose another path.':next?.description}</p>{!done&&next&&<div className="path-next-meta"><strong>{next.minutes}<small>MINUTES</small></strong><div>{MODES.find(m=>m.id===next.mode)?.title}<span>{next.difficulty} · {next.world==='garden'?'Lantern Garden':'Guided session'}</span></div></div>}
    {done?<button className="btn" disabled={disabled} onClick={()=>onPractice(steps[0])}><Play/>Practice the first step</button>:<><button className="btn primary" disabled={disabled||busy||!signedIn} onClick={()=>void onChoose(journey)}><Play/>{busy?'Loading your step…':state?'Continue path':'Begin path'}</button><button className="btn" disabled={disabled||busy||!signedIn||!hasClan} onClick={()=>void onChoose(journey,true)}><Users/>Set up with my clan</button><p className="music-rule">Complete the full session with this step selected to advance. Shorter or partial sessions still count toward your personal goals.</p></>}
   </section><section className="card path-coach"><p className="eyebrow">A NOTE FROM {coach.name.toUpperCase()}</p><h3>There is no race.</h3><p className="sub">Take breaks between sessions and return when you feel ready. Choose seated movement or a comfortable pace in Studio. Your music works throughout.</p></section></aside>
  </div>
 </>;
}
