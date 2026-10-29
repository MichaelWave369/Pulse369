import {activeCue} from './world-bridge.mjs';
/** Optional R2 visual-only eight-count cue scheduler.
 * Uses the existing track's authored BPM and offset, not live audio analysis.
 * Never moves gameplay notes or changes the actual workout chart.
 */
export function visualCueForSession(show,elapsed,bpm,offset=0,eightCount=false){
  if(!eightCount)return activeCue(show,Math.max(0,elapsed));
  if(typeof bpm!=='number'||!Number.isFinite(bpm)||bpm<30||bpm>300 ||
    typeof offset!=='number'||!Number.isFinite(offset)||Math.abs(offset)>120 ||
    typeof elapsed!=='number'||!Number.isFinite(elapsed))throw Error('Invalid session visual timing');
  const beats=Math.max(0,elapsed-offset)*bpm/60;
  const phrase=Math.floor(beats/8);
  return show.cues[phrase%show.cues.length];
}
