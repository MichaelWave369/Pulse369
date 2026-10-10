import * as THREE from 'three';
import { isActive, isStriking, mindfulHands, sessionPhase, type Config } from './pulse';
import { COACHES } from './training';

type DemoNote={time:number;lane:number;x?:number;y?:number;gesture?:'strike'|'guard'};
class Avatar {
 readonly root=new THREE.Group();private head:THREE.Mesh;private chest:THREE.Mesh;private hands:THREE.Mesh[]=[];private arms:THREE.Mesh[][]=[];private legs:THREE.Mesh[]=[];private tag:THREE.Mesh;private visor:THREE.Mesh;private heart:THREE.Mesh;private chair=new THREE.Group();
 constructor(name:string,color:string){
  const suit=new THREE.MeshStandardMaterial({color:0x292637,metalness:.45,roughness:.4}),accent=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.55,metalness:.45,roughness:.32});
  this.chest=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.35,5,12),suit);this.chest.position.y=1.2;this.chest.scale.z=.7;this.root.add(this.chest);
  this.head=new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),suit);this.head.position.set(0,1.65,0);this.root.add(this.head);
  this.visor=new THREE.Mesh(new THREE.BoxGeometry(.23,.055,.06),accent);this.visor.position.set(0,1.66,.115);this.root.add(this.visor);
  this.heart=new THREE.Mesh(new THREE.TorusGeometry(.064,.012,6,24),accent);this.heart.position.set(0,1.27,.126);this.root.add(this.heart);
  for(const side of [-1,1]){const hand=new THREE.Mesh(new THREE.SphereGeometry(.072,12,8),accent);this.hands.push(hand);this.root.add(hand);const arm=[0,1].map(()=>new THREE.Mesh(new THREE.CylinderGeometry(.043,.048,1,8),suit));this.arms.push(arm);this.root.add(...arm);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.065,.54,4,8),suit);leg.position.set(side*.11,.54,0);this.legs.push(leg);this.root.add(leg);const foot=new THREE.Mesh(new THREE.BoxGeometry(.15,.09,.3),accent);foot.position.set(side*.11,.17,.06);this.root.add(foot);}
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#131620df';ctx.fillRect(0,0,512,96);ctx.font='bold 35px Arial';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(name,256,62);this.tag=new THREE.Mesh(new THREE.PlaneGeometry(.9,.17),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true}));this.tag.position.set(0,2.05,.05);this.root.add(this.tag);
  const seat=new THREE.Mesh(new THREE.BoxGeometry(.46,.08,.5),suit);seat.position.set(0,.72,.01);const back=new THREE.Mesh(new THREE.BoxGeometry(.46,.42,.07),suit);back.position.set(0,.97,-.22);this.chair.add(seat,back);for(const x of [-.19,.19])for(const z of [-.18,.2]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.66,6),accent);leg.position.set(x,.35,z);this.chair.add(leg);}this.root.add(this.chair);
 }
 private limb(mesh:THREE.Mesh,a:THREE.Vector3,b:THREE.Vector3){const direction=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=direction.length();mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());}
 update(c:Config,t:number,note:DemoNote|undefined,phaseShift:number){
  const phase=sessionPhase(c,t),move=isActive(c.mode)&&phase.targets,beat=t*c.track.bpm/60*Math.PI*2+phaseShift;
  const sway=c.calm?0:Math.sin(beat*.5)*.035;this.chest.rotation.z=sway;this.head.rotation.z=sway*.5;
  for(let i=0;i<2;i++){const side=i===0?-1:1;let x=side*.32,y=1.05,z=.22;
   if(move){const until=note?note.time-t:10,matching=note&&(note.lane<2?0:1)===i;const extension=matching?Math.max(0,1-Math.abs(until-.12)/.65):0;
    const scale=c.seated?.8:1,restX=side*.28*scale,restY=1.1*scale,targetX=note?.x??side*(isStriking(c.mode)?.46:.66)*scale,targetY=note?.y??((note?.lane??0)%2===0?1.67:1.13)*scale;
    x=restX+(targetX-restX)*extension;y=restY+(targetY-restY)*extension;z=.2+extension*(isStriking(c.mode)?.42:.13);if(!extension)y+=Math.sin(beat+i*Math.PI)*.04;
   }else if(!isActive(c.mode)){[x,y,z]=mindfulHands(c,t)[i];}
   const target=new THREE.Vector3(x,y,z);this.hands[i].position.lerp(target,.16);const shoulder=new THREE.Vector3(side*.18,c.seated?1.12:1.4,0),hand=this.hands[i].position,elbow=shoulder.clone().lerp(hand,.5).add(new THREE.Vector3(side*.08,-.09,-.04));this.limb(this.arms[i][0],shoulder,elbow);this.limb(this.arms[i][1],elbow,hand);
  }
  this.chair.visible=c.seated;this.chest.position.y=c.seated?.94:1.2;this.head.position.y=c.seated?1.34:1.65;this.visor.position.y=c.seated?1.35:1.66;this.heart.position.y=c.seated?1.01:1.27;this.tag.position.y=c.seated?1.74:2.05;this.legs.forEach(leg=>{leg.rotation.x=c.seated?-.7:0;leg.position.y=c.seated?.44:.54;leg.position.z=c.seated?.15:0;});
 }
 dispose(){const geos=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();this.root.traverse(o=>{if(o instanceof THREE.Mesh){geos.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>mats.add(m));}});geos.forEach(g=>g.dispose());mats.forEach(m=>{(m as THREE.MeshBasicMaterial).map?.dispose();m.dispose();});this.root.removeFromParent();}
}
export class WorkoutCompanions {
 private avatars:Avatar[]=[];private key='';
 constructor(private scene:THREE.Scene){}
 configure(c:Config){const key=`${c.coach??'nova'}:${c.companions??2}`;if(key===this.key)return;this.key=key;this.avatars.forEach(a=>a.dispose());this.avatars=[];const coach=COACHES.find(x=>x.id===(c.coach??'nova'));
  const people=[...(coach?[{name:`${coach.name} · COACH`,color:coach.color}]:[]),...Array.from({length:Math.max(0,Math.min(2,c.companions??2))},(_,i)=>({name:`${i===0?'Echo':'Sol'} · VIRTUAL`,color:i===0?'#ff9aaf':'#d1fc74'}))];
  for(let i=0;i<people.length;i++){const person=people[i],avatar=new Avatar(person.name,person.color);avatar.root.position.set(i===0?-2.1:i===1?2.9:-3.5,0,i===0?-3.1:-5.1);this.avatars.push(avatar);this.scene.add(avatar.root);}
 }
 update(c:Config,t:number,next:DemoNote|undefined,moving:boolean){this.configure(c);const demoTime=Math.max(0,moving?t:0);this.avatars.forEach((a,i)=>a.update(c,demoTime,moving&&next&&next.time<demoTime+1?next:undefined,i*1.5));}
 dispose(){this.avatars.forEach(a=>a.dispose());this.avatars=[];}
}
