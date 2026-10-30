import type {WorldPack} from './world-bridge.mjs';
export type WorldPerformanceCue={
 worldIndex:number;palette:'outrun'|'aurora'|'ember'|'ice';
 glow:number;motion:number;transitionCounts:0|2|4|8;
};
export interface WorldPerformance {
 schema:'pulse369.world-performance.v1';version:1;title:string;
 chart:{schema:'pulse369.choreography.v1';title:string;bpm:number;offsetMs:number;
 phrases:{name:string;repeat:number;steps:{style:string;moveIndex:number;mirror:boolean}[]}[]};
 worlds:WorldPack[];cues:WorldPerformanceCue[];
}
export const PERFORMANCE_SCHEMA:string;
export const MAX_PERFORMANCE_BYTES:number;
export const MAX_PERFORMANCE_WORLDS:number;
export const PALETTES:readonly string[];
export const TRANSITIONS:readonly number[];
export function importDanceFlow(source:unknown):WorldPerformance['chart'];
export function createPerformance(chartSource:unknown,worlds:WorldPack[],titleText?:string):WorldPerformance;
export function normalizePerformance(raw:WorldPerformance):WorldPerformance;
export function readPerformance(json:string):WorldPerformance;
export function writePerformance(raw:WorldPerformance):string;
export function editPerformanceCue(raw:WorldPerformance,phraseIndex:number,patch:Partial<WorldPerformanceCue>):WorldPerformance;
export function samplePerformance(raw:WorldPerformance,seconds:number):{
 phraseIndex:number;phraseName:string;count:number;worldIndex:number;
 previousWorldIndex:number;blend:number;palette:WorldPerformanceCue['palette'];
 glow:number;motion:number;previousPalette:WorldPerformanceCue['palette'];
 previousGlow:number;previousMotion:number;totalCounts:number;
};
