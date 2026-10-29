import * as THREE from 'three';
import {visualCueForSession} from './world-visual-clock.mjs';

const PALETTE = {
  outrun:{full:'#ff4ead',bass:'#ff5980',mid:'#a66eff',high:'#35faff',beat:'#ffbd75'},
  aurora:{full:'#78ffe2',bass:'#37e0b5',mid:'#90d8ff',high:'#ab95ff',beat:'#fff1b2'},
  ember:{full:'#ffac67',bass:'#ff683e',mid:'#f3b857',high:'#f9da9b',beat:'#ffc19c'},
  ice:{full:'#9feaff',bass:'#69b4ff',mid:'#aae7ff',high:'#d9fcff',beat:'#e2eaff'}
};
function geometry(o) {
  const [x,y,z]=o.dimensions;
  switch(o.kind) {
    case 'box':return new THREE.BoxGeometry(x,y,z);
    case 'sphere':return new THREE.SphereGeometry(x*.5,20,12);
    case 'cylinder':return new THREE.CylinderGeometry(x*.5,x*.5,y,20);
    case 'torus':return new THREE.TorusGeometry(x*.55,Math.min(x*.15,y*.3),9,28);
    case 'tube':return new THREE.TorusKnotGeometry(x*.36,Math.min(x*.10,y*.25),64,8,2,3);
    case 'mesh': {
      const mesh=new THREE.BufferGeometry();
      mesh.setAttribute('position',new THREE.Float32BufferAttribute(o.positions,3));
      mesh.computeVertexNormals();
      return mesh;
    }
    default:throw Error('Unsupported geometry');
  }
}
function makeMesh(o) {
  const g=geometry(o);
  if(o.mirroredX) {g.scale(-1,1,1);g.computeVertexNormals();}
  const m=new THREE.MeshStandardMaterial({color:o.color,roughness:.55,metalness:.18,
    side:THREE.DoubleSide,emissive:'#000000'});
  const mesh=new THREE.Mesh(g,m);
  mesh.name=o.name;
  mesh.position.fromArray(o.position);
  mesh.rotation.fromArray(o.rotation);
  mesh.scale.fromArray(o.scale);
  return mesh;
}
/** Geometry is visual-only. The entire installation is shifted beyond the user's reachable area.
 * Rest-pose geometry remains authoritative; preview animation cannot create hit targets.
 */
export function createWorldVisual(pack) {
  const root=new THREE.Group();
  root.name='Untrusted-free visual preview: Domistika world';
  const items=pack.workshop.objects.map(o=>({data:o,mesh:makeMesh(o),envelope:0}));
  items.forEach(({mesh})=>root.add(mesh));
  const bounds=new THREE.Box3().setFromObject(root);
  if(!bounds.isEmpty()) {
    const center=bounds.getCenter(new THREE.Vector3());
    root.position.set(-center.x,0,-5-bounds.max.z);
  } else root.position.z=-6;
  root.updateMatrixWorld(true);
  const finalBox=new THREE.Box3().setFromObject(root);
  const target=finalBox.isEmpty()?new THREE.Vector3(0,1.4,-6):finalBox.getCenter(new THREE.Vector3());
  const size=finalBox.isEmpty()?new THREE.Vector3(4,4,4):finalBox.getSize(new THREE.Vector3());
  const camera=new THREE.PerspectiveCamera(65,1,.05,160);
  const viewDist=Math.max(4,size.length()*1.2);
  camera.position.set(0,Math.max(1.5,target.y+viewDist*.3),target.z+viewDist);
  camera.lookAt(target);
  const baseCameraPosition=camera.position.clone();

  const stage=new THREE.Group();
  stage.add(root);
  const grid=new THREE.GridHelper(50,50,0x395d79,0x23374b);
  grid.position.set(0,-.08,target.z);
  stage.add(grid);
  const ambient=new THREE.HemisphereLight(0xbbf7ff,0x142038,2.2);
  stage.add(ambient);
  const key=new THREE.DirectionalLight(0xc7e6ff,2);
  key.position.set(5,12,4);stage.add(key);
  let disposed=false;
  function update(seconds,bpm=120,reducedMotion=false,eightCount=false,beatOffset=0) {
    if(disposed)return;
    const cue=visualCueForSession(pack.show,seconds,bpm,beatOffset,eightCount);
    const beatPhase=Math.max(0,seconds-beatOffset)*bpm/60*2*Math.PI;
    const signal=reducedMotion?0:Math.pow(.5+.5*Math.cos(beatPhase),3);
    const values={full:.18+signal*.6,bass:.12+signal*.7,mid:.22+signal*.38,
      high:.12+signal*.34,beat:signal};
    for(const item of items) {
      const {data:o,mesh}=item;
      const motion=o.motion;
      const band=motion?.band??'full';
      const energy=reducedMotion?0:values[band]*cue.energy;
      mesh.position.fromArray(o.position);
      mesh.rotation.fromArray(o.rotation);
      mesh.scale.fromArray(o.scale);
      if(motion && motion.mode!=='none' && !reducedMotion) {
        const a=(seconds*motion.speed*2*Math.PI)%(2*Math.PI)+motion.phase;
        const sine=Math.sin(a)-Math.sin(motion.phase);
        const cosine=Math.cos(a)-Math.cos(motion.phase);
        if(motion.mode==='spin')mesh.rotation.y+=seconds*motion.speed*2*Math.PI+energy*.45*sine;
        if(motion.mode==='bob')mesh.position.y+=(motion.amplitude+energy*.35)*sine;
        if(motion.mode==='orbit') {
          mesh.position.x+=(motion.amplitude+energy*.4)*cosine;
          mesh.position.z+=(motion.amplitude+energy*.4)*sine;
        }
        if(motion.mode==='pulse')mesh.scale.multiplyScalar(Math.max(.3,1+(motion.amplitude*.35+energy*.35)*sine));
      }
      const targetGlow=reducedMotion?0:Math.min(.85,energy*cue.gain*.6);
      // Smooth bright transitions; no sharp beat-triggered strobe.
      item.envelope+=(targetGlow-item.envelope)*.13;
      mesh.material.emissive.set(PALETTE[cue.palette][band]);
      mesh.material.emissiveIntensity=item.envelope;
    }
    return cue;
  }
  function dispose(){
    if(disposed)return;
    disposed=true;
    items.forEach(({mesh})=>{mesh.geometry.dispose();mesh.material.dispose();});
    grid.geometry.dispose();
    if(Array.isArray(grid.material))grid.material.forEach(m=>m.dispose());
    else grid.material.dispose();
    stage.removeFromParent();
  }
  return {stage,camera,baseCameraPosition,target,update,dispose,count:items.length};
}
