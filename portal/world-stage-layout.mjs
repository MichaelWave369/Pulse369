/** Non-gameplay scenery fitting for imported Domistika stages.
 * The authored stage is purely decorative, with no collision/hit-target hooks.
 * In the canonical Pulse369 game targets travel from z=-8 toward z=-0.55.
 * We fit scenery BEHIND that travel lane, including a buffer for ±2m visual motion.
 */
export const STAGE_LIMITS=Object.freeze({width:24,height:12,depth:12,centerY:1.75,centerZ:-20});
const finiteVector=v=>Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='number'&&Number.isFinite(x));
export function fitWorldBackdrop(bounds){
  if(!bounds||!finiteVector(bounds.min)||!finiteVector(bounds.max))
    throw Error('Invalid scenery bounds');
  const size=bounds.max.map((x,i)=>x-bounds.min[i]);
  if(size.some(x=>x<0))throw Error('Inverted scenery bounds');
  const center=bounds.max.map((x,i)=>(x+bounds.min[i])/2);
  const scale=Math.min(1,STAGE_LIMITS.width/Math.max(size[0],.01),
    STAGE_LIMITS.height/Math.max(size[1],.01),STAGE_LIMITS.depth/Math.max(size[2],.01));
  const offset=[-center[0]*scale,STAGE_LIMITS.centerY-center[1]*scale,STAGE_LIMITS.centerZ-center[2]*scale];
  const maxZ=bounds.max[2]*scale+offset[2];
  if(maxZ > -13.99)throw Error('Scenery intrudes into the game target corridor');
  return {scale,offset,maxZ,width:size[0]*scale,height:size[1]*scale,depth:size[2]*scale};
}
