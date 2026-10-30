import * as THREE from 'three';
import { PulseAudio } from './audio';
import { clock, danceCue, DEFAULT_CONFIG, isActive, isStriking, makeChart, mindfulHands, movementProgress, recoveryCue, sessionPhase, type Config, type Member, type SessionResult } from './pulse';
import { WorkoutWorld } from './worlds';
import { CustomWorkoutWorld } from './custom-workout-world';
import type { WorldPack } from '../portal/world-bridge.mjs';
import { WorkoutCompanions } from './companions';
import { coachDirective } from './training';
import { HeartAccumulator } from './heart-rate';

export type GameStatus={phase:'idle'|'loading'|'playing'|'paused'|'finished';elapsed:number;score:number;hits:number;total:number;combo:number;maxCombo:number;cue:string;detail:string;vr:boolean;coachCue?:string;coachDetail?:string;stage?:string;phaseRemaining?:number;heartRate?:number|null;recentHits?:number;recentTotal?:number};
type Note=ReturnType<typeof makeChart>[number]&{mesh?:THREE.Group;done:boolean};
export class PulseGame {
 renderer:THREE.WebGLRenderer;scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(64,1,.05,100);
 audio=new PulseAudio();config:Config=DEFAULT_CONFIG;status:GameStatus={phase:'idle',elapsed:0,score:0,hits:0,total:0,combo:0,maxCombo:0,cue:'',detail:'',vr:false};
 private recentResults:boolean[]=[];private notes:Note[]=[];private noteCursor=0;private clockStart=0;private pauseElapsed=0;private countedSeconds=0;private segmentStart=0;private lastFrame=0;private lastPublish=0;private lastHud='';private sessionId='';private usedVR=false;private startGeneration=0;
 private world?:WorkoutWorld;private customWorld?:CustomWorkoutWorld;private worldAudioMode:'live'|'tempo'|'still'='live';private worldVisualGain=1;private agents?:WorkoutCompanions;private heart=new HeartAccumulator();private heartRate:number|null=null;private lastSpeech=0;
 private orb:THREE.Mesh;private guides:THREE.Group[]=[];private guideTrails:THREE.Line[]=[];private guideSamples:THREE.Vector3[][]=[];private guideSampleAt=0;private targetGeo=new THREE.TorusGeometry(.17,.027,8,24);private coreGeo=new THREE.SphereGeometry(.082,12,8);private barGeo=new THREE.BoxGeometry(.19,.04,.025);private shieldGeo=new THREE.CircleGeometry(.16,6);
 private guardMark=new THREE.MeshBasicMaterial({color:0x0c1622});private handGeo=new THREE.SphereGeometry(.09,12,8);private materials=[new THREE.MeshBasicMaterial({color:0xc0a0ff}),new THREE.MeshBasicMaterial({color:0xd1fc74})];
 private controllers:THREE.XRTargetRaySpace[]=[];private grips:THREE.XRGripSpace[]=[];private lastHands=[new THREE.Vector3(),new THREE.Vector3()];private sources:(XRInputSource|undefined)[]=[];
 private hudCanvas:HTMLCanvasElement;private hudTexture:THREE.CanvasTexture;private hud:THREE.Mesh;private pauseButton:THREE.Mesh;private finishButton:THREE.Mesh;
 private peers=new Map<string,{group:THREE.Group;head:THREE.Mesh;left:THREE.Mesh;right:THREE.Mesh;target:number[]}>();private resizeObserver:ResizeObserver;
 private effectFlashes:{mesh:THREE.Mesh;life:number}[]=[];private raycaster=new THREE.Raycaster();private groupAnchor:number|null=null;private voice=false;private spoken='';private destroyed=false;
 onStatus:(s:GameStatus)=>void;onFinish:(r:SessionResult)=>void;onError:(e:string)=>void;
 constructor(private container:HTMLElement,onStatus:PulseGame['onStatus'],onFinish:PulseGame['onFinish'],onError:PulseGame['onError']){
  this.onStatus=onStatus;this.onFinish=onFinish;this.onError=onError;
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));this.renderer.setClearColor('#090b14');this.renderer.xr.enabled=true;this.renderer.xr.setReferenceSpaceType('local-floor');container.appendChild(this.renderer.domElement);
  this.camera.position.set(0,1.65,3.4);this.camera.lookAt(0,1.45,-5);this.scene.fog=new THREE.FogExp2(0x090b14,.018);this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
  this.world=new WorkoutWorld('temple');this.scene.add(this.world.root);this.agents=new WorkoutCompanions(this.scene);this.agents.configure(this.config);
  this.orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.7,3),new THREE.MeshStandardMaterial({color:0xd1fc74,emissive:0x759b37,emissiveIntensity:.55,metalness:.4,roughness:.22,transparent:true,opacity:.8}));this.orb.position.set(0,1.5,-3.5);this.orb.visible=false;this.scene.add(this.orb);
  for(let i=0;i<2;i++){const guide=new THREE.Group(),color=i===0?0xc1a4ff:0xd1fc74;const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65});guide.add(new THREE.Mesh(new THREE.TorusGeometry(.095,.006,6,32),mat),new THREE.Mesh(new THREE.SphereGeometry(.025,10,8),mat));guide.visible=false;this.guides.push(guide);this.scene.add(guide);const samples=Array.from({length:24},()=>new THREE.Vector3()),trail=new THREE.Line(new THREE.BufferGeometry().setFromPoints(samples),new THREE.LineBasicMaterial({color,transparent:true,opacity:.28,depthWrite:false}));trail.visible=false;trail.frustumCulled=false;this.guideSamples.push(samples);this.guideTrails.push(trail);this.scene.add(trail);}
  for(const x of [-.64,.64]){const r=new THREE.Mesh(new THREE.TorusGeometry(.25,.007,6,32),new THREE.MeshBasicMaterial({color:x<0?0x9c79d4:0x9fb958,transparent:true,opacity:.32}));r.position.set(x,1.45,-.55);this.scene.add(r);}
  this.hudCanvas=document.createElement('canvas');this.hudCanvas.width=1024;this.hudCanvas.height=256;this.hudTexture=new THREE.CanvasTexture(this.hudCanvas);this.hud=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.375),new THREE.MeshBasicMaterial({map:this.hudTexture,transparent:true,depthTest:false}));this.hud.position.set(0,2.05,-1.7);this.hud.visible=false;this.scene.add(this.hud);
  this.pauseButton=this.labelPlane('PAUSE',.36,.12);this.pauseButton.position.set(-.24,1.76,-1.7);this.finishButton=this.labelPlane('FINISH',.36,.12);this.finishButton.position.set(.24,1.76,-1.7);this.scene.add(this.pauseButton,this.finishButton);this.pauseButton.visible=this.finishButton.visible=false;
  for(let i=0;i<2;i++){const controller=this.renderer.xr.getController(i),grip=this.renderer.xr.getControllerGrip(i);this.controllers.push(controller);this.grips.push(grip);controller.addEventListener('connected',(event)=>{this.sources[i]=event.data;const hand=new THREE.Mesh(this.handGeo,this.materials[event.data.handedness==='left'?0:1]);grip.add(hand);});controller.addEventListener('disconnected',()=>{this.sources[i]=undefined;grip.clear();});controller.addEventListener('selectstart',()=>this.select(controller));this.scene.add(controller,grip);const ray=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-2)]),new THREE.LineBasicMaterial({color:0xd1fc74,transparent:true,opacity:.4}));controller.add(ray);}
  this.renderer.xr.addEventListener('sessionstart',()=>{this.status.vr=true;this.usedVR=true;this.hud.visible=this.pauseButton.visible=this.finishButton.visible=true;this.setPauseLabel();this.publish();});
  this.renderer.xr.addEventListener('sessionend',()=>{if(this.status.phase==='playing')this.pause();this.status.vr=false;this.hud.visible=this.pauseButton.visible=this.finishButton.visible=false;this.camera.position.set(0,1.65,3.4);this.camera.lookAt(0,1.45,-5);this.publish();});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resize();window.addEventListener('keydown',this.key);document.addEventListener('visibilitychange',this.visibility);this.renderer.setAnimationLoop(t=>this.frame(t));
 }
 private labelPlane(text:string,w:number,h:number){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d')!;x.fillStyle='#202132';x.fillRect(0,0,512,128);x.strokeStyle='#d1fc74';x.lineWidth=5;x.strokeRect(3,3,506,122);x.fillStyle='#d1fc74';x.font='bold 45px Arial';x.textAlign='center';x.fillText(text,256,80);return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),depthTest:false}));}
 private setPauseLabel(){const s=this.status.phase;const primary=s==='paused'?'RESUME':s==='finished'?(this.groupAnchor===null?'REPLAY':'DONE'):s==='playing'?'PAUSE':'WAIT';const secondary=['finished','idle','loading'].includes(s)?'EXIT VR':'FINISH';for(const [button,text] of [[this.pauseButton,primary],[this.finishButton,secondary]] as const){const old=(button.material as THREE.MeshBasicMaterial).map;const temp=this.labelPlane(text,.36,.12);(button.material as THREE.MeshBasicMaterial).map=(temp.material as THREE.MeshBasicMaterial).map;old?.dispose();temp.geometry.dispose();(temp.material as THREE.Material).dispose();}}
 private resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();}
 private applyScene(c:Config){if(this.world?.id!==(c.world??'temple')){this.world?.dispose();this.world=new WorkoutWorld(c.world??'temple');this.scene.add(this.world.root);}if(this.world)this.world.root.visible=!this.customWorld;this.agents?.configure(c);this.guides.forEach(g=>g.visible=false);this.guideTrails.forEach(t=>t.visible=false);this.scene.fog=new THREE.FogExp2(c.world==='aurora'?0x0a252b:0x090b14,.018);}
 /** Selects a local display-only world while inactive. No changes to Config, note chart or server rooms. */
 setCustomWorld(pack:WorldPack|null){
  if(['playing','paused','loading'].includes(this.status.phase))return;
  const next=pack?new CustomWorkoutWorld(pack):undefined;
  if(next)this.scene.add(next.root);
  const previous=this.customWorld;
  this.customWorld=next;
  if(this.world)this.world.root.visible=!next;
  previous?.dispose();
  this.audio.setAnalysisEnabled(!!next&&this.worldAudioMode==='live');
 }
 /** Visual-only settings. Live mode only analyzes an already-playing PulseAudio track. */
 setWorldVisuals(mode:'live'|'tempo'|'still',gain:number){
  if(!['live','tempo','still'].includes(mode)||!Number.isFinite(gain)||gain<0||gain>1.5)throw Error('Invalid world visual settings');
  this.worldAudioMode=mode;this.worldVisualGain=gain;
  this.audio.setAnalysisEnabled(!!this.customWorld&&mode==='live');
 }
 preview(c:Config){if(['playing','paused','loading'].includes(this.status.phase))return;this.config=c;this.applyScene(c);this.orb.visible=!isActive(c.mode);this.notes.forEach(n=>n.mesh&&this.scene.remove(n.mesh));this.notes=[];}
 setVoice(enabled:boolean){this.voice=enabled;if(!enabled)window.speechSynthesis?.cancel();}
 setHeartRate(bpm:number|null){this.heartRate=bpm;this.status.heartRate=bpm;if(bpm!==null&&this.status.phase==='playing'&&this.elapsed()>=0)this.heart.add(bpm);}
 private key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest('input,textarea,[role=combobox],[contenteditable]'))return;if(e.repeat)return;const lanes=['a','s','k','l'];const lane=lanes.indexOf(e.key.toLowerCase());if(lane>=0){e.preventDefault();this.hitLane(lane);}if(e.key==='Escape'||e.code==='Space'){if(this.status.phase==='playing'){e.preventDefault();this.pause();}else if(this.status.phase==='paused'){e.preventDefault();void this.resume().catch(e=>this.onError(e.message));}}};
 private visibility=()=>{if(document.hidden&&this.status.phase==='playing'&&!this.status.vr)this.pause();};
 async enterVR(c:Config,startSession=true){
  if(!navigator.xr)throw new Error('Open this studio in a browser with VR support on your headset.');
  void this.audio.unlock();
  const sessionPromise=navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor'],optionalFeatures:['bounded-floor']});
  const session=await sessionPromise;try{await this.renderer.xr.setSession(session);if(this.status.phase==='paused')await this.resume();else if(this.status.phase!=='playing'&&startSession)await this.start(c);else if(!startSession){this.status.cue='Waiting for the host';this.status.detail='Your shared session will start here.';this.publish();}}catch(e){await session.end();throw e;}
 }
 async start(c:Config,groupAnchor:number|null=null){
  if(this.status.phase==='playing'||this.status.phase==='loading')return;
  const generation=++this.startGeneration;this.audio.stop();this.config=c;this.groupAnchor=groupAnchor;this.status={phase:'loading',elapsed:0,score:0,hits:0,total:0,combo:0,maxCombo:0,cue:'Loading your music',detail:'',vr:this.renderer.xr.isPresenting};this.publish();
  try{await this.audio.unlock();await this.audio.prepare(c.track);if(this.destroyed||generation!==this.startGeneration)return;
   this.applyScene(c);this.heart.reset();this.recentResults=[];this.notes.forEach(n=>n.mesh&&this.scene.remove(n.mesh));this.clockStart=groupAnchor??performance.now();this.status.elapsed=this.elapsed();this.notes=makeChart(c).map(n=>({...n,done:n.time<Math.max(0,this.status.elapsed)}));this.noteCursor=0;this.sessionId=crypto.randomUUID();this.usedVR=this.renderer.xr.isPresenting;this.pauseElapsed=0;this.countedSeconds=0;this.segmentStart=performance.now();this.status.phase='playing';this.spoken='';this.lastSpeech=-Infinity;this.orb.visible=!isActive(c.mode);
   if(this.status.elapsed>=0)this.audio.play(c.track,this.status.elapsed);this.setPauseLabel();this.publish();
  }catch(error){this.status.phase='idle';this.publish();throw error;}
 }
 private elapsed(){return (performance.now()-this.clockStart)/1000;}
 private segmentSeconds(){return Math.max(0,(performance.now()-Math.max(this.segmentStart,this.clockStart))/1000);}
 pause(){if(this.status.phase!=='playing')return;this.countedSeconds+=this.segmentSeconds();this.pauseElapsed=Math.max(0,this.elapsed());this.status.elapsed=this.pauseElapsed;this.status.phase='paused';this.audio.stop();window.speechSynthesis?.cancel();this.setPauseLabel();this.publish();}
 async resume(){if(this.status.phase!=='paused')return;await this.audio.unlock();this.clockStart=this.groupAnchor??performance.now()-this.pauseElapsed*1000;this.segmentStart=performance.now();this.status.elapsed=Math.max(0,this.elapsed());this.notes.filter(n=>!n.done&&n.time<this.status.elapsed).forEach(n=>{n.done=true;if(n.mesh){this.scene.remove(n.mesh);n.mesh=undefined;}});this.status.phase='playing';this.audio.play(this.config.track,this.status.elapsed);this.setPauseLabel();this.publish();}
 cancelLoad(){if(this.status.phase==='loading'){this.startGeneration++;this.status.phase='idle';this.publish();}}
 finish(completed=false){
  if(!['playing','paused'].includes(this.status.phase))return;
  const seconds=Math.min(this.config.minutes*60,Math.floor(this.countedSeconds+(this.status.phase==='playing'?this.segmentSeconds():0)));
  this.audio.stop();window.speechSynthesis?.cancel();this.status.phase='finished';this.status.elapsed=seconds;this.status.cue='Session complete';this.status.detail='Well done. Take an easy breath.';this.setPauseLabel();this.publish();
  this.notes.forEach(n=>{if(n.mesh){this.scene.remove(n.mesh);n.mesh=undefined;}});
  if(seconds>0)this.onFinish({id:this.sessionId,mode:this.config.mode,seconds,hits:this.status.hits,total:this.status.total,combo:this.status.maxCombo,score:this.status.score,device:this.usedVR?'vr':'desktop',completed,mission_id:this.config.missionId??null,preset_id:this.config.presetId??null,journey_id:this.config.journeyId??null,journey_step:this.config.journeyStep??null,custom_mission_id:this.config.customMissionId??null,rave_style:this.config.mode==='rave'?(this.config.raveStyle??'free'):null,world:this.config.world,coach:this.config.coach,seated:this.config.seated,hr_summary:this.heart?.summary()??null});
 }
 hitLane(lane:number){if(this.status.phase!=='playing'||this.status.vr||!isActive(this.config.mode))return;const elapsed=this.elapsed();const note=this.notes.find(n=>!n.done&&n.lane===lane&&Math.abs(n.time-elapsed)<.23);if(note)this.collect(note);}
 private recordTarget(hit:boolean){this.recentResults=[...(this.recentResults??[]),hit].slice(-12);this.status.recentTotal=this.recentResults.length;this.status.recentHits=this.recentResults.filter(Boolean).length;}
 private collect(n:Note){n.done=true;if(n.mesh){this.scene.remove(n.mesh);n.mesh=undefined;}this.status.hits++;this.status.total++;this.recordTarget(true);this.status.combo++;this.status.maxCombo=Math.max(this.status.maxCombo,this.status.combo);this.status.score+=100+Math.min(50,this.status.combo*2);const mesh=new THREE.Mesh(new THREE.TorusGeometry(.2,.015,6,24),this.materials[n.lane<2?0:1]);mesh.position.set(n.x,n.y,-.55);this.scene.add(mesh);this.effectFlashes.push({mesh,life:.3});this.publish();}
 private select(c:THREE.XRTargetRaySpace){this.raycaster.ray.origin.setFromMatrixPosition(c.matrixWorld);this.raycaster.ray.direction.set(0,0,-1).applyQuaternion(c.getWorldQuaternion(new THREE.Quaternion()));const hit=this.raycaster.intersectObjects([this.pauseButton,this.finishButton].filter(o=>o.visible))[0];if(!hit)return;if(hit.object===this.finishButton){if(['finished','idle','loading'].includes(this.status.phase)){this.cancelLoad();void this.renderer.xr.getSession()?.end();}else this.finish();}else if(this.status.phase==='playing')this.pause();else if(this.status.phase==='finished'&&this.groupAnchor===null)void this.start(this.config).catch(e=>this.onError(e.message));else if(this.status.phase==='paused')void this.resume().catch(e=>this.onError(e.message));}
 private spawn(n:Note){const g=new THREE.Group(),material=this.materials[n.lane<2?0:1];if(n.gesture==='guard'){const shield=new THREE.Mesh(this.shieldGeo,material);shield.scale.y=1.2;g.add(shield,new THREE.Mesh(this.barGeo,this.guardMark));}else{g.add(new THREE.Mesh(this.targetGeo,material));g.add(new THREE.Mesh(this.coreGeo,material));if(isStriking(this.config.mode))g.add(new THREE.Mesh(this.barGeo,material));}g.position.set(n.x,n.y,-8);this.scene.add(g);n.mesh=g;}
 private frame(time:number){
  if(this.destroyed)return;const dt=Math.min(.05,Math.max(0,(time-this.lastFrame)/1000));this.lastFrame=time;
  const active=this.status.phase==='playing',elapsed=active?this.elapsed():this.status.elapsed;
  const visualTime=time/1000;
  // Imported scenery reads the session clock and chosen track BPM, never gameplay/pose data.
  // R3 live mode observes only the actual currently playing PulseAudio source.
  // The data is visual-only; the scoring clock/targets and audio graph stay authoritative.
  if(this.customWorld){
    const seconds=active?Math.max(0,elapsed):Math.max(0,this.status.elapsed);
    const input=this.worldAudioMode==='tempo'&&active&&elapsed>=0?undefined:
      this.worldAudioMode==='live'&&active&&elapsed>=0?this.audio.sampleVisualFrame():
      {energy:0,bass:0,mid:0,high:0,beat:0};
    this.customWorld.update(seconds,this.config.track.bpm,
      this.config.calm||this.worldAudioMode==='still',this.config.mode==='rave',
      this.config.track.offset,input,this.worldVisualGain,visualTime);
  }
  else this.world?.update(visualTime,this.config);
  if(active){this.status.elapsed=Math.max(0,elapsed);if(elapsed>=this.config.minutes*60){this.finish(true);}
   else if(elapsed<0){this.status.cue=`Starting in ${Math.ceil(-elapsed)}`;this.status.detail='Everyone starts on the same beat.';}
   else {if(!this.audio.source){try{this.audio.play(this.config.track,elapsed);}catch(e){this.pause();this.onError(e instanceof Error?e.message:'Audio could not start.');}}
    if(isActive(this.config.mode)){const phase=sessionPhase(this.config,elapsed),moves=this.config.seated?['Reach & flow','Wave your hands','Roll your shoulders','Reach to the sides']:['Reach & flow','Easy step left','Easy step right','Roll your shoulders'];this.status.stage=phase.title;this.status.phaseRemaining=phase.remaining;this.status.cue=!phase.targets?phase.title:elapsed<3?'Find your stance':this.config.mode==='rave'?moves[Math.floor(elapsed/12)%moves.length]:this.config.mode==='krav'?'Strike · guard · return':'Punch to the beat';this.status.detail=!phase.targets?'Lower your hands. Take an easy breath.':this.config.mode==='krav'?'Circle: strike · shield: gentle guard':this.config.seated?'Stay seated. Keep your reaches easy.':'Purple left · lime right';if(phase.targets&&elapsed>=3&&this.config.mode==='rave'&&this.config.raveStyle&&this.config.raveStyle!=='free'){const cue=danceCue(this.config,elapsed);this.status.cue=cue.title;this.status.detail=cue.detail;}
     const hands=this.grips.map(g=>g.getWorldPosition(new THREE.Vector3()));
     this.noteCursor=this.noteCursor??0;while(this.notes[this.noteCursor]?.done)this.noteCursor++;
     for(let index=this.noteCursor;index<this.notes.length;index++){const n=this.notes[index];if(n.done)continue;const until=n.time-elapsed;if(until>2.5)break;if(!n.mesh)this.spawn(n);n.mesh!.position.z=-.55-until*3;n.mesh!.rotation.z=this.config.calm?0:Math.sin(visualTime*1.5)*.2;
      if(this.status.vr&&Math.abs(until)<.23){for(let i=0;i<hands.length;i++){const source=this.sources[i];if(!source)continue;const side=source.handedness==='left'?0:source.handedness==='right'?1:-1;if(side!==(n.lane<2?0:1))continue;const speed=hands[i].distanceTo(this.lastHands[i])/Math.max(.001,dt);if(hands[i].distanceTo(n.mesh!.position)<.26&&(n.gesture==='guard'||speed>(isStriking(this.config.mode)?.45:.12))){this.collect(n);const h=source.gamepad?.hapticActuators?.[0];if(h)void h.pulse(.35,40);break;}}}
      if(!n.done&&until<-.23){n.done=true;this.status.total++;this.recordTarget(false);this.status.combo=0;if(n.mesh){this.scene.remove(n.mesh);n.mesh=undefined;}}
     }hands.forEach((h,i)=>this.lastHands[i].copy(h));
    }else{const cue=recoveryCue(this.config,elapsed);this.status.stage='Mindful flow';this.status.cue=cue.title;this.status.detail=cue.detail;this.orb.scale.setScalar(cue.scale);this.orb.rotation.y=this.config.calm?0:visualTime*.1;}
   }
  }else if(this.status.phase==='idle'||this.status.phase==='finished'){this.orb.scale.setScalar(.95+Math.sin(visualTime*.4)*.1);this.orb.rotation.y=this.config.calm?0:visualTime*.1;}
  const guidance=coachDirective(this.config,this.status);this.status.coachCue=guidance.title;this.status.coachDetail=guidance.detail;this.status.heartRate=this.heartRate;
  const showGuides=['yoga','stretch','tai-chi','qigong'].includes(this.config.mode),handPaths=showGuides?mindfulHands(this.config,Math.max(0,elapsed)):[],sampleNow=time-this.guideSampleAt>=80;for(let i=0;i<(this.guides?.length??0);i++){const guide=this.guides[i],wasVisible=guide.visible,trail=this.guideTrails[i],samples=this.guideSamples[i];guide.visible=showGuides;trail.visible=showGuides&&!this.config.calm&&active&&elapsed>=0;if(showGuides){const [x,y,z]=handPaths[i],target=new THREE.Vector3(x,y,-1-z);if(wasVisible)guide.position.lerp(target,1-Math.exp(-dt*5));else{guide.position.copy(target);samples.forEach(p=>p.copy(target));}if(trail.visible&&sampleNow){for(let j=samples.length-1;j>0;j--)samples[j].copy(samples[j-1]);samples[0].copy(guide.position);const points=trail.geometry.getAttribute('position');samples.forEach((p,j)=>points.setXYZ(j,p.x,p.y,p.z));points.needsUpdate=true;}}}if(sampleNow)this.guideSampleAt=time;
  this.agents?.update(this.config,elapsed,this.notes[this.noteCursor??0],active&&elapsed>=0);
  const speechTitle=isActive(this.config.mode)?guidance.title:this.status.cue,speechDetail=isActive(this.config.mode)?guidance.detail:this.status.detail;
  if(active&&elapsed>=0&&this.voice&&this.config.coach!=='none'&&speechTitle!==this.spoken&&time-this.lastSpeech>(isActive(this.config.mode)?8000:1500)){this.spoken=speechTitle;this.lastSpeech=time;if(typeof SpeechSynthesisUtterance!=='undefined'){const speech=new SpeechSynthesisUtterance(speechTitle+'. '+speechDetail);speech.rate=.86;speech.volume=.8;window.speechSynthesis?.speak(speech);}}
  for(const flash of this.effectFlashes){flash.life-=dt;flash.mesh.scale.multiplyScalar(1+dt*6);if(flash.life<=0){this.scene.remove(flash.mesh);flash.mesh.geometry.dispose();}}
  this.effectFlashes=this.effectFlashes.filter(f=>f.life>0);
  for(const peer of this.peers.values()){const p=peer.target;if(p.length===9){peer.head.position.lerp(new THREE.Vector3(p[0],p[1],p[2]),.15);peer.left.position.lerp(new THREE.Vector3(p[3],p[4],p[5]),.15);peer.right.position.lerp(new THREE.Vector3(p[6],p[7],p[8]),.15);}}
  if(time-this.lastPublish>150){this.lastPublish=time;this.publish();this.drawHud();}
  this.renderer.render(this.scene,this.camera);
 }
 private drawHud(){const s=this.status,movement=movementProgress(this.config,s.elapsed),text=`${s.phase}|${clock(s.elapsed)}|${s.score}|${s.combo}|${s.cue}|${s.heartRate}|${s.coachCue}`;if(text===this.lastHud)return;this.lastHud=text;const c=this.hudCanvas.getContext('2d')!;c.clearRect(0,0,1024,256);c.fillStyle='#11121ce8';c.fillRect(0,0,1024,256);c.textAlign='center';c.fillStyle='#d1fc74';c.font='bold 34px Arial';c.fillText(s.phase==='paused'?'PAUSED':`${clock(s.elapsed)} / ${clock(this.config.minutes*60)}    ${s.score} PTS    ${s.combo} COMBO${s.heartRate?'    '+s.heartRate+' BPM':''}`,512,51);c.fillStyle='#f6f5f8';c.font='bold 41px Arial';c.fillText(s.cue,512,109);c.font='25px Arial';c.fillStyle='#cbc7d9';c.fillText(s.detail,512,155);c.font='24px Arial';c.fillStyle='#d7c0fb';c.fillText(this.config.coach==='none'?'':s.coachCue??'',512,196);c.font='20px Arial';c.fillStyle='#cbc7d9';c.fillText((movement?`Movement ${movement.step} / ${movement.total} · ${Math.ceil(movement.remaining)} sec    `:'')+'Point at PAUSE or FINISH and press trigger',512,236);this.hudTexture.needsUpdate=true;}
 private publish(){this.onStatus({...this.status});}
 pose(){if(!this.status.vr)return [0,1.6,0,-.4,1.1,-.4,.4,1.1,-.4];const h=this.renderer.xr.getCamera().getWorldPosition(new THREE.Vector3()),left=this.sources.findIndex(s=>s?.handedness==='left'),right=this.sources.findIndex(s=>s?.handedness==='right');const l=left>=0?this.grips[left].getWorldPosition(new THREE.Vector3()):new THREE.Vector3(-.4,1.1,-.4),r=right>=0?this.grips[right].getWorldPosition(new THREE.Vector3()):new THREE.Vector3(.4,1.1,-.4);return [...h.toArray(),...l.toArray(),...r.toArray()];}
 updatePeers(members:Member[],selfId:string){const others=members.filter(m=>m.user_id!==selfId);const keep=new Set(others.map(m=>m.user_id));for(const [id,p]of this.peers){if(!keep.has(id)){this.scene.remove(p.group);p.group.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(o.material as THREE.Material).dispose();}});this.peers.delete(id);}}
  others.forEach((m,i)=>{let p=this.peers.get(m.user_id);if(!p){const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:m.color,transparent:true,opacity:.55});const head=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),material),left=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),material),right=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),material);const body=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.45,4,8),material);body.position.y=1.1;group.add(head,left,right,body);this.scene.add(group);p={group,head,left,right,target:[]};this.peers.set(m.user_id,p);}p.group.position.set(i%2===0?-2-i*.3:2+i*.3,0,-2.3-Math.floor(i/2)*.4);p.target=m.pose.length===9?m.pose:[0,1.6,0,-.4,1.1,-.4,.4,1.1,-.4];});
 }
 dispose(){this.destroyed=true;this.startGeneration++;this.renderer.setAnimationLoop(null);this.resizeObserver.disconnect();window.removeEventListener('keydown',this.key);document.removeEventListener('visibilitychange',this.visibility);void this.renderer.xr.getSession()?.end();this.audio.setAnalysisEnabled(false);this.audio.dispose();this.customWorld?.dispose();this.world?.dispose();this.agents?.dispose();window.speechSynthesis?.cancel();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();this.scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line||o instanceof THREE.Points){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);const map=(m as THREE.MeshBasicMaterial).map;if(map)textures.add(map);}}});geometries.add(this.targetGeo);geometries.add(this.coreGeo);geometries.add(this.handGeo);geometries.add(this.barGeo);geometries.add(this.shieldGeo);geometries.forEach(g=>g.dispose());materials.add(this.guardMark);this.materials.forEach(m=>materials.add(m));materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());this.renderer.dispose();this.renderer.domElement.remove();}
}
