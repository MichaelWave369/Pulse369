/** Typed contract for the validated R1 WorldBridge JS module, consumed by Pulse's app. */
export type MotionMode='none'|'spin'|'bob'|'orbit'|'pulse';
export type MotionBand='full'|'bass'|'mid'|'high'|'beat';
export interface WorldObject {
  id:string;name:string;kind:'box'|'sphere'|'cylinder'|'torus'|'tube'|'mesh';
  color:string;position:[number,number,number];rotation:[number,number,number];
  scale:[number,number,number];dimensions:[number,number,number];
  source:{app:'FramefieldStudio'|'OpenBlueprintStudio';ref:string}|null;
  mirroredX:boolean;
  motion:{mode:MotionMode;speed:number;amplitude:number;phase:number;band:MotionBand}|null;
  positions?:number[];
}
export interface WorldPack {
  schema:'pulse369.worldpack.v1';version:1;title:string;
  source:{app:'Domistika XR';schema:'domistika.xr.showpack.v1'|'domistika.xr.workshop.v1'};
  workshop:{schema:'domistika.xr.workshop.v1';objects:WorldObject[]};
  show:{title:string;cues:{title:string;duration:number;palette:'outrun'|'aurora'|'ember'|'ice';gain:number;energy:number}[]};
}
export const MAX_FILE_BYTES:number;
export const SAMPLE_WORLD:WorldPack;
export function readWorldFile(text:string):WorldPack;
export function writeWorldPack(pack:WorldPack):string;
export function activeCue(show:WorldPack['show'],elapsed:number):WorldPack['show']['cues'][number];
