/** Conservative triangle/draw-call estimates for the actual R5 Three.js geometry.
 * Not FPS promises. No GPU introspection, no external data, no gameplay impact.
 */
export const RENDER_BUDGETS=Object.freeze({
 quest:Object.freeze({maxTransitionTriangles:32000,maxTransitionDraws:64,maxSingleTriangles:30000}),
 desktop:Object.freeze({maxTransitionTriangles:160000,maxTransitionDraws:120,maxSingleTriangles:80000})
});
export const GEOMETRY_TRIANGLES=Object.freeze({
 desktop:Object.freeze({box:12,sphere:480,cylinder:80,torus:504,tube:1024}),
 quest:Object.freeze({box:12,sphere:240,cylinder:48,torus:192,tube:480})
});
export function estimateWorldCost(world,tier='quest'){
 if(!Object.hasOwn(RENDER_BUDGETS,tier))throw Error('Unknown render tier');
 if(!world||!world.workshop||!Array.isArray(world.workshop.objects))throw Error('Invalid world geometry');
 const costs=GEOMETRY_TRIANGLES[tier];
 let triangles=0;
 for(const item of world.workshop.objects){
   if(item.kind==='mesh'){
     if(!Array.isArray(item.positions)||item.positions.length%9!==0)
       throw Error('Invalid authored mesh triangles');
     triangles+=item.positions.length/9;
   }else{
     if(!Object.hasOwn(costs,item.kind))throw Error('Unsupported geometry for render estimate');
     triangles+=costs[item.kind];
   }
 }
 return {triangles,draws:world.workshop.objects.length};
}
/** Choose a cut before any second scene is allocated when the crossfade budget is exceeded.
 * A complex single world still renders in bounded Quest geometry, with an honest warning.
 */
export function sceneTransitionPolicy(worlds,from,to,tier='quest'){
 if(!Array.isArray(worlds)||!Number.isInteger(from)||!Number.isInteger(to)||
    from<0||to<0||from>=worlds.length||to>=worlds.length)throw Error('Invalid scene transition');
 const budget=RENDER_BUDGETS[tier];
 if(!budget)throw Error('Unknown render tier');
 const outgoing=estimateWorldCost(worlds[from],tier),incoming=estimateWorldCost(worlds[to],tier);
 const triangles=outgoing.triangles+(from===to?0:incoming.triangles);
 const draws=outgoing.draws+(from===to?0:incoming.draws);
 const overloaded=incoming.triangles>budget.maxSingleTriangles||outgoing.triangles>budget.maxSingleTriangles;
 const crossfade=from!==to&&!overloaded&&
   triangles<=budget.maxTransitionTriangles&&draws<=budget.maxTransitionDraws;
 return {crossfade,triangles,draws,tier,
   reason:from===to?'same-scene':overloaded?'single-scene-heavy':crossfade?'within-budget':'crossfade-over-budget'};
}
export function performanceBudgetReport(show,tier='quest'){
 if(!show||!Array.isArray(show.worlds)||!Array.isArray(show.cues)||!show.cues.length)
   throw Error('Invalid authored performance budget input');
 const worlds=show.worlds.map(world=>estimateWorldCost(world,tier));
 const transitions=show.cues.map((cue,i)=>{
   const preceding=show.cues[(i+show.cues.length-1)%show.cues.length];
   return sceneTransitionPolicy(show.worlds,preceding.worldIndex,cue.worldIndex,tier);
 });
 return {tier,worlds,transitions,cuts:transitions.filter(x=>x.reason==='crossfade-over-budget'||x.reason==='single-scene-heavy').length,
   heavyWorlds:worlds.filter(x=>x.triangles>RENDER_BUDGETS[tier].maxSingleTriangles).length};
}
