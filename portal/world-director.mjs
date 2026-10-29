/** Immutable world visual direction on the existing validated WorldPack schema.
 * No audio bytes, song identities, device sensors or runtime closures in exports.
 */
import {validateWorldPack} from './world-bridge.mjs';
export const WORLD_BANDS=Object.freeze(['full','bass','mid','high','beat']);
export function assignObjectBand(world,id,band){
  if(typeof id!=='string'||!WORLD_BANDS.includes(band))throw Error('Invalid world director selection');
  const pack=validateWorldPack(world);
  if(!pack.workshop.objects.some(o=>o.id===id))throw Error('Object not found in authored scene');
  const next={...pack,workshop:{...pack.workshop,objects:pack.workshop.objects.map(o=>
    o.id!==id?o:{...o,motion:o.motion?{...o.motion,band}:{mode:'none',speed:1,amplitude:0,phase:0,band}})}};
  return validateWorldPack(next);
}
