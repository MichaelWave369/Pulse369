'use client';
import {useState,type ChangeEvent} from 'react';
import type {AcceptanceReceipt} from '../portal/world-acceptance.mjs';
import {MAX_RECEIPT_BYTES,readAcceptanceReceipt,compareAcceptanceReceipts,writeAcceptanceComparison}
 from '../portal/world-acceptance-compare.mjs';

type Side='baseline'|'candidate';
export default function WorldAcceptanceCompare(){
 const [baseline,setBaseline]=useState<AcceptanceReceipt|null>(null);
 const [candidate,setCandidate]=useState<AcceptanceReceipt|null>(null);
 const [matched,setMatched]=useState(false);
 const [message,setMessage]=useState('Choose two R7 receipt JSON files. They are parsed in this browser and never uploaded.');
 const [busy,setBusy]=useState(false);
 async function load(side:Side,event:ChangeEvent<HTMLInputElement>){
  const file=event.currentTarget.files?.[0];event.currentTarget.value='';
  if(!file||busy)return;
  setBusy(true);
  try{
   if(!file.name.toLowerCase().endsWith('.json')||file.size>MAX_RECEIPT_BYTES)
    throw Error('Choose a R7 receipt JSON file smaller than 24 KB.');
   const data=readAcceptanceReceipt(await file.text());
   if(side==='baseline')setBaseline(data);else setCandidate(data);
   setMatched(false);
   setMessage((side==='baseline'?'Baseline':'Candidate')+' loaded from a locally verified R7-format receipt. Nothing was uploaded.');
  }catch(e){setMessage('Receipt rejected: '+(e instanceof Error?e.message:'Invalid JSON'));}
  finally{setBusy(false);}
 }
 let report:ReturnType<typeof compareAcceptanceReceipts>|null=null;
 if(baseline&&candidate){
  try{report=compareAcceptanceReceipts(baseline,candidate,matched);}
  catch(e){/* Invalid paired data must not become evidence. */}
 }
 function download(){
  if(!report||busy)return;
  const json=writeAcceptanceComparison(report);
  const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
  try{
   const a=document.createElement('a');a.href=url;
   a.download='pulse369-quest-acceptance-comparison-v1.json';a.click();
   setMessage('Comparison exported locally with explicit self-attested comparison limits. No upload occurred.');
  }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
 }
 return <section aria-label="Quest Evidence Comparison" style={{display:'grid',gap:10,borderTop:'1px solid var(--border)',marginTop:14,paddingTop:14}}>
  <strong>Quest Evidence Comparator · R8</strong>
  <p className="music-rule">Compare two previously downloaded R7 browser-callback reports. Importing requires no account, network request, headset connection or new data collection. These are self-attested browser measurements, not certified headset FPS.</p>
  <label htmlFor="wf-r8-baseline">Baseline · before optimization</label>
  <input id="wf-r8-baseline" type="file" accept=".json,application/json" disabled={busy} onChange={e=>void load('baseline',e)}/>
  <p className="music-rule">{baseline?'Baseline: '+baseline.measurements.callbackFrames+' callbacks across '+baseline.measurements.elapsedSeconds+' seconds':'No baseline loaded'}</p>
  <label htmlFor="wf-r8-candidate">Candidate · after optimization</label>
  <input id="wf-r8-candidate" type="file" accept=".json,application/json" disabled={busy} onChange={e=>void load('candidate',e)}/>
  <p className="music-rule">{candidate?'Candidate: '+candidate.measurements.callbackFrames+' callbacks across '+candidate.measurements.elapsedSeconds+' seconds':'No candidate loaded'}</p>
  <label style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:12}}>
   <input type="checkbox" checked={matched} onChange={e=>setMatched(e.target.checked)} disabled={!baseline||!candidate||busy}/>
   <span>I personally used comparable conditions: the same headset, browser, authored show, soundtrack, visual settings and similar capture duration. This is my declaration, not independent verification.</span>
  </label>
  <p className="music-rule" role="status">{message}</p>
  {!!report&&<>
    <strong style={{fontSize:13}}>{report.interpretation==='NOT_COMPARABLE'?'Not yet comparable':
      report.interpretation==='POSSIBLE_REGRESSION_REVIEW'?'Possible callback regression: review needed':
      'No large callback regression detected by this heuristic'}</strong>
    <div style={{overflowX:'auto'}}>
     <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
      <thead><tr><th scope="col" style={{textAlign:'left',padding:6}}>Browser metric</th>
       <th scope="col" style={{textAlign:'right',padding:6}}>Before</th>
       <th scope="col" style={{textAlign:'right',padding:6}}>After</th>
       <th scope="col" style={{textAlign:'right',padding:6}}>Change</th></tr></thead>
      <tbody>{report.fields.map(field=><tr key={field.key}>
       <th scope="row" style={{textAlign:'left',padding:6,fontWeight:'normal'}}>{field.label}</th>
       <td style={{textAlign:'right',padding:6}}>{field.baseline??'—'}</td>
       <td style={{textAlign:'right',padding:6}}>{field.candidate??'—'}</td>
       <td style={{textAlign:'right',padding:6}}>{field.delta===null?'—':(field.delta>0?'+':'')+String(field.delta)+' '+field.unit}</td>
      </tr>)}</tbody>
     </table>
    </div>
    {!!report.flags.length&&<div role="status" style={{display:'grid',gap:4}}>
     <strong style={{fontSize:12}}>Potential regressions</strong>
     {report.flags.map(flag=><p className="music-rule" key={flag}>{flag}</p>)}
    </div>}
    {!!report.warnings.length&&<div style={{display:'grid',gap:4}}>
     <strong style={{fontSize:12}}>Comparison limitations</strong>
     {report.warnings.map(warning=><p className="music-rule" key={warning}>{warning}</p>)}
    </div>}
    <p className="music-rule">Captured self-attested checklist items: {report.summaries.baseline.selfAttestedItems}/6 before, {report.summaries.candidate.selfAttestedItems}/6 after. These are claims by the person who made each file, not independently validated results.</p>
    <button type="button" className="btn small" onClick={download} disabled={busy}>Download local comparison JSON</button>
  </>}
 </section>;
}
