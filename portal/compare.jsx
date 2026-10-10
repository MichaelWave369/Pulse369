import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { parsePulseReceipt, assessPair, createInspectionReceipt, MAX_RECEIPT_CHARS } from './qa-compare.mjs';
import './styles.css';
import './quest-lab.css';
import './compare.css';

const fmtNumber = (value, suffix='') => value === null || value === undefined ? 'Not measured' : String(value) + suffix;
const links = [
  {name: 'Desktop Rehearsal', href: 'rehearsal.html'},
  {name: 'Quest Music Lab', href: 'music.html'},
  {name: 'Quest Rhythm Lab', href: 'quest.html'},
  {name: 'Quest First Run', href: 'first-run.html'},
];

function ReceiptCard({title, data}) {
  if (!data) return <div className="compare-placeholder">No validated receipt in this slot.</div>;
  return <div className="compare-readout">
    <div className="compare-sourceline"><strong>{data.label}</strong><span>USER-PASTED · NOT ATTESTED</span></div>
    <div className="compare-kpis">
      <div><span>Accepted contacts</span><strong>{data.rhythm ? data.rhythm.accepted + ' / ' + data.rhythm.offered : 'Not recorded'}</strong></div>
      <div><span>Authored BPM</span><strong>{fmtNumber(data.settings.bpm)}</strong></div>
      <div><span>Mean absolute beat error</span><strong>{fmtNumber(data.rhythm?.meanAbsMs, ' ms')}</strong></div>
      <div><span>Signed median error</span><strong>{fmtNumber(data.rhythm?.medianSignedMs, ' ms')}</strong></div>
    </div>
    <p>Input: <b>{data.inputMode === 'keyboard-or-tap' ? 'Keyboard / screen button' : 'Tracked controller'}</b>. Beat source: <b>{data.settings.audioMode === 'local-audio' ? 'Local audio clock' : data.settings.audioMode === 'visual-only' ? 'Visual-only clock' : 'Tracking only'}</b>.</p>
    <p>Authored offset: <b>{fmtNumber(data.settings.offsetMs, ' ms')}</b>. Duration: <b>{data.durationSeconds}s</b>.</p>
    {data.rhythm && <p>Reported accepted contacts: <b>{data.rhythm.early} early · {data.rhythm.late} late · {data.rhythm.exactlyOn} on authored beat</b>. No individual event traces are available.</p>}
    <small>{title} was checked for structural consistency only. Imported figures can be fabricated or edited; this page cannot authenticate them.</small>
  </div>;
}

function CompareApp() {
  const [rawA,setRawA] = useState('');
  const [rawB,setRawB] = useState('');
  const [reportA,setReportA] = useState(null);
  const [reportB,setReportB] = useState(null);
  const [errorA,setErrorA] = useState('');
  const [errorB,setErrorB] = useState('');
  const [inspected,setInspected] = useState(false);
  const [notification,setNotification] = useState('');
  const assessment=assessPair(reportA,reportB);

  const clearResults=()=>{
    setReportA(null);setReportB(null);setErrorA('');setErrorB('');
    setInspected(false);setNotification('');
  };
  const inspect=()=>{
    const a=parsePulseReceipt(rawA);
    const b=parsePulseReceipt(rawB);
    setReportA(a.ok?a.value:null);
    setReportB(b.ok?b.value:null);
    setErrorA(a.ok?'':a.reason);
    setErrorB(b.ok?'':b.reason);
    setInspected(true);
    setNotification('Local structural inspection complete. No data was transmitted.');
  };
  const reset=()=>{
    setRawA('');setRawB('');clearResults();
  };
  const copy=async()=>{
    const inspection=createInspectionReceipt(reportA,reportB);
    try{
      await navigator.clipboard.writeText(JSON.stringify(inspection,null,2));
      setNotification('Sanitized inspection copied. Your pasted JSON was not included.');
    } catch {
      setNotification('Clipboard access denied. Enable browser clipboard permission to copy the sanitized inspection.');
    }
  };

  return <div className="shell quest-shell">
    <header className="quest-header">
      <a className="logo" href="./"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <a href="./">← PUBLIC PORTAL</a>
    </header>
    <main className="quest-main">
      <p className="eyebrow">PULSE 369 / PROVENANCE FIRST / NO BACKEND</p>
      <h1>QA <em>COMPARE.</em></h1>
      <p className="quest-sub">Paste two anonymous Pulse test receipts and inspect them side by side. This is a browser-only evidence desk, not a competition between keyboards and headsets. Unknown data is discarded; valid structure is not proof a test really happened.</p>
      <div className="compare-links">
        {links.map(x=><a href={x.href} key={x.href}>{x.name} ↗</a>)}
      </div>
      <div className="compare-input-grid">
        <section className="quest-card">
          <h2>01 / RECEIPT A</h2>
          <label htmlFor="receipt-a" className="compare-label">PASTE JSON · UP TO {MAX_RECEIPT_CHARS.toLocaleString()} CHARACTERS</label>
          <textarea id="receipt-a" spellCheck={false} value={rawA} onChange={e=>{setRawA(e.target.value);clearResults();}}
            rows={8} placeholder={'{\n  "schema": "pulse369.desktop-rehearsal.v1",\n  ...\n}'} />
          <p className="compare-count">{rawA.length.toLocaleString()} / {MAX_RECEIPT_CHARS.toLocaleString()} characters</p>
          {inspected && <p role="status" className={errorA?'compare-error':'compare-good'}>{errorA||'Structure accepted; origin unverified.'}</p>}
          {inspected && <ReceiptCard title="Receipt A" data={reportA}/>}
        </section>
        <section className="quest-card">
          <h2>02 / RECEIPT B</h2>
          <label htmlFor="receipt-b" className="compare-label">PASTE JSON · UP TO {MAX_RECEIPT_CHARS.toLocaleString()} CHARACTERS</label>
          <textarea id="receipt-b" spellCheck={false} value={rawB} onChange={e=>{setRawB(e.target.value);clearResults();}}
            rows={8} placeholder={'{\n  "schema": "pulse369.local-music-lab.v1",\n  ...\n}'} />
          <p className="compare-count">{rawB.length.toLocaleString()} / {MAX_RECEIPT_CHARS.toLocaleString()} characters</p>
          {inspected && <p role="status" className={errorB?'compare-error':'compare-good'}>{errorB||'Structure accepted; origin unverified.'}</p>}
          {inspected && <ReceiptCard title="Receipt B" data={reportB}/>}
        </section>
      </div>
      <div className="compare-actions">
        <button type="button" onClick={inspect} disabled={!rawA.trim()&&!rawB.trim()}>INSPECT LOCALLY ↗</button>
        <button type="button" className="secondary" onClick={reset}>CLEAR BOTH</button>
        <button type="button" className="secondary" disabled={!inspected||(!reportA&&!reportB)}
          onClick={copy}>COPY SANITIZED INSPECTION</button>
      </div>
      <p className="compare-notice" role="status">{notification}</p>
      <section className="compare-conclusion">
        <p className="eyebrow">03 / EVIDENCE GATE</p>
        <h2>{inspected ? assessment.level.replaceAll('_',' ') : 'NOT INSPECTED'}</h2>
        <p>{inspected
          ? assessment.message
          : 'Paste the JSON receipts from Desktop Rehearsal, Quest Rhythm Lab, or Quest Music Lab, then inspect locally.'}</p>
        <p className="compare-warning">Structurally valid does not mean independently verified. Even matching authored BPM and offsets do not establish that the same audio, hardware, environment, player, or calibration was used. No winner or latency advantage is inferred.</p>
      </section>
      <section className="compare-explain">
        <h2>HOW THIS DESK WORKS</h2>
        <p>It recognizes four Pulse diagnostic schemas and allows only a handful of expected metrics through. No uploaded music, raw controller poses, filenames, unique device IDs or individual keystroke timestamps are included in the sanitized comparison.</p>
        <p>Everything stays in this tab. Pasted JSON is cleared with the button or on page reload. This page has no telemetry, account connection, history database, remote verification or persistence. If you accidentally paste sensitive information, use <strong>Clear both</strong> to remove it from the form.</p>
      </section>
      <footer className="quest-foot"><a href="https://github.com/MichaelWave369/Pulse369">SOURCE ↗</a>
        <span>LEDGER ABOVE EGO · STRUCTURE ≠ DEVICE PROOF</span></footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<CompareApp />);
