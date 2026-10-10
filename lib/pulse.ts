export type Mode = 'rave' | 'box' | 'krav' | 'breathe' | 'meditate' | 'stretch' | 'yoga' | 'tai-chi' | 'qigong';
export type Track = { id:string; title:string; bpm:number; offset:number; duration:number; shared:number; size?:number; mime?:string; demo?:boolean };
export type WorldId = 'temple'|'orbit'|'aurora'|'garden';
export type CoachId = 'nova'|'atlas'|'lumen'|'sage'|'none';
export type Program = 'flow'|'balanced'|'intervals';
export type RaveStyle = 'free'|'waves'|'groove';
export type HeartSummary = { average:number; min:number; max:number; samples:number };
export type Config = { mode:Mode; minutes:number; difficulty:'easy'|'steady'|'intense'; seated:boolean; calm:boolean; noHold:boolean; track:Track; seed:number; world?:WorldId; coach?:CoachId; companions?:number; program?:Program; presetId?:string; missionId?:string;journeyId?:string;journeyStep?:number;customMissionId?:string;raveStyle?:RaveStyle };
export type SessionResult = { id:string; mode:Mode; seconds:number; hits:number; total:number; combo:number; score:number; device:'vr'|'desktop'; completed:boolean; created_at?:number; mission_id?:string|null; preset_id?:string|null; world?:WorldId; coach?:CoachId; seated?:boolean; room_id?:string|null; run_id?:string|null; hr_summary?:HeartSummary|null;clan_id?:string|null;journey_id?:string|null;journey_step?:number|null;custom_mission_id?:string|null;rave_style?:RaveStyle|null };
export type Profile = { user_id:string; name:string; color:string; move_goal:number; session_goal:number; mindful_goal:number };
export type Member = { user_id:string; name:string; color:string; ready:number; last_seen:number; score:number; pose:number[] };
export type Room = { id:string; code:string; title:string; host_id:string; state:'lobby'|'running'|'ended'; start_at:number|null; run_id:string|null; config:Config; members:Member[]; messages:{ id:string; name:string; body:string; created_at:number }[]; serverTime:number;clan_id?:string|null };
export const MODES: { id:Mode; title:string; subtitle:string; kind:'active'|'recovery'; cue:string }[] = [
 {id:'rave',title:'Rave flow',subtitle:'Reach, wave, and ride the beat.',kind:'active',cue:'Reach through the rings. Purple left. Lime right.'},
 {id:'box',title:'Beat boxing',subtitle:'Jabs, crosses, and rhythm.',kind:'active',cue:'Punch the lights with the matching hand. Keep a soft elbow.'},
 {id:'krav',title:'Krav rhythm',subtitle:'Krav Maga-inspired strikes and guards.',kind:'active',cue:'Circle targets: controlled punch. Shield targets: hold a gentle guard.'},
 {id:'breathe',title:'369 breathing',subtitle:'A little space between beats.',kind:'recovery',cue:'Keep your breath comfortable. Holds are optional.'},
 {id:'meditate',title:'Quiet mind',subtitle:'Settle in. Let the music carry you.',kind:'recovery',cue:'Sit or stand comfortably. Notice your natural breath.'},
 {id:'stretch',title:'Release & reset',subtitle:'Ease your shoulders, wrists, and legs.',kind:'recovery',cue:'Gentle movement within a comfortable range.'},
 {id:'yoga',title:'Slow flow yoga',subtitle:'An upright flow, standing or seated.',kind:'recovery',cue:'Move slowly. Use a chair whenever you want.'},
 {id:'tai-chi',title:'Tai chi flow',subtitle:'Slow hand paths and grounded movement.',kind:'recovery',cue:'Follow the flowing hands. Keep both feet grounded, or stay seated.'},
 {id:'qigong',title:'Qigong · Eight Brocades',subtitle:'A gentle Baduanjin-inspired sequence.',kind:'recovery',cue:'Eight adapted upper-body movements. Breathe naturally and move gently.'},
];
export const DEMOS:Track[] = [
 {id:'demo-afterglow',title:'Afterglow',bpm:128,offset:0,duration:30,shared:1,demo:true},
 {id:'demo-orbit',title:'Orbit 369',bpm:110,offset:0,duration:34.909,shared:1,demo:true},
 {id:'demo-still',title:'Still water',bpm:72,offset:0,duration:20,shared:1,demo:true},
];
export const DURATIONS = [1,3,5,6,9,12,15,20,30];
export const RAVE_STYLES:{id:RaveStyle;title:string;description:string}[]=[{id:'free',title:'Free flow',description:'Varied high and low reaches.'},{id:'waves',title:'Wave dance',description:'Alternate hands as the reaches rise and settle.'},{id:'groove',title:'Open & return',description:'Alternate close reaches and gentle outward reaches.'}];
export const DEFAULT_CONFIG:Config = { mode:'rave',minutes:3,difficulty:'easy',seated:false,calm:false,noHold:true,track:DEMOS[0],seed:369,world:'temple',coach:'nova',companions:2,program:'flow' };
export const isActive = (mode:Mode)=>mode==='rave'||mode==='box'||mode==='krav';
export const isStriking = (mode:Mode)=>mode==='box'||mode==='krav';
export function clock(seconds:number) { const n=Math.max(0,Math.floor(seconds)); return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`; }
export function sessionPhase(c:Config,t:number) {
 const duration=c.minutes*60, warm=Math.min(30,duration*.15),cool=warm;
 if(!isActive(c.mode))return {id:'mindful',title:'Mindful flow',remaining:Math.max(0,duration-t),targets:false};
 if(!c.program||c.program==='flow')return {id:'work',title:'Continuous flow',remaining:Math.max(0,duration-t),targets:true};
 if(t<warm)return {id:'warmup',title:'Warm up',remaining:warm-t,targets:true};
 if(t>=duration-cool)return {id:'cooldown',title:'Cool down',remaining:Math.max(0,duration-t),targets:false};
 if(c.program==='intervals') {const pos=(t-warm)%80,rest=pos>=60;return {id:rest?'recovery':'work',title:rest?'Recovery break':'Move to the beat',remaining:Math.min(rest?80-pos:60-pos,duration-cool-t),targets:!rest};}
 return {id:'work',title:'Find your rhythm',remaining:duration-cool-t,targets:true};
}
export function makeChart(c:Config) {
 if(!isActive(c.mode))return [];
 const beat=60/c.track.bpm, step=beat*(c.difficulty==='easy'?2:c.difficulty==='intense'?.5:1);
 let seed=c.seed>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const notes:{time:number;lane:number;x:number;y:number;gesture?:'strike'|'guard'}[]=[];
 const phrases=[[0,2,1,3],[2,0,3,1],[0,2,0,3],[2,0,2,1]];let phrase=phrases[0];
 let index=0;
 for(let time=Math.ceil(3/beat)*beat+c.track.offset;time<c.minutes*60-.8;time+=step,index++){
   const randomLane=Math.floor(random()*4);if(index%4===0)phrase=phrases[randomLane];const phase=sessionPhase(c,time),danceIndex=phase.id==='warmup'?Math.floor(index/2):index;const lane=c.mode==='krav'?phrase[index%4]:c.mode==='rave'&&c.raveStyle==='waves'?[1,3,1,3,0,2,0,2][danceIndex%8]:c.mode==='rave'&&c.raveStyle==='groove'?[0,2,1,3,2,0,3,1][danceIndex%8]:randomLane, side=lane<2?-1:1;
   if(!phase.targets||(phase.id==='warmup'&&index%2!==0))continue;
   if(c.mode==='krav'){const guard=lane%2===1;notes.push({time,lane,x:side*(guard?(c.seated?.22:.28):(c.seated?.35:.48)),y:(guard?1.38:1.6)*(c.seated?.8:1),gesture:guard?'guard':'strike'});}else if(c.mode==='rave'&&c.raveStyle==='waves'){const height=[1.12,1.12,1.3,1.3,1.47,1.47,1.65,1.65][danceIndex%8];notes.push({time,lane,x:side*(c.seated?.36:.58),y:height*(c.seated?.8:1)});}else if(c.mode==='rave'&&c.raveStyle==='groove'){notes.push({time,lane,x:side*(danceIndex%8<4?.42:.64)*(c.seated?.625:1),y:(lane%2===0?1.65:1.12)*(c.seated?.8:1)});}else notes.push({time,lane,x:side*(c.seated?.4:c.mode==='box'?.48:.64),y:(lane%2===0?1.65:1.12)*(c.seated?.8:1)});
 }
 return notes;
}
export function danceCue(c:Config,t:number){const step=60/c.track.bpm*(c.difficulty==='easy'?2:c.difficulty==='intense'?.5:1),first=Math.ceil(3/(60/c.track.bpm))*(60/c.track.bpm)+c.track.offset,rawIndex=Math.max(0,Math.floor((t-first)/step)),index=sessionPhase(c,t).id==='warmup'?Math.floor(rawIndex/2):rawIndex;if(c.raveStyle==='waves')return {title:index%8<4?'Wave upward · alternate hands':'Float higher · return gently',detail:'Follow the next colored ring. Purple left · lime right. Keep the reach comfortable.'};if(c.raveStyle==='groove')return {title:index%8<4?'Close groove · alternate hands':'Open gently · alternate hands',detail:'Small reaches, then wider reaches. Keep your feet or seat grounded.'};return {title:'Reach & flow',detail:'Purple left · lime right. Move within your comfortable range.'};}
export function recoveryCue(c:Config,t:number):{title:string;detail:string;scale:number;cycle:number} {
 if(c.mode==='breathe') {
  const cycleLength=c.noHold?9:18,phase=t%cycleLength;
  const inhale=phase<3,hold=!c.noHold&&phase<9;
  const progress=inhale?phase/3:hold?1:1-(phase-(c.noHold?3:9))/(c.noHold?6:9);
  return {title:inhale?'Breathe in':hold?'Soft hold':'Breathe out',detail:`${Math.max(1,Math.ceil((inhale?3:hold?9:cycleLength)-phase))} seconds · keep it comfortable`,scale:.65+Math.max(0,progress)*.8,cycle:Math.floor(t/cycleLength)+1};
 }
 const med=[['Arrive here','Let your shoulders settle.'],['Notice your breath','Let it find its own pace.'],['Listen closely','Follow one sound, then let it go.'],['Soften your attention','Thoughts can come and go.'],['Come back gently','Feel your feet or the chair beneath you.'],['Carry this calm','Take one easy, natural breath.']];
 const stretch=[['Shoulder rolls','Slow circles, then change direction.'],['Open your chest','Let your arms rest back gently.'],['Reach to the left','A small side reach; keep both feet steady.'],['Reach to the right','Stay within an easy range.'],['Release your wrists','Gently open and close your hands.'],['Ease your calves','Seated ankle circles or an easy supported calf stretch.']];
 const yoga=[['Mountain pose','Feet or seat grounded. Stand or sit tall.'],['Easy upward reach','Inhale naturally as your hands rise.'],['Left side stretch','Keep the movement small and steady.'],['Right side stretch','Relax your shoulders away from your ears.'],['Heart center','Bring your hands together and soften your gaze.'],['Return to stillness','Lower your hands. Notice how you feel.']];
 const tai=[['Opening flow','Float your hands up, then down. Keep an easy range.'],['Cloud hands · left','Let one hand glide left while the other returns gently.'],['Cloud hands · right','Follow the slow arc. Let your shoulders stay soft.'],['Gather & release','Bring the hands inward, then ease them forward.'],['Gentle opening','Open the hands to the sides without forcing the reach.'],['Closing flow','Lower your hands slowly. Keep breathing naturally.']];
 const qigong=[['Lift the sky','Raise both hands comfortably, then let them settle.'],['Open the bow','Open one hand to the side; alternate gently.'],['One hand up, one down','Separate the hands slowly, then change sides.'],['Open the shoulders','Ease your hands outward while keeping your gaze forward.'],['Gentle side flow','Make a small side reach, keeping your head upright.'],['Float & lower','Lower the hands while keeping your spine upright.'],['Easy forward press','Press an open hand forward, then return gently.'],['Settle & breathe','Rest your hands. Let your natural breath lead.']];
 const list=c.mode==='meditate'?med:c.mode==='stretch'?stretch:c.mode==='tai-chi'?tai:c.mode==='qigong'?qigong:yoga;
 const index=Math.floor(t/30)%list.length;
 return {title:list[index][0],detail:list[index][1],scale:.9+Math.sin(t*.35)*.08,cycle:index+1};
}
// Mirrored demonstration coordinates, shared by the coach and hand-path guides.
// These are adapted upright movements; they do not assess martial-arts technique.
export function mindfulHands(c:Config,t:number):[number,number,number][] {
 const index=Math.floor(Math.max(0,t)/30),phase=(t%30)/30,ease=.5-.5*Math.cos(phase*Math.PI*4);let left=[-.3,1.1,.22],right=[.3,1.1,.22];
 if(c.mode==='breathe'){const scale=recoveryCue(c,t).scale;left=[-.25-(scale-.65)*.26,1.1+(scale-.65)*.22,.2];right=[-left[0],left[1],left[2]];}
 else if(c.mode==='tai-chi'){
  const n=index%6,arc=Math.sin(phase*Math.PI*4);if(n===0||n===5){left=[-.3,1.03+ease*.45,.22];right=[.3,left[1],.22];}else if(n===1||n===2){const dir=n===1?-1:1;left=[-.25+arc*.22*dir,1.28+Math.cos(phase*Math.PI*4)*.12,.27];right=[.25+arc*.22*dir,1.28-Math.cos(phase*Math.PI*4)*.12,.27];}else if(n===3){left=[-.18-ease*.1,1.25,.16+ease*.22];right=[-left[0],left[1],left[2]];}else{left=[-.25-ease*.25,1.27,.22];right=[-left[0],left[1],left[2]];}
 }else if(c.mode==='qigong'){
  const n=index%8,swap=phase<.5?1:-1;if(n===0){left=[-.23,1.1+ease*.72,.18];right=[.23,left[1],.18];}else if(n===1){left=[-.24-ease*(swap===1?.28:.04),1.35,.2];right=[.24+ease*(swap===-1?.28:.04),1.35,.2];}else if(n===2){left=[-.22,1.25+ease*.22*swap,.17];right=[.22,1.25-ease*.22*swap,.17];}else if(n===3||n===4){left=[-.28-ease*.17,1.1+(n===4?ease*.25:0),.2];right=[-left[0],left[1],.2];}else if(n===5){left=[-.28,1.5-ease*.45,.22];right=[.28,left[1],.22];}else if(n===6){left=[-.25,1.25,.18+(swap===1?ease*.22:0)];right=[.25,1.25,.18+(swap===-1?ease*.22:0)];}
 }else if(c.mode==='yoga'||c.mode==='stretch'){const n=index%6;left=[-.3,n===1||n===2?1.1+ease*.72:1.1,.18];right=[.3,n===1||n===3?1.1+ease*.72:1.1,.18];}
 const scale=c.seated?.8:1;return [left,right].map(([x,y,z])=>[x*scale,y*scale,z] as [number,number,number]);
}
export function movementProgress(c:Config,t:number){if(!['yoga','stretch','tai-chi','qigong'].includes(c.mode))return null;const time=Math.max(0,t),total=c.mode==='qigong'?8:6;return {step:Math.floor(time/30)%total+1,total,remaining:30-time%30};}
export function weekStats(sessions:SessionResult[],now=new Date()) {
 const start=new Date(now);start.setHours(0,0,0,0);start.setDate(start.getDate()-((start.getDay()+6)%7));
 const week=sessions.filter(s=>(s.created_at??0)>=start.getTime());
 return { move:Math.floor(week.filter(s=>isActive(s.mode)).reduce((n,s)=>n+s.seconds,0)/60),mindful:Math.floor(week.filter(s=>!isActive(s.mode)).reduce((n,s)=>n+s.seconds,0)/60),sessions:week.filter(s=>s.completed).length };
}
