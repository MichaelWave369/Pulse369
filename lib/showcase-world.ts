/** R11: one-room-at-a-time art gallery built from R1 validated authored WorldPacks.
 * No workout state, network, audio, hit targets, scoring, locomotion physics or uploads.
 */
import * as THREE from 'three';
import {CustomWorkoutWorld} from './custom-workout-world';
import {normalizePerformance,type WorldPerformance} from '../portal/world-performance.mjs';
import {createShowcaseNavigator,showcaseManifest,type ShowcasePosition} from '../portal/world-showcase.mjs';

type Tier='desktop'|'quest';
const SILENCE={energy:0,bass:0,mid:0,high:0,beat:0};
export class ShowcaseWorld {
 readonly root=new THREE.Group();
 private readonly show:WorldPerformance;
 private readonly nav:ReturnType<typeof createShowcaseNavigator>;
 private stage:CustomWorkoutWorld;
 private tier:Tier='desktop';
 private motion=false;
 private readonly artResources:{geometry:THREE.BufferGeometry;material:THREE.Material}[]=[];
 private readonly plaques:THREE.CanvasTexture[]=[];
 private readonly roomLabel:THREE.Mesh;
 readonly manifest:ReturnType<typeof showcaseManifest>;
 constructor(source:WorldPerformance){
  this.show=normalizePerformance(source);
  this.manifest=showcaseManifest(this.show);
  this.nav=createShowcaseNavigator(this.manifest.roomCount);
  this.root.name='World Forge R11 · curated local art gallery';
  // The gallery is deliberately simple and non-interactive. Sculptures are scenery.
  const add=(mesh:THREE.Mesh)=>{this.root.add(mesh);this.artResources.push({
   geometry:mesh.geometry,material:mesh.material as THREE.Material
  });return mesh;};
  const wall=(w:number,h:number,d:number,color:number,x:number,y:number,z:number)=>{
   const m=add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({color,metalness:.12,roughness:.8})));
   m.position.set(x,y,z);return m;
  };
  wall(12,.13,22,0x172637,0,-.16,-4);
  wall(12,5,.16,0x101d30,0,2.35,-14.8);
  wall(.16,5,22,0x142437,-5.9,2.35,-4);
  wall(.16,5,22,0x142437,5.9,2.35,-4);
  for(const x of [-4.8,4.8]){
   const rail=wall(.06,.04,19,0x5c9dae,x,.55,-4);
   (rail.material as THREE.MeshStandardMaterial).color.setHex(0x527c96);
  }
  const plinth=wall(3,.32,1.3,0x334355,0,.12,-8.2);
  (plinth.material as THREE.MeshStandardMaterial).color.setHex(0x24394c);
  const ambient=new THREE.HemisphereLight(0xc8e6ff,0x1d253f,1.1);
  const key=new THREE.DirectionalLight(0xffffff,1.5);
  key.position.set(1.5,5,0);
  this.root.add(ambient,key);
  this.roomLabel=this.makeLabel('');
  this.roomLabel.position.set(0,2.65,-11.9);
  this.root.add(this.roomLabel);
  this.stage=new CustomWorkoutWorld(this.show.worlds[0],this.tier);
  this.root.add(this.stage.root);
  this.updateLabel();
 }
 private makeLabel(title:string){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw Error('2D canvas labels are required for gallery plaques');
  ctx.fillStyle='#081624';ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle='#91bcd4';ctx.lineWidth=6;ctx.strokeRect(6,6,1012,244);
  ctx.textAlign='center';ctx.fillStyle='#e9efff';ctx.font='bold 46px sans-serif';
  ctx.fillText(title.slice(0,44),512,110,980);
  ctx.fillStyle='#a4bbcf';ctx.font='28px sans-serif';
  ctx.fillText('DOMISTIKAXR · LOCAL ARTWORK · NO WORKOUT',512,177,960);
  const texture=new THREE.CanvasTexture(canvas);
  this.plaques.push(texture);
  return new THREE.Mesh(new THREE.PlaneGeometry(4.6,1.15),
   new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));
 }
 private updateLabel(){
  const room=this.manifest.rooms[this.nav.status().index];
  // Repaint the existing canvas texture instead of allocating a label every frame.
  const tex=(this.roomLabel.material as THREE.MeshBasicMaterial).map!;
  const canvas=tex.image as HTMLCanvasElement;
  const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#081624';ctx.fillRect(0,0,1024,256);
  ctx.strokeStyle='#91bcd4';ctx.lineWidth=6;ctx.strokeRect(6,6,1012,244);
  ctx.textAlign='center';ctx.fillStyle='#e9efff';ctx.font='bold 46px sans-serif';
  ctx.fillText(room.title.slice(0,44),512,108,980);
  ctx.fillStyle='#a4bbcf';ctx.font='28px sans-serif';
  ctx.fillText('EXHIBIT '+(room.index+1)+' OF '+this.manifest.roomCount+' · ART ONLY',512,178,940);
  tex.needsUpdate=true;
 }
 getStatus(){
  const location=this.nav.status();
  return {enabled:true,title:this.show.title,roomIndex:location.index,
   roomCount:this.manifest.roomCount,roomTitle:this.manifest.rooms[location.index].title,
   motion:this.motion,quality:this.tier,position:location,
   questHeavy:this.manifest.rooms[location.index].questHeavy,
   exhibitObjects:this.manifest.rooms[location.index].objects};
 }
 getPosition():ShowcasePosition{return this.nav.status();}
 setRoom(index:number){
  if(index===this.nav.status().index)return this.getStatus();
  if(!Number.isInteger(index)||index<0||index>=this.manifest.roomCount)
   throw Error('Invalid exhibit selection');
  const next=new CustomWorkoutWorld(this.show.worlds[index],this.tier);
  this.root.remove(this.stage.root);this.stage.dispose();
  this.stage=next;this.root.add(next.root);
  this.nav.select(index);
  this.root.position.set(0,0,0);this.updateLabel();
  return this.getStatus();
 }
 nextRoom(direction:1|-1){
  const size=this.manifest.roomCount;
  return this.setRoom((this.nav.status().index+direction+size)%size);
 }
 setQuality(quality:Tier){
  if(quality!=='quest'&&quality!=='desktop')throw Error('Invalid gallery render quality');
  if(quality===this.tier)return;
  const index=this.nav.status().index;
  const next=new CustomWorkoutWorld(this.show.worlds[index],quality);
  this.root.remove(this.stage.root);this.stage.dispose();
  this.stage=next;this.root.add(next.root);
  this.tier=quality;
 }
 setMotion(enabled:boolean){
  if(typeof enabled!=='boolean')throw Error('Invalid gallery motion setting');
  this.motion=enabled;
 }
 move(forward:number,strafe:number,dt:number,heading:number){
  return this.nav.move(forward,strafe,dt,heading);
 }
 turn(radians:number){return this.nav.turn(radians);}
 update(seconds:number,bpm:number,renderTime:number,reducedMotion:boolean,isXR:boolean){
  this.root.position.set(0,0,0);
  if(isXR){
   const at=this.nav.status();this.root.position.set(-at.x,0,-(at.z-2.2));
  }
  this.stage.update(seconds,bpm,reducedMotion||!this.motion,false,0,SILENCE,.45,renderTime);
 }
 dispose(){
  this.stage.dispose();
  for(const resource of this.artResources){
   resource.geometry.dispose();resource.material.dispose();
  }
  this.roomLabel.geometry.dispose();
  (this.roomLabel.material as THREE.Material).dispose();
  for(const tex of this.plaques)tex.dispose();
  this.root.removeFromParent();
 }
}
