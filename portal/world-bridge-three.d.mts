import type * as THREE from 'three';
import type {WorldPack} from './world-bridge.mjs';
export interface WorldVisual {
  stage:THREE.Group;
  camera:THREE.PerspectiveCamera;
  baseCameraPosition:THREE.Vector3;
  target:THREE.Vector3;
  update(seconds:number,bpm?:number,reducedMotion?:boolean,eightCount?:boolean,beatOffset?:number):WorldPack['show']['cues'][number]|undefined;
  dispose():void;
  count:number;
}
export function createWorldVisual(pack:WorldPack):WorldVisual;
