import type {WorldPerformance} from './world-performance.mjs';
export type DirectorPhrase={index:number;name:string;worldIndex:number;worldTitle:string;
 palette:string;glow:number;motion:number;transitionCounts:number;startCount:number;
 endCount:number;startSeconds:number;endSeconds:number};
export type DirectorSheet={title:string;bpm:number;offsetSeconds:number;
 counts:number;durationSeconds:number;phrases:DirectorPhrase[]};
export type DirectorStatus={enabled:boolean;playing:boolean;seconds:number;durationSeconds:number};
export function createDirectorSheet(show:WorldPerformance):DirectorSheet;
export function directorAt(show:WorldPerformance,seconds:number):{
 seconds:number;phraseIndex:number;phrase:string;worldTitle:string;palette:string;
 glow:number;motion:number;transitionBlend:number;
};
export function experiencePreflight(show:WorldPerformance,trackBpm:number):{
 sheet:DirectorSheet;questMaxTriangles:number;questBudgetCuts:number;
 warnings:string[];matchedTrackBpm:boolean;
};
export function createDirectorClock():{
 status:()=>DirectorStatus;setEnabled:(value:boolean,durationSeconds?:number)=>DirectorStatus;
 seek:(seconds:number)=>DirectorStatus;play:(value:boolean)=>DirectorStatus;
 tick:(timeMs:number,eligible:boolean)=>DirectorStatus;
};
