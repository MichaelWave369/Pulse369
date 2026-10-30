/** Client-only bridge from R1 validated Domistika WorldPack to a real Pulse369 session.
 * Adds SCENERY ONLY: game scoring, notes, controllers, HUD, camera and audio
 * remain entirely owned by PulseGame. Nothing is serialized to server Config.
 */
import * as THREE from 'three';
import {createWorldVisual} from '../portal/world-bridge-three.mjs';
import {fitWorldBackdrop} from '../portal/world-stage-layout.mjs';
import type {WorldPack} from '../portal/world-bridge.mjs';
import type {WorldAudioFrame} from '../portal/world-audio-frame.mjs';

export class CustomWorkoutWorld {
  readonly root:THREE.Group;
  private readonly visual:ReturnType<typeof createWorldVisual>;
  readonly title:string;
  private readonly materials:THREE.MeshStandardMaterial[]=[];
  private readonly lights:{light:THREE.Light;intensity:number}[]=[];

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
      this.root.traverse(node=>{
       if(node instanceof THREE.Mesh&&node.material instanceof THREE.MeshStandardMaterial)
        this.materials.push(node.material);
       if(node instanceof THREE.Light)this.lights.push({light:node,intensity:node.intensity});
      });
      this.root.updateMatrixWorld(true);
    }catch(error){this.visual.dispose();throw error;}
  }
  setMix(alpha:number){
    const a=Math.max(0,Math.min(1,Number.isFinite(alpha)?alpha:0));
    this.root.visible=a>.001;
    for(const mat of this.materials){mat.transparent=a<.999;mat.opacity=a;mat.depthWrite=a>=.999;}
    for(const {light,intensity} of this.lights)light.intensity=intensity*a;
  }
  update(elapsedSeconds:number,bpm:number,reducedMotion:boolean,eightCount=false,beatOffset=0,
    audioFrame?:WorldAudioFrame|null,visualGain=1,renderTime?:number,
    direction?:{palette:WorldPack['show']['cues'][number]['palette'];glow:number;motion:number}|null){
    this.visual.update(Math.max(0,elapsedSeconds),bpm,reducedMotion,eightCount,beatOffset,audioFrame,visualGain,renderTime,direction);
  }
  dispose(){this.visual.dispose();}
}
