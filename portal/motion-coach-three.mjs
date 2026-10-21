/**
 * Lightweight procedural WebXR illustration. The avatar is NOT a measured
 * human pose and never affects controller target positions or hit scoring.
 */
export function createCoachRig(scene,THREE){
  const group=new THREE.Group();
  const colors={body:0x947bdd,left:0xc7f876,right:0x79d4ff,leg:0x668fb5};
  const bones={};
  const makeBone=(key,color,radius)=>{
    const mesh=new THREE.Mesh(
      new THREE.CylinderGeometry(1,1,1,10),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.78})
    );
    mesh.userData.radius=radius;
    group.add(mesh);bones[key]=mesh;
  };
  makeBone('torso',colors.body,.12);
  for(const side of ['left','right']){
    makeBone(side+'Upper',colors[side],.048);
    makeBone(side+'Lower',colors[side],.043);
    makeBone(side+'Thigh',colors.leg,.066);
    makeBone(side+'Shin',colors.leg,.055);
  }
  const joints={};
  for(const key of ['head','leftHand','rightHand','leftElbow','rightElbow']){
    const color=key.startsWith('left')?colors.left:key.startsWith('right')?colors.right:0xc0adff;
    const mesh=new THREE.Mesh(
      new THREE.SphereGeometry(key==='head'?.12:.058,12,10),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.88})
    );
    group.add(mesh);joints[key]=mesh;
  }
  scene.add(group);
  return {group,bones,joints};
}
export function updateCoachRig(rig,pose,THREE){
  if(!rig||!pose)return;
  const UP=new THREE.Vector3(0,1,0),a=new THREE.Vector3(),b=new THREE.Vector3(),direction=new THREE.Vector3();
  const put=(mesh,p)=>mesh.position.set(p.x,p.y,0);
  const between=(bone,p,q)=>{
    a.set(p.x,p.y,0);b.set(q.x,q.y,0);
    direction.subVectors(b,a);
    const length=direction.length();
    if(length<.000001){bone.visible=false;return;}
    bone.visible=true;
    bone.position.copy(a).add(b).multiplyScalar(.5);
    bone.quaternion.setFromUnitVectors(UP,direction.multiplyScalar(1/length));
    const r=bone.userData.radius;
    bone.scale.set(r,length,r);
  };
  between(rig.bones.torso,pose.hips,pose.neck);
  put(rig.joints.head,pose.head);
  for(const side of ['left','right']){
    between(rig.bones[side+'Upper'],pose.shoulder[side],pose.elbow[side]);
    between(rig.bones[side+'Lower'],pose.elbow[side],pose.wrist[side]);
    between(rig.bones[side+'Thigh'],pose.hip[side],pose.knee[side]);
    between(rig.bones[side+'Shin'],pose.knee[side],pose.foot[side]);
    put(rig.joints[side+'Hand'],pose.wrist[side]);
    put(rig.joints[side+'Elbow'],pose.elbow[side]);
  }
}
