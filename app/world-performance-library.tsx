'use client';
import {useCallback,useEffect,useState} from 'react';
import type {WorldPerformance} from '../portal/world-performance.mjs';
import {createBundle,readBundle,writeBundle,LICENSES,MAX_BUNDLE_BYTES,type BundleLicense}
 from '../portal/world-library-bundle.mjs';
import {saveBundleToLibrary,listLibrary,openLibraryBundle,deleteLibraryBundle,
 type LibraryRecord,MAX_LIBRARY_SHOWS} from '../lib/world-performance-library';

type Props={current:WorldPerformance|null;disabled:boolean;onLoad:(show:WorldPerformance)=>void};
export default function WorldPerformanceLibrary({current,disabled,onLoad}:Props){
 const [items,setItems]=useState<LibraryRecord[]>([]);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('Nothing is uploaded. Save to keep a private copy in this browser.');
 const [creator,setCreator]=useState(''),[description,setDescription]=useState('');
 const [license,setLicense]=useState<BundleLicense>('personal'),[tags,setTags]=useState('');
 const refresh=useCallback(async()=>{setItems(await listLibrary());},[]);
 useEffect(()=>{void refresh().catch(e=>setNotice(e instanceof Error?e.message:'Browser storage unavailable. Download a bundle instead.'));},[refresh]);
 const options=()=>{
  const list=tags.split(',').map(v=>v.trim()).filter(Boolean);
  return {creator,description,license,tags:list};
 };
 const run=async(work:()=>Promise<void>)=>{
  if(busy||disabled)return;
  setBusy(true);
  try{await work();}
  catch(e){setNotice(e instanceof Error?e.message:'Could not access your local show library.');}
  finally{setBusy(false);}
 };
 function download(name:string,content:string){
  const url=URL.createObjectURL(new Blob([content],{type:'application/json'}));
  try{
   const a=document.createElement('a');a.href=url;a.download=name;
   a.click();
  }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
 }
 const save=()=>void run(async()=>{
  if(!current)throw Error('First open or create a World Performance');
  const bundle=await createBundle(current,options());
  await saveBundleToLibrary(bundle);
  await refresh();
  setNotice('Saved '+bundle.preview.title+' to this browser only. It is NOT backed up or published.');
 });
 const exportCurrent=()=>void run(async()=>{
  if(!current)throw Error('First open or create a World Performance');
  const bundle=await createBundle(current,options());
  download('pulse369-world-library-bundle-v1.json',writeBundle(bundle));
  setNotice('Bundle downloaded. You can send this JSON file yourself; nothing was uploaded.');
 });
 const importFile=(event:React.ChangeEvent<HTMLInputElement>)=>{
  const file=event.currentTarget.files?.[0];event.currentTarget.value='';
  if(!file||busy||disabled)return;
  void run(async()=>{
   if(!file.name.toLowerCase().endsWith('.json')||file.size>MAX_BUNDLE_BYTES)
    throw Error('Choose a World Library JSON bundle smaller than 7.3 MB');
   const bundle=await readBundle(await file.text());
   await saveBundleToLibrary(bundle);
   await refresh();
   onLoad(bundle.performance);
   setNotice('Imported and verified '+bundle.preview.title+' into this browser. External creator/license labels are self-declared, not authenticated.');
  });
 };
 const open=(id:string)=>void run(async()=>{
  const bundle=await openLibraryBundle(id);
  onLoad(bundle.performance);
  setNotice('Opened '+bundle.preview.title+' from this browser. Not synchronized to a server.');
 });
 const remove=(id:string)=>void run(async()=>{
  if(!window.confirm('Delete this browser-stored show? Export a copy first if you want to keep it.'))return;
  await deleteLibraryBundle(id);
  await refresh();setNotice('Deleted the browser copy. Exported files remain untouched.');
 });
 return <section aria-label="World Performance Library" style={{display:'grid',gap:10,borderTop:'1px solid var(--border)',paddingTop:14,marginTop:14}}>
  <strong>World Performance Library · R6</strong>
  <p className="music-rule">Private, local-first shelf for up to {MAX_LIBRARY_SHOWS} shows. Browser IndexedDB persists across page reloads on this device, but may be cleared by your browser. Export bundles for real backups or manual community sharing. No account or server upload is used.</p>
  {!!current&&<div style={{display:'grid',gap:8}}>
    <strong style={{fontSize:12}}>Current show: {current.title}</strong>
    <label htmlFor="wf-creator">Creator alias (optional)</label>
    <input id="wf-creator" value={creator} onChange={e=>setCreator(e.target.value)} maxLength={64} placeholder="Optional public alias" disabled={busy||disabled}/>
    <label htmlFor="wf-desc">Show description (optional)</label>
    <textarea id="wf-desc" value={description} onChange={e=>setDescription(e.target.value)} maxLength={240} rows={2} placeholder="A few words about the worlds" disabled={busy||disabled}/>
    <label htmlFor="wf-license">Sharing permission</label>
    <select id="wf-license" value={license} onChange={e=>setLicense(e.target.value as BundleLicense)} disabled={busy||disabled}>
     {LICENSES.map(l=><option value={l} key={l}>{l==='personal'?'Personal only · no sharing permission granted':l}</option>)}
    </select>
    <label htmlFor="wf-tags">Tags (up to five, comma-separated)</label>
    <input id="wf-tags" value={tags} onChange={e=>setTags(e.target.value)} maxLength={124} placeholder="rave, aurora, sculpture" disabled={busy||disabled}/>
    <div className="buttons" style={{flexWrap:'wrap'}}>
     <button type="button" className="btn small" disabled={busy||disabled} onClick={save}>Save privately to this browser</button>
     <button type="button" className="btn small ghost" disabled={busy||disabled} onClick={exportCurrent}>Download shareable bundle</button>
    </div>
    <p className="music-rule">Creator and license are self-declared. A checksum helps detect accidental changes; it is NOT a creator signature, copyright clearance, or identity verification.</p>
  </div>}
  <label htmlFor="wf-library-import">Import a downloaded community bundle into your private library</label>
  <input id="wf-library-import" type="file" accept=".json,application/json" disabled={disabled||busy} onChange={importFile}/>
  <p className="music-rule" role="status">{notice}</p>
  {items.length===0?<p className="music-rule">No locally saved shows yet. Your current composer show is only in browser memory until you choose Save.</p>:
  <div style={{display:'grid',gap:8}}>
   <strong style={{fontSize:12}}>Saved on this device · {items.length}/{MAX_LIBRARY_SHOWS}</strong>
   {items.map(item=><div key={item.id} style={{border:'1px solid var(--border)',borderRadius:9,padding:10,display:'grid',gap:6}}>
    <strong style={{fontSize:13}}>{item.preview.title}</strong>
    <span className="music-rule">{item.preview.phrases} phrases · {item.preview.scenes.length} worlds · {item.preview.bpm} BPM · {item.preview.questMaxTriangles.toLocaleString()} estimated Quest triangles</span>
    <span className="music-rule">Worlds: {item.preview.scenes.map(w=>w.title).join(' · ')}</span>
    <span className="music-rule">{item.metadata.creator?'By '+item.metadata.creator+' · ':''}{item.metadata.license}{item.metadata.tags.length?' · '+item.metadata.tags.join(', '):''}</span>
    <div className="buttons" style={{flexWrap:'wrap'}}>
     <button type="button" className="btn small" disabled={disabled||busy} onClick={()=>open(item.id)}>Open in composer</button>
     <button type="button" className="btn small ghost" disabled={disabled||busy} onClick={()=>remove(item.id)}>Delete local copy</button>
    </div>
   </div>)}
  </div>}
 </section>;
}
