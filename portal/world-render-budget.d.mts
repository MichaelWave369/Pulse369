import type {WorldPack} from './world-bridge.mjs';
import type {WorldPerformance} from './world-performance.mjs';
export type RenderTier='quest'|'desktop';
export interface WorldCost {triangles:number;draws:number}
export interface TransitionPolicy extends WorldCost{
  crossfade:boolean;tier:RenderTier;
  reason:'same-scene'|'single-scene-heavy'|'within-budget'|'crossfade-over-budget';
}
export const RENDER_BUDGETS:Record<RenderTier,Readonly<{maxTransitionTriangles:number;maxTransitionDraws:number;maxSingleTriangles:number}>>;
export function estimateWorldCost(world:WorldPack,tier?:RenderTier):WorldCost;
export function sceneTransitionPolicy(worlds:WorldPack[],from:number,to:number,tier?:RenderTier):TransitionPolicy;
export function performanceBudgetReport(show:WorldPerformance,tier?:RenderTier):{
 tier:RenderTier;worlds:WorldCost[];transitions:TransitionPolicy[];cuts:number;heavyWorlds:number;
};
