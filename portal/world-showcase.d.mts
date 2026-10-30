import type {WorldPerformance} from './world-performance.mjs';
export const SHOWCASE_SCHEMA:'pulse369.world-showcase.v1';
export const WALK_BOUNDS:Readonly<{minX:number;maxX:number;minZ:number;maxZ:number}>;
export interface ShowcaseManifest {schema:'pulse369.world-showcase.v1';title:string;roomCount:number;
 rooms:{index:number;title:string;objects:number;questTriangles:number;questDraws:number;questHeavy:boolean}[]}
export interface ShowcasePosition{index:number;x:number;z:number;yaw:number;roomCount:number}
export function showcaseManifest(raw:WorldPerformance):ShowcaseManifest;
export function createShowcaseNavigator(count:number):{
 status:()=>ShowcasePosition;select:(index:number)=>ShowcasePosition;
 turn:(radians:number)=>ShowcasePosition;
 move:(forward:number,strafe:number,dt:number,heading?:number)=>ShowcasePosition;
};
