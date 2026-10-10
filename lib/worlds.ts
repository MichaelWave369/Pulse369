import * as THREE from 'three';
import type { Config, WorldId } from './pulse';

const palettes={temple:[0x080915,0x57204f,0xb18bff],orbit:[0x030a19,0x123756,0x75d7ed],aurora:[0x06181f,0x205650,0xa7f3bc],garden:[0x061a1b,0x254653,0x7ee8c6]};
export class WorkoutWorld {
 readonly root=new THREE.Group();private sky:THREE.ShaderMaterial;private accents:THREE.MeshBasicMaterial[]=[];private rings:THREE.Mesh[]=[];
 constructor(readonly id:WorldId='temple'){
  const [low,high,accent]=palettes[id];
  this.sky=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{uTime:{value:0},uLow:{value:new THREE.Color(low)},uHigh:{value:new THREE.Color(high)},uAurora:{value:id==='aurora'?1:id==='garden'?.3:0}},vertexShader:'varying vec3 vDirection; void main(){vDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`precision highp float; varying vec3 vDirection; uniform float uTime; uniform vec3 uLow; uniform vec3 uHigh; uniform float uAurora;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} void main(){vec3 d=normalize(vDirection);float h=smoothstep(-.15,.9,d.y);vec3 col=mix(uLow,uHigh,h*.65);vec2 uv=vec2(atan(d.z,d.x),asin(d.y));vec2 cell=floor(uv*190.);float star=step(.996,hash(cell))*(1.-smoothstep(.01,.045,length(fract(uv*190.)-.5)))*smoothstep(.02,.4,d.y);col+=vec3(.65,.77,1.)*star;
 float band=exp(-pow((d.y-.37-sin(uv.x*3.+uTime*.06)*.08-sin(uv.x*7.-uTime*.04)*.025)*10.,2.));col+=uAurora*band*(.14+.06*sin(uv.x*12.+uTime*.1))*vec3(.3,1.,.72);gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(65,32,20),this.sky);sky.position.y=7;this.root.add(sky);
  this.root.add(new THREE.HemisphereLight(id==='aurora'?0xb2e6dc:0xaaa8ff,0x151525,2));
  const key=new THREE.PointLight(accent,35,25,1.7);key.position.set(-4,5,-4);const fill=new THREE.PointLight(0xd1fc74,25,20,1.7);fill.position.set(4,3,-2);this.root.add(key,fill);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(48,64),new THREE.MeshStandardMaterial({color:id==='aurora'?0x0b2a32:0x101226,metalness:.55,roughness:.32}));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.08,-18);this.root.add(floor);
  const grid=new THREE.GridHelper(64,64,id==='aurora'?0x18474b:0x564178,0x152335);grid.position.z=-18;grid.position.y=-.065;this.root.add(grid);
  for(let i=0;i<22;i++)for(const side of [-1,1]){const m=this.glow(id==='aurora'?0x91f5b6:accent,.7);const tile=new THREE.Mesh(new THREE.BoxGeometry(.16,.025,.5),m);tile.position.set(side*1.8,-.03,-2-i*1.5);this.root.add(tile);}
  if(id==='temple')this.temple(accent);
  if(id==='orbit')this.orbit(accent);
  if(id==='aurora')this.aurora();
  if(id==='garden')this.garden();
 }
 private glow(color:number,opacity=1){const material=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity});this.accents.push(material);return material;}
 private temple(accent:number){
  const pillarGeo=new THREE.CylinderGeometry(.23,.42,6,6),pillarMat=new THREE.MeshStandardMaterial({color:0x222036,metalness:.7,roughness:.35,flatShading:true});
  const pillars=new THREE.InstancedMesh(pillarGeo,pillarMat,24),dummy=new THREE.Object3D();let index=0;
  for(let i=0;i<12;i++)for(const side of [-1,1]){dummy.position.set(side*(4.8+i*.16),3,-5-i*3.2);dummy.updateMatrix();pillars.setMatrixAt(index++,dummy.matrix);const cap=new THREE.Mesh(new THREE.OctahedronGeometry(.34),this.glow(i%2?0xd1fc74:accent));cap.position.copy(dummy.position);cap.position.y=6.2;this.root.add(cap);}
  this.root.add(pillars);
  const ringGeo=new THREE.TorusGeometry(3.7,.03,8,72);for(let i=0;i<10;i++){const ring=new THREE.Mesh(ringGeo,this.glow(i%3===0?0xd1fc74:accent,.65));ring.position.set(0,2.4,-7-i*3.7);ring.rotation.z=i*.14;this.rings.push(ring);this.root.add(ring);}
  const emblem=new THREE.Mesh(new THREE.TorusKnotGeometry(1.1,.065,80,8,3,2),new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.7,metalness:.7,roughness:.25}));emblem.position.set(0,4.8,-17);this.root.add(emblem);
 }
 private orbit(accent:number){
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(6,6.3,.3,48),new THREE.MeshStandardMaterial({color:0x121c31,metalness:.8,roughness:.26}));platform.position.y=-.2;this.root.add(platform);
  for(const radius of [5.9,6.3,12,18]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.025,8,80),this.glow(accent,.6));ring.rotation.x=Math.PI/2;ring.position.y=-.01;this.rings.push(ring);this.root.add(ring);}
  const planet=new THREE.Mesh(new THREE.SphereGeometry(8,40,24),new THREE.MeshStandardMaterial({color:0x655284,emissive:0x19294b,roughness:.85,flatShading:true}));planet.position.set(-15,14,-33);this.root.add(planet);
  for(const radius of [10,10.4,11]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.1,8,80),this.glow(0xa996f4,.45));ring.position.copy(planet.position);ring.rotation.set(1.2,.2,.25);this.root.add(ring);}
  const moon=new THREE.Mesh(new THREE.IcosahedronGeometry(2.2,2),new THREE.MeshStandardMaterial({color:0x91c8d4,emissive:0x193840,flatShading:true}));moon.position.set(15,8,-22);this.root.add(moon);
  const positions=new Float32Array(480*3);let seed=369;for(let i=0;i<positions.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;positions[i]=(seed/4294967296-.5)*85;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));const stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0xccecff,size:.055,sizeAttenuation:true}));stars.position.set(0,12,-20);this.root.add(stars);
 }
 private aurora(){
  const mountainGeo=new THREE.ConeGeometry(4,12,5),mountainMat=new THREE.MeshStandardMaterial({color:0x163843,roughness:1,flatShading:true});const peaks=new THREE.InstancedMesh(mountainGeo,mountainMat,18),dummy=new THREE.Object3D();
  for(let i=0;i<18;i++){dummy.position.set((i-8.5)*5,2,-24-(i%3)*5);dummy.scale.set(1+(i%3)*.3,.7+(i%4)*.2,1);dummy.rotation.y=i*.75;dummy.updateMatrix();peaks.setMatrixAt(i,dummy.matrix);}this.root.add(peaks);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(2,24,16),this.glow(0xd4f6da));moon.position.set(8,12,-35);this.root.add(moon);
  for(const side of [-1,1])for(let i=0;i<8;i++){const stone=new THREE.Mesh(new THREE.IcosahedronGeometry(.45,0),new THREE.MeshStandardMaterial({color:0x29525a,flatShading:true,roughness:.9}));stone.position.set(side*(3.5+(i%2)*.5),.1,-3-i*2.2);stone.scale.y=.6;this.root.add(stone);}
  for(let i=0;i<5;i++){const halo=new THREE.Mesh(new THREE.TorusGeometry(2.3+i*.5,.012,6,64),this.glow(0xa7f3bc,.2));halo.position.set(0,1.5,-7-i*2);this.root.add(halo);}
 }
 private garden(){
  const wood=new THREE.MeshStandardMaterial({color:0x24413b,metalness:.1,roughness:.7}),roof=new THREE.MeshStandardMaterial({color:0x19343d,metalness:.35,roughness:.5,flatShading:true});
  for(const side of [-1,1])for(const z of [-9,-15]){const column=new THREE.Mesh(new THREE.CylinderGeometry(.17,.21,4,10),wood);column.position.set(side*3.5,2,z);this.root.add(column);const lantern=new THREE.Mesh(new THREE.CylinderGeometry(.2,.15,.38,12),new THREE.MeshStandardMaterial({color:0xffd49a,emissive:0xffd49a,emissiveIntensity:1.2,roughness:.6}));lantern.position.set(side*3.05,2.85,z+.2);this.root.add(lantern);const rim=new THREE.Mesh(new THREE.TorusGeometry(.22,.025,6,24),this.glow(0x7ee8c6,.7));rim.rotation.x=Math.PI/2;rim.position.copy(lantern.position);rim.position.y+=.21;this.root.add(rim);}
  const canopy=new THREE.Mesh(new THREE.ConeGeometry(5.7,1.6,4,1),roof);canopy.rotation.y=Math.PI/4;canopy.position.set(0,4.6,-12);canopy.scale.z=.78;this.root.add(canopy);
  const beam=new THREE.Mesh(new THREE.BoxGeometry(7.5,.14,.25),wood);beam.position.set(0,3.9,-9);this.root.add(beam);const beamBack=beam.clone();beamBack.position.z=-15;this.root.add(beamBack);
  const stalkGeo=new THREE.CylinderGeometry(.065,.09,4,6),stalkMat=new THREE.MeshStandardMaterial({color:0x346d52,roughness:.8}),stalks=new THREE.InstancedMesh(stalkGeo,stalkMat,72),leafGeo=new THREE.ConeGeometry(.3,1.2,4),leaves=new THREE.InstancedMesh(leafGeo,new THREE.MeshStandardMaterial({color:0x276148,roughness:.9,flatShading:true}),72),dummy=new THREE.Object3D();
  for(let i=0;i<72;i++){const side=i%2?-1:1;dummy.position.set(side*(5+(i%6)*.48),1.5+(i%4)*.23,-4-Math.floor(i/6)*2);dummy.scale.set(1,.7+(i%5)*.12,1);dummy.rotation.z=side*.055;dummy.updateMatrix();stalks.setMatrixAt(i,dummy.matrix);dummy.position.y+=1.5;dummy.scale.set(1.2,.5,1);dummy.rotation.z=side*.8;dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);}this.root.add(stalks,leaves);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.8,24,16),this.glow(0xd8fae9));moon.position.set(11,12,-31);this.root.add(moon);
  for(let i=0;i<9;i++){const stone=new THREE.Mesh(new THREE.CylinderGeometry(.52,.64,.08,10),new THREE.MeshStandardMaterial({color:0x4d6867,roughness:.8,flatShading:true}));stone.position.set(Math.sin(i*.8)*.4,-.01,-5-i*1.5);this.root.add(stone);}
 }
 update(time:number,c:Config){this.sky.uniforms.uTime.value=c.calm?0:time;const beat=c.calm?1:.88+Math.sin(time*c.track.bpm/60*Math.PI*2)*.12;for(const m of this.accents)m.opacity=Math.min(1,(m.userData.base??(m.userData.base=m.opacity))*beat);}
 dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();this.root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line||o instanceof THREE.Points){if(o instanceof THREE.InstancedMesh)o.dispose();geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.root.removeFromParent();}
}
