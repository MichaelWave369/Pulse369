import { DEMOS, type Track } from './pulse';

export function estimateBpm(buffer:AudioBuffer):number {
 const data=buffer.getChannelData(0),hop=Math.floor(buffer.sampleRate/100),length=Math.min(data.length,buffer.sampleRate*60);
 const energy:number[]=[];let last=0;
 for(let i=0;i<length;i+=hop){let sum=0;for(let j=i;j<Math.min(i+hop,length);j+=4)sum+=data[j]*data[j];const e=Math.sqrt(sum/(hop/4));energy.push(Math.max(0,e-last));last=e;}
 let best=128,bestScore=0;
 for(let bpm=75;bpm<=175;bpm++){const lag=Math.round(6000/bpm);let score=0;for(let i=lag;i<energy.length;i++)score+=energy[i]*energy[i-lag];if(score>bestScore){bestScore=score;best=bpm;}}
 return best;
}

export class PulseAudio {
 context:AudioContext|null=null;gain:GainNode|null=null;source:AudioBufferSourceNode|null=null;
 private cache=new Map<string,AudioBuffer>();private loads=new Map<string,Promise<AudioBuffer>>();volume=.55;
 unlock(){if(!this.context){this.context=new AudioContext();this.gain=this.context.createGain();this.gain.gain.value=this.volume;this.gain.connect(this.context.destination);}return this.context.resume();}
 async decode(file:File){await this.unlock();const buffer=await this.context!.decodeAudioData(await file.arrayBuffer());return {buffer,bpm:estimateBpm(buffer),duration:buffer.duration};}
 keep(id:string,b:AudioBuffer){this.cache.set(id,b);this.trim(id);}
 private trim(id:string){if(this.cache.size>3){for(const key of this.cache.keys()){if(key!==id){this.cache.delete(key);break;}}}}
 async prepare(track:Track):Promise<AudioBuffer>{
  if(this.cache.has(track.id))return this.cache.get(track.id)!;
  if(this.loads.has(track.id))return this.loads.get(track.id)!;
  const load=(async()=>{let buffer:AudioBuffer;
   if(DEMOS.some(t=>t.id===track.id))buffer=await this.demo(track);
   else {await this.unlock();const response=await fetch('/api/audio/'+track.id);if(!response.ok){const error=await response.json().catch(()=>({})) as {error?:string};throw new Error(error.error||'This track could not be loaded.');}buffer=await this.context!.decodeAudioData(await response.arrayBuffer());}
   this.keep(track.id,buffer);return buffer;
  })();this.loads.set(track.id,load);
  try{return await load;}finally{this.loads.delete(track.id);}
 }
 play(track:Track,elapsed:number){this.stop();const buffer=this.cache.get(track.id);if(!buffer||!this.context||!this.gain)throw new Error('Your music is still loading. Try starting again.');const source=this.context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.gain);source.start(0,Math.max(0,elapsed)%buffer.duration);this.source=source;}
 stop(){if(this.source){try{this.source.stop();}catch{}this.source.disconnect();this.source=null;}}
 setVolume(v:number){this.volume=v;if(this.gain&&this.context)this.gain.gain.setTargetAtTime(v,this.context.currentTime,.05);}
 dispose(){this.stop();void this.context?.close();}
 private async demo(track:Track){
  const rate=22050,beat=60/track.bpm,duration=track.id==='demo-still'?20:beat*64;
  const ctx=new OfflineAudioContext(2,Math.ceil(rate*duration),rate),master=ctx.createGain();master.gain.value=.55;master.connect(ctx.destination);
  const tone=(time:number,length:number,frequency:number,type:OscillatorType,volume:number,endFrequency?:number)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(frequency,time);if(endFrequency)o.frequency.exponentialRampToValueAtTime(endFrequency,time+length);g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(volume,time+.008);g.gain.exponentialRampToValueAtTime(.0001,time+length);o.connect(g);g.connect(master);o.start(time);o.stop(time+length+.01);};
  if(track.id==='demo-still'){
   const notes=[130.8128,164.8138,195.9977,261.6256];for(let i=0;i<20;i++)for(let n=0;n<notes.length;n++)tone(i,Math.min(4,duration-i-.02),notes[n]*(i%8>=4?1.12246:1),'sine',.06);
  }else{
   const noise=ctx.createBuffer(1,rate*.15,rate),d=noise.getChannelData(0);let seed=369;for(let i=0;i<d.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;d[i]=(seed/4294967296)*2-1;}
   const hat=(time:number,snare=false)=>{const s=ctx.createBufferSource(),g=ctx.createGain(),filter=ctx.createBiquadFilter();s.buffer=noise;filter.type='highpass';filter.frequency.value=snare?1000:6500;g.gain.setValueAtTime(snare?.11:.04,time);g.gain.exponentialRampToValueAtTime(.0001,time+(snare?.14:.04));s.connect(filter);filter.connect(g);g.connect(master);s.start(time);s.stop(time+.15);};
   const bass=[65.406,65.406,77.782,58.27],melody=[261.63,329.63,392,329.63,293.66,349.23,440,392];
   for(let i=0;i<64;i++){const t=i*beat;tone(t,.24,140,'sine',.65,43);if(i%4===1||i%4===3)hat(t,true);hat(t+beat*.5);tone(t+.02,beat*.75,bass[Math.floor(i/16)%4],'triangle',.17);tone(t+beat*.5,beat*.35,melody[i%8]*(track.id==='demo-orbit'?.75:1),'sine',.13);}
  }
  return ctx.startRendering();
 }
}
