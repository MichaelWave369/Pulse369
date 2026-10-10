import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  MANUAL_CHECKS,MANUAL_DEVICES,normalizeManualResults,
  manualGate,createManualAcceptanceReceipt
} from './quest-first-run.mjs';
import './styles.css';
import './quest-lab.css';
import './first-run.css';

const PHASES=[...new Set(MANUAL_CHECKS.map(x=>x.phase))];
const STATES=[
  {key:'not_run',label:'NOT RUN'},
  {key:'pass',label:'PASS'},
  {key:'fail',label:'FAIL'},
  {key:'blocked',label:'BLOCKED'},
];
const DEVICES=[
  {value:'unrecorded',label:'Not recorded'},
  {value:'quest3',label:'Meta Quest 3 (self-reported)'},
  {value:'other_headset',label:'Other headset (self-reported)'},
  {value:'desktop_only',label:'Desktop/browser only'},
];

function FirstRun(){
  const [device,setDevice]=useState('unrecorded');
  const [results,setResults]=useState(()=>normalizeManualResults());
  const [notice,setNotice]=useState('');
  const [showReport,setShowReport]=useState(false);
  const gate=manualGate(results,device);
  const report=createManualAcceptanceReceipt({device,results});
  const setResult=(id,value)=>{
    setResults(prev=>({...prev,[id]:value}));
    setShowReport(false);setNotice('');
  };
  const reset=()=>{
    setDevice('unrecorded');
    setResults(normalizeManualResults());
    setShowReport(false);
    setNotice('Checklist reset. The old report was not saved.');
  };
  const copy=async()=>{
    try{
      await navigator.clipboard.writeText(JSON.stringify(report,null,2));
      setShowReport(true);
      setNotice('Self-reported manual QA record copied. It is not independent device proof.');
    } catch {
      setShowReport(true);
      setNotice('Clipboard unavailable. Select the generated JSON below to copy it.');
    }
  };
  return <div className="shell quest-shell">
    <header className="quest-header">
      <a href="./" className="logo"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <a href="compare.html">QA COMPARE ↗</a>
    </header>
    <main className="quest-main">
      <p className="eyebrow">PULSE 369 / HUMAN-IN-THE-LOOP / QUEST QA</p>
      <h1>FIRST <em>RUN.</em></h1>
      <p className="quest-sub">The build is green. Now we need real-world observations. Use this guided checklist with a clear play area and your headset, recording only what you personally observed. Every mark is self-reported, never independently verified by this website.</p>
      <div className="first-intro">
        <section className="quest-card">
          <h2>01 / DEVICE AND SAFETY</h2>
          <label className="first-label" htmlFor="first-device">WHAT ARE YOU ACTUALLY TESTING ON?</label>
          <select id="first-device" value={device} onChange={e=>{setDevice(e.target.value);setShowReport(false);}}
            className="first-select">
            {DEVICES.map(d=><option value={d.value} key={d.value}>{d.label}</option>)}
          </select>
          <p>Use Quest Browser over HTTPS, with enough room to extend both arms gently. Start seated if needed. Press the system menu to leave VR if controls fail. Stop if movement causes pain or dizziness.</p>
          <p><strong>No headset available?</strong> Choose desktop-only. You can inspect the pages, but do not mark headset behavior PASS based on a browser build or a screenshot.</p>
        </section>
        <section className="quest-card first-gate">
          <h2>02 / MANUAL GATE</h2>
          <strong className="gate-name">{gate.gate.replaceAll('_',' ')}</strong>
          <p>{gate.description}</p>
          <div className="first-counts">
            <span><b>{gate.counts.pass}</b> PASS</span>
            <span><b>{gate.counts.fail}</b> FAIL</span>
            <span><b>{gate.counts.blocked}</b> BLOCKED</span>
            <span><b>{gate.counts.not_run}</b> NOT RUN</span>
          </div>
          <p className="first-caution">This page cannot authenticate hardware, operator identity, performance, or test receipts. A fully completed checklist is only a candidate for human review.</p>
        </section>
      </div>
      <section className="first-procedure">
        <h2>03 / MANUAL ACCEPTANCE STEPS</h2>
        <p>Open the linked lab in a separate browser tab and return here to mark the result. The checklist stays in this tab's memory only. <strong>NOT RUN</strong> is the correct answer when you haven't tried something.</p>
        {PHASES.map(phase=><div className="first-phase" key={phase}>
          <h3>{phase.toUpperCase()}</h3>
          {MANUAL_CHECKS.filter(c=>c.phase===phase).map(check=><article className="first-step" key={check.id}>
            <div className="first-step-body">
              <span className="first-step-id">{check.id.replaceAll('_',' ')} {check.critical?'· CORE':''}</span>
              <p>{check.label}</p>
              <a href={check.link} target="_blank" rel="noopener noreferrer">OPEN {check.link} ↗</a>
            </div>
            <div className="first-step-buttons" role="group" aria-label={'Result for '+check.label}>
              {STATES.map(state=><button type="button" key={state.key}
                aria-pressed={results[check.id]===state.key}
                className={'first-state '+state.key+(results[check.id]===state.key?' selected':'')}
                onClick={()=>setResult(check.id,state.key)}>{state.label}</button>)}
            </div>
          </article>)}
        </div>)}
      </section>
      <section className="first-export">
        <h2>04 / COPY A SELF-REPORTED QA RECORD</h2>
        <p>Export includes only a chosen device category, fixed test IDs, pass/fail/blocked/not-run states, counts and caveats. There are no names, files, songs, tracking positions, serial numbers or free-text fields.</p>
        <div className="first-actions">
          <button type="button" onClick={copy}>COPY MANUAL QA RECEIPT ↗</button>
          <button type="button" className="secondary" onClick={reset}>CLEAR EVERYTHING</button>
        </div>
        <p role="status">{notice}</p>
        {showReport&&<pre className="first-json" aria-label="Self-reported QA JSON">{JSON.stringify(report,null,2)}</pre>}
      </section>
      <footer className="quest-foot">
        <a href="https://github.com/MichaelWave369/Pulse369">VIEW SOURCE ↗</a>
        <span>MANUAL SELF-REPORT ≠ VERIFIED DEVICE TEST · LEDGER ABOVE EGO</span>
      </footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<FirstRun/>);
