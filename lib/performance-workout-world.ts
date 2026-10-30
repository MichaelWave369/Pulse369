/** Visual-only R4 performance stage: at most two active Domistika worlds.
 * Full scene disposal on phrase change, never changes target/HUD/camera/audio.
 */
import * as THREE from 'three';
import {CustomWorkoutWorld} from './custom-workout-world';
import {normalizePerformance,samplePerformance,type WorldPerformance} from '../portal/world-performance.mjs';
import type {WorldAudioFrame} from '../portal/world-audio-frame.mjs';

export class PerformanceWorkoutWorld {
 readonly root=new THREE.Group();
 private readonly show:WorldPerformance;
 private readonly visibleStages=new Map<number,CustomWorkoutWorld>();
 readonly title:string;
 constructor(source:WorldPerformance){
  this.show=normalizePerformance(source);
  this.title=this.show.title;
  this.root.name='World Forge R4 · visual-only performance';
 }
 update(seconds:number,bpm:number,reducedMotion:boolean,audioFrame:WorldAudioFrame|undefined,
  visualGain:number,renderTime:number){
  const cue=samplePerformance(this.show,Math.max(0,seconds));
  const transitioning=cue.blend<1&&cue.previousWorldIndex!==cue.worldIndex;
  const required=new Set(transitioning?[cue.previousWorldIndex,cue.worldIndex]:[cue.worldIndex]);
  // Upper limit: two GPU resident authored scenes, even if the show contains three.
  for(const [index,stage] of this.visibleStages){
   if(!required.has(index)){stage.dispose();this.visibleStages.delete(index);}
  }
  for(const index of required){
   if(!this.visibleStages.has(index)){
    const stage=new CustomWorkoutWorld(this.show.worlds[index]);
    this.visibleStages.set(index,stage);
    this.root.add(stage.root);
   }
  }
  const current=this.visibleStages.get(cue.worldIndex);
  current?.setMix(transitioning?cue.blend:1);
  current?.update(seconds,bpm,reducedMotion,false,0,audioFrame,visualGain,renderTime,
   {palette:cue.palette,glow:cue.glow,motion:cue.motion});
  if(transitioning){
   const previous=this.visibleStages.get(cue.previousWorldIndex);
   previous?.setMix(1-cue.blend);
   previous?.update(seconds,bpm,reducedMotion,false,0,audioFrame,visualGain,renderTime,
    {palette:cue.previousPalette,glow:cue.previousGlow,motion:cue.previousMotion});
  }
 }
 dispose(){
  for(const stage of this.visibleStages.values())stage.dispose();
  this.visibleStages.clear();
  this.root.removeFromParent();
 }
}
