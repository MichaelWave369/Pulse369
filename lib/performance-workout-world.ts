/** World Forge R5: one or two bounded visual worlds; Quest crossfades never exceed
 * the reviewed object/draw estimate. Workouts, audio and controller tracking untouched.
 */
import * as THREE from 'three';
import {CustomWorkoutWorld} from './custom-workout-world';
import {normalizePerformance,samplePerformance,type WorldPerformance} from '../portal/world-performance.mjs';
import {sceneTransitionPolicy,performanceBudgetReport,type RenderTier} from '../portal/world-render-budget.mjs';
import type {WorldAudioFrame} from '../portal/world-audio-frame.mjs';
import {GOVERNOR_LEVELS} from '../portal/world-adaptive-governor.mjs';
import {createDirectorSheet} from '../portal/world-experience-director.mjs';

export class PerformanceWorkoutWorld {
 readonly root=new THREE.Group();
 private readonly show:WorldPerformance;
 private readonly visibleStages=new Map<number,CustomWorkoutWorld>();
 private quality:RenderTier='desktop';
 private lastTransitionReason='initial';
 private lastPhraseIndex:number|null=null;
 private adaptiveLevel:0|1|2=0;
 readonly title:string;
 constructor(source:WorldPerformance){
  this.show=normalizePerformance(source);
  this.title=this.show.title;
  this.root.name='World Forge R5 · visual-only performance';
 }
 /** GPU material and buffer instances are invalidated on desktop ↔ headset change.
  * This is independent of play/pause, chart state and the real workout clock.
  */
 setQuality(quality:RenderTier){
  if(quality!=='quest'&&quality!=='desktop')throw Error('Unsupported render tier');
  if(quality===this.quality)return;
  this.clearStages();this.quality=quality;
 }
 setAdaptiveLevel(level:0|1|2){
  if(!Number.isInteger(level)||level<0||level>2)throw Error('Invalid adaptive effect tier');
  this.adaptiveLevel=level;
 }
 getDirectorDuration(){return createDirectorSheet(this.show).durationSeconds;}
 getFrameTelemetry(){return {activeStages:this.visibleStages.size,phraseIndex:this.lastPhraseIndex,reason:this.lastTransitionReason,adaptiveLevel:this.adaptiveLevel};}
 getRenderStatus(){
  return {tier:this.quality,activeStages:this.visibleStages.size,reason:this.lastTransitionReason,
   estimate:performanceBudgetReport(this.show,this.quality)};
 }
 private clearStages(){
  for(const stage of this.visibleStages.values())stage.dispose();
  this.visibleStages.clear();
 }
 update(seconds:number,bpm:number,reducedMotion:boolean,audioFrame:WorldAudioFrame|undefined,
  visualGain:number,renderTime:number){
  const cue=samplePerformance(this.show,Math.max(0,seconds));
  this.lastPhraseIndex=cue.phraseIndex;
  const policy=sceneTransitionPolicy(this.show.worlds,cue.previousWorldIndex,cue.worldIndex,this.quality);
  const profile=GOVERNOR_LEVELS[this.adaptiveLevel];
  const transitioning=cue.blend<1&&cue.previousWorldIndex!==cue.worldIndex&&policy.crossfade&&profile.allowCrossfade;
  this.lastTransitionReason=cue.blend<1&&cue.previousWorldIndex!==cue.worldIndex?
    (policy.crossfade&&!profile.allowCrossfade?'adaptive-effects-cut':policy.reason):'single-stage';
  const required=new Set(transitioning?[cue.previousWorldIndex,cue.worldIndex]:[cue.worldIndex]);
  // Cut first: no transient third or second scene can be allocated during a budget fallback.
  for(const [index,stage] of this.visibleStages){
   if(!required.has(index)){stage.dispose();this.visibleStages.delete(index);}
  }
  for(const index of required){
   if(!this.visibleStages.has(index)){
    const stage=new CustomWorkoutWorld(this.show.worlds[index],this.quality);
    this.visibleStages.set(index,stage);
    this.root.add(stage.root);
   }
  }
  const current=this.visibleStages.get(cue.worldIndex);
  current?.setMix(transitioning?cue.blend:1);
  current?.update(seconds,bpm,reducedMotion,false,0,audioFrame,visualGain*profile.gain,renderTime,
   {palette:cue.palette,glow:cue.glow*profile.glow,motion:cue.motion*profile.motion});
  if(transitioning){
   const previous=this.visibleStages.get(cue.previousWorldIndex);
   previous?.setMix(1-cue.blend);
   previous?.update(seconds,bpm,reducedMotion,false,0,audioFrame,visualGain*profile.gain,renderTime,
    {palette:cue.previousPalette,glow:cue.previousGlow*profile.glow,motion:cue.previousMotion*profile.motion});
  }
 }
 dispose(){
  this.clearStages();
  this.root.removeFromParent();
 }
}
