'use client';
import { useEffect, useRef, useState } from 'react';
import { Heart, Bluetooth, BluetoothOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { HeartMonitor, type HeartState } from '@/lib/heart-rate';

export default function HeartMonitorPanel({onSample,save,onSave}:{onSample:(bpm:number|null)=>void;save:boolean;onSave:(v:boolean)=>void}){
 const [state,setState]=useState<HeartState>({phase:'off',bpm:null,name:'',message:''});const monitor=useRef<HeartMonitor|null>(null),callback=useRef(onSample);
 useEffect(()=>{callback.current=onSample;},[onSample]);
 useEffect(()=>{const m=new HeartMonitor(setState,bpm=>callback.current(bpm));monitor.current=m;setState(m.state);return()=>{m.dispose();monitor.current=null;};},[]);
 const connected=['connected','stale'].includes(state.phase);
 return <section className="heart-panel" aria-label="Optional heart-rate monitor"><div className="heart-reading"><Heart size={20}/><strong aria-live="polite">{state.bpm??'—'}</strong><span>BPM</span></div><div className="heart-info"><strong>{state.name||'Optional heart-rate monitor'}</strong><p>{state.phase==='unsupported'?'Bluetooth is unavailable in this browser. All sessions work without it.':state.message||'Connect a monitor that supports the standard Bluetooth Heart Rate Service.'}</p></div><div className="heart-actions"><button className="btn small" disabled={state.phase==='unsupported'} onClick={()=>connected||state.phase==='connecting'?monitor.current?.disconnect():void monitor.current?.connect()}>{connected||state.phase==='connecting'?<BluetoothOff/>:<Bluetooth/>}{connected?'Disconnect':state.phase==='connecting'?'Cancel':'Connect monitor'}</button><div className="setting-row"><label htmlFor="save-heart">Save private session summary</label><Switch id="save-heart" checked={save} onCheckedChange={onSave}/></div></div></section>;
}
