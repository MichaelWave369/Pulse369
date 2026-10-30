import type * as THREE from 'three';
import type {WorldPack} from './world-bridge.mjs';
import type {WorldAudioFrame} from './world-audio-frame.mjs';
export interface WorldVisual {
  stage:THREE.Group;
  camera:THREE.PerspectiveCamera;
  baseCameraPosition:THREE.Vector3;
  target:THREE.Vector3;
  update(seconds:number,bpm?:number,reducedMotion?:boolean,eightCount?:boolean,beatOffset?:number,audioFrame?:WorldAudioFrame|null,visualGain?:number,renderTime?:number,direction?:{palette:WorldPack['show']['cues'][number]['palette'];glow:number;motion:number}|null):WorldPack['show']['cues'][number]|undefined;
  dispose():void;
  count:number;
}
export function createWorldVisual(pack:WorldPack,options?:{quality?:'quest'|'desktop'}):WorldVisual;
