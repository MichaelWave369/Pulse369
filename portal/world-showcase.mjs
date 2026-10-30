/** World Forge R11: a bounded, non-workout gallery of validated authored worlds.
 * Pure model and navigation controls. Never loads external assets, audio or game data.
 */
import {normalizePerformance} from './world-performance.mjs';
import {estimateWorldCost,RENDER_BUDGETS} from './world-render-budget.mjs';
export const SHOWCASE_SCHEMA='pulse369.world-showcase.v1';
export const WALK_BOUNDS=Object.freeze({minX:-4.4,maxX:4.4,minZ:-7.5,maxZ:2.7});
const clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
export function showcaseManifest(raw){
 const show=normalizePerformance(raw);
 const rooms=show.worlds.map((world,index)=>{
  const quest=estimateWorldCost(world,'quest');
  return {index,title:world.title,objects:world.workshop.objects.length,
   questTriangles:quest.triangles,questDraws:quest.draws,
   questHeavy:quest.triangles>RENDER_BUDGETS.quest.maxSingleTriangles};
 });
 return {schema:SHOWCASE_SCHEMA,title:show.title,roomCount:rooms.length,rooms};
}
export function createShowcaseNavigator(count){
 if(!Number.isInteger(count)||count<1||count>3)throw Error('Gallery needs one to three authored rooms');
 let index=0,x=0,z=2.2,yaw=0;
 const status=()=>({index,x:Math.round(x*1000)/1000,z:Math.round(z*1000)/1000,yaw:Math.round(yaw*1000)/1000,roomCount:count});
 function select(next){
  if(!Number.isInteger(next)||next<0||next>=count)throw Error('Invalid gallery room');
  index=next;x=0;z=2.2;yaw=0;return status();
 }
 function turn(radians){
  if(typeof radians!=='number'||!Number.isFinite(radians)||Math.abs(radians)>Math.PI/2)
   throw Error('Invalid gallery turn');
  yaw+=radians;
  if(yaw>Math.PI)yaw-=2*Math.PI;
  if(yaw< -Math.PI)yaw+=2*Math.PI;
  return status();
 }
 /** Inputs are in normalized forward / strafe directions and heading radians.
  * Movement stays within the curated gallery's walking rectangle.
  */
 function move(forward,strafe,dt,heading=yaw){
  if(![forward,strafe,dt,heading].every(Number.isFinite)||
    Math.abs(forward)>1||Math.abs(strafe)>1||dt<0||dt>.06)
   throw Error('Invalid gallery locomotion');
  const speed=.85,magnitude=Math.max(1,Math.hypot(forward,strafe));
  const f=forward/magnitude,side=strafe/magnitude;
  x=clamp(x+(-Math.sin(heading)*f+Math.cos(heading)*side)*speed*dt,WALK_BOUNDS.minX,WALK_BOUNDS.maxX);
  z=clamp(z+(-Math.cos(heading)*f-Math.sin(heading)*side)*speed*dt,WALK_BOUNDS.minZ,WALK_BOUNDS.maxZ);
  return status();
 }
 return {status,select,turn,move};
}
