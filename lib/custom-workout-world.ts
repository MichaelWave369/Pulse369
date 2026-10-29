/** Client-only bridge from R1 validated Domistika WorldPack to a real Pulse369 session.
 * Adds SCENERY ONLY: game scoring, notes, controllers, HUD, camera and audio
 * remain entirely owned by PulseGame. Nothing is serialized to server Config.
 */
import * as THREE from 'three';
import {createWorldVisual} from '../portal/world-bridge-three.mjs';
import {fitWorldBackdrop} from '../portal/world-stage-layout.mjs';
import type {WorldPack} from '../portal/world-bridge.mjs';

export class CustomWorkoutWorld {
  readonly root:THREE.Group;
  private readonly visual:ReturnType<typeof createWorldVisual>;
  readonly title:string;

  constructor(pack:WorldPack){
    this.visual=createWorldVisual(pack);
    this.root=this.visual.stage;
    this.title=pack.title;
    // The renderer's first child is the authored installation; its helper grid
    // must not become a collision surface or affect scenery fitting.
    const authored=this.root.children.find(child=>child.name==='Untrusted-free visual preview: Domistika world');
    if(!(authored instanceof THREE.Group)){
      this.visual.dispose();
      throw Error('World geometry root is missing');
    }
    const bounds=new THREE.Box3().setFromObject(authored);
    if(bounds.isEmpty()){
      this.visual.dispose();
      throw Error('World must include at least one visible object');
    }
    try {
      const layout=fitWorldBackdrop({min:bounds.min.toArray(),max:bounds.max.toArray()});
      // The root has an initial R1 preview translation. Fit that transform,
      // rather than replacing it, so raw imported meshes stay in the same pose.
      authored.position.multiplyScalar(layout.scale);
      authored.position.add(new THREE.Vector3(...(layout.offset as [number,number,number])));
      authored.scale.setScalar(layout.scale);
      this.root.children.filter(child=>child instanceof THREE.GridHelper).forEach(child=>{child.visible=false;});
      this.root.updateMatrixWorld(true);
    }catch(error){this.visual.dispose();throw error;}
  }
  update(elapsedSeconds:number,bpm:number,reducedMotion:boolean){
    this.visual.update(Math.max(0,elapsedSeconds),bpm,reducedMotion);
  }
  dispose(){this.visual.dispose();}
}
