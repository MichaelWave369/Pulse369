/** Browser-local bounded FFT envelopes for Pulse369 world visuals.
 * Mirrors DomistikaXR's band semantics, without importing its app runtime.
 * No microphone, recording, persistence, uploads, BPM inference or scoring.
 */
export const ZERO_WORLD_AUDIO=Object.freeze({energy:0,bass:0,mid:0,high:0,beat:0});
const clamp=v=>Math.max(0,Math.min(1,v));
export function spectrumBands(bins,sampleRate,fftSize,sensitivity=1){
  if(!(bins instanceof Uint8Array)||!Number.isInteger(fftSize)||fftSize<256||fftSize>4096||
     bins.length!==fftSize/2||!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000||
     !Number.isFinite(sensitivity)||sensitivity<0||sensitivity>2)
    throw Error('Invalid spectrum inputs');
  const ranges=[[35,260],[260,2000],[2000,8000]];
  const sums=[0,0,0],counts=[0,0,0];
  let combined=0,combinedCount=0;
  for(let i=1;i<bins.length;i++){
    const f=i*sampleRate/fftSize;if(f>8000)break;
    const power=(bins[i]/255)**2;
    for(let k=0;k<ranges.length;k++)if(f>=ranges[k][0]&&f<ranges[k][1]){sums[k]+=power;counts[k]++;}
    if(f<=5000){combined+=power;combinedCount++;}
  }
  const [b,m,h]=sums.map((sum,i)=>Math.sqrt(sum/Math.max(counts[i],1)));
  const avg=Math.sqrt(combined/Math.max(combinedCount,1));
  return {energy:clamp(Math.max(1.2*b,.75*avg)*sensitivity),
    bass:clamp(b*1.2*sensitivity),mid:clamp(m*1.25*sensitivity),
    high:clamp(h*1.3*sensitivity),beat:0};
}
export function createTransientGate(){
  let previous=0,baseline=0,lastBeat=-Infinity,lastTime=null;
  function reset(){previous=0;baseline=0;lastBeat=-Infinity;lastTime=null;}
  function next(bass,seconds){
    if(!Number.isFinite(bass)||bass<0||bass>1||!Number.isFinite(seconds)||seconds<0)throw Error('Invalid onset sample');
    if(lastTime!==null && seconds<lastTime)reset();
    const rise=bass-previous,threshold=Math.max(.11,baseline*.42);
    const fired=bass>.17&&rise>threshold&&(seconds-lastBeat)>=.18;
    if(fired)lastBeat=seconds;
    previous=bass;baseline=baseline*.95+bass*.05;lastTime=seconds;
    const age=seconds-lastBeat;
    return fired?1:age>=0&&age<.24?clamp(1-age/.24):0;
  }
  return {next,reset};
}
/** Bounded values only. Invalid or unavailable live frames produce total silence. */
export function normalizedWorldAudio(frame){
  if(frame===null||frame===undefined)return {...ZERO_WORLD_AUDIO};
  if(typeof frame!=='object'||Array.isArray(frame))throw Error('Invalid visual audio frame');
  const output={};
  for(const key of ['energy','bass','mid','high','beat']){
    const v=frame[key];
    if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1)throw Error('Invalid visual audio channel');
    output[key]=v;
  }
  return output;
}
