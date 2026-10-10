import { isActive, sessionPhase, danceCue, type Config, type SessionResult, type Mode, type WorldId, type CoachId, type Program } from './pulse';
import type { JourneyState } from './journeys';
import type { CustomMission } from './custom-missions';

export const WORLDS:{id:WorldId;title:string;subtitle:string;color:string}[] = [
 {id:'temple',title:'Neon Temple',subtitle:'Luminous arches above a midnight dance floor.',color:'#c1a4ff'},
 {id:'orbit',title:'Orbital Rave',subtitle:'A floating stage beneath planets and a star field.',color:'#75d7ed'},
 {id:'aurora',title:'Aurora Sanctuary',subtitle:'Mountain silhouettes, soft skies, and still water.',color:'#d1fc74'},
 {id:'garden',title:'Lantern Garden',subtitle:'A moonlit pavilion, bamboo, and flowing hand paths.',color:'#7ee8c6'},
];
export const COACHES:{id:CoachId;name:string;role:string;description:string;color:string;specialty:Mode}[] = [
 {id:'nova',name:'Nova',role:'Your rave companion',description:'Mirrors the next reach, celebrates your rhythm, and helps you reset after missed beats.',color:'#c1a4ff',specialty:'rave'},
 {id:'atlas',name:'Atlas',role:'Your movement coach',description:'Demonstrates alternating punches and reminds you to keep movements controlled.',color:'#75d7ed',specialty:'box'},
 {id:'lumen',name:'Lumen',role:'Your recovery guide',description:'Moves with your breathing, leads gentle stretches, and makes room for stillness.',color:'#d1fc74',specialty:'breathe'},
 {id:'sage',name:'Sage',role:'Your mindful movement guide',description:'Demonstrates tai chi and adapted Eight Brocades hand paths, with slow transitions and natural breathing.',color:'#7ee8c6',specialty:'tai-chi'},
];
export const PROGRAMS:{id:Program;title:string;description:string}[] = [
 {id:'flow',title:'Continuous flow',description:'Targets throughout; take your own breaks.'},
 {id:'balanced',title:'Warm up + flow + cool down',description:'An easier opening and a quiet ending.'},
 {id:'intervals',title:'60 / 20 intervals',description:'60 seconds moving, 20 seconds recovering, with warmup and cooldown.'},
];
export type Preset = {id:string;title:string;description:string;mode:Mode;minutes:number;difficulty:Config['difficulty'];world:WorldId;coach:CoachId;program:Program;tag:string;seated?:boolean;raveStyle?:Config['raveStyle']};
export const PRESETS:Preset[] = [
 {id:'spark',title:'One-minute spark',description:'A tiny dance break to get moving.',mode:'rave',minutes:1,difficulty:'easy',world:'temple',coach:'nova',program:'balanced',tag:'Quick start'},
 {id:'first-flow',title:'Find your feet',description:'An easy first trip onto the dance floor.',mode:'rave',minutes:3,difficulty:'easy',world:'temple',coach:'nova',program:'balanced',tag:'Beginner'},
 {id:'desk-rave',title:'Chair rave',description:'Shorter reaches, all the rhythm.',mode:'rave',minutes:5,difficulty:'easy',world:'orbit',coach:'nova',program:'balanced',tag:'Seated',seated:true},
 {id:'neon-six',title:'Neon six',description:'Six minutes of steady rave flow.',mode:'rave',minutes:6,difficulty:'steady',world:'temple',coach:'nova',program:'balanced',tag:'Dance'},
 {id:'orbital-nine',title:'Orbit the beat',description:'A longer groove with recovery breaks.',mode:'rave',minutes:9,difficulty:'steady',world:'orbit',coach:'nova',program:'intervals',tag:'Intervals'},
 {id:'rave-twelve',title:'Midnight momentum',description:'A playful twelve-minute dance set.',mode:'rave',minutes:12,difficulty:'steady',world:'temple',coach:'nova',program:'balanced',tag:'Dance'},
 {id:'rave-fifteen',title:'Festival flow',description:'Build a sustained groove at your pace.',mode:'rave',minutes:15,difficulty:'steady',world:'orbit',coach:'nova',program:'intervals',tag:'Endurance'},
 {id:'rave-twenty',title:'After-hours energy',description:'A spacious twenty-minute set.',mode:'rave',minutes:20,difficulty:'steady',world:'temple',coach:'nova',program:'intervals',tag:'Long set'},
 {id:'rave-thirty',title:'The main stage',description:'Half an hour, with regular recovery breaks.',mode:'rave',minutes:30,difficulty:'steady',world:'orbit',coach:'nova',program:'intervals',tag:'Long set'},
 {id:'box-three',title:'First punches',description:'Controlled movements and an easy beat.',mode:'box',minutes:3,difficulty:'easy',world:'orbit',coach:'atlas',program:'balanced',tag:'Beginner'},
 {id:'box-six',title:'Six-minute circuit',description:'Alternate hands and settle into rhythm.',mode:'box',minutes:6,difficulty:'steady',world:'temple',coach:'atlas',program:'balanced',tag:'Boxing'},
 {id:'box-twelve',title:'Orbital intervals',description:'Punch, recover, repeat.',mode:'box',minutes:12,difficulty:'steady',world:'orbit',coach:'atlas',program:'intervals',tag:'Intervals'},
 {id:'box-twenty',title:'Atlas circuit',description:'A longer boxing set with built-in breaks.',mode:'box',minutes:20,difficulty:'steady',world:'temple',coach:'atlas',program:'intervals',tag:'Boxing'},
 {id:'breath-one',title:'A little space',description:'One minute of gentle, no-hold breathing.',mode:'breathe',minutes:1,difficulty:'easy',world:'aurora',coach:'lumen',program:'flow',tag:'Reset'},
 {id:'breath-three',title:'369 sanctuary',description:'Choose gentle breathing or the optional 369 pattern.',mode:'breathe',minutes:3,difficulty:'easy',world:'aurora',coach:'lumen',program:'flow',tag:'Breathing'},
 {id:'mind-nine',title:'Nine minutes of quiet',description:'Let the music become your anchor.',mode:'meditate',minutes:9,difficulty:'easy',world:'aurora',coach:'lumen',program:'flow',tag:'Meditation'},
 {id:'mind-twenty',title:'Long exhale',description:'A longer guided space for attention.',mode:'meditate',minutes:20,difficulty:'easy',world:'aurora',coach:'lumen',program:'flow',tag:'Meditation'},
 {id:'stretch-five',title:'Release the day',description:'Shoulders, wrists, sides, and ankles.',mode:'stretch',minutes:5,difficulty:'easy',world:'aurora',coach:'lumen',program:'flow',tag:'Stretch'},
 {id:'stretch-twelve',title:'Full reset',description:'A slow, repeating stretch sequence.',mode:'stretch',minutes:12,difficulty:'easy',world:'aurora',coach:'lumen',program:'flow',tag:'Stretch'},
 {id:'yoga-six',title:'Grounded flow',description:'Upright yoga with seated options.',mode:'yoga',minutes:6,difficulty:'easy',world:'aurora',coach:'lumen',program:'flow',tag:'Yoga'},
 {id:'yoga-fifteen',title:'Aurora flow',description:'Move gently between reach and stillness.',mode:'yoga',minutes:15,difficulty:'easy',world:'aurora',coach:'lumen',program:'flow',tag:'Yoga'},
 {id:'krav-three',title:'Guard & return',description:'Learn the circle strike and shield guard targets.',mode:'krav',minutes:3,difficulty:'easy',world:'temple',coach:'atlas',program:'balanced',tag:'Krav-inspired'},
 {id:'krav-six',title:'Controlled combinations',description:'Short alternating strikes and gentle guard holds.',mode:'krav',minutes:6,difficulty:'easy',world:'orbit',coach:'atlas',program:'balanced',tag:'Krav-inspired'},
 {id:'krav-twelve',title:'Guard circuit',description:'A longer movement set with regular recovery.',mode:'krav',minutes:12,difficulty:'steady',world:'temple',coach:'atlas',program:'intervals',tag:'Krav-inspired'},
 {id:'krav-twenty',title:'Atlas guard flow',description:'Controlled combinations with built-in breaks.',mode:'krav',minutes:20,difficulty:'steady',world:'orbit',coach:'atlas',program:'intervals',tag:'Krav-inspired'},
 {id:'tai-three',title:'First cloud hands',description:'Begin with slow, upright hand arcs.',mode:'tai-chi',minutes:3,difficulty:'easy',world:'garden',coach:'sage',program:'flow',tag:'Tai chi'},
 {id:'tai-six',title:'Lantern cloud flow',description:'Opening, cloud hands, gather, and closing.',mode:'tai-chi',minutes:6,difficulty:'easy',world:'garden',coach:'sage',program:'flow',tag:'Tai chi'},
 {id:'tai-twelve',title:'Still-water practice',description:'A longer slow movement loop in the garden.',mode:'tai-chi',minutes:12,difficulty:'easy',world:'garden',coach:'sage',program:'flow',tag:'Tai chi'},
 {id:'tai-twenty',title:'Moonlit movement',description:'Twenty minutes of gentle mirrored hand paths.',mode:'tai-chi',minutes:20,difficulty:'easy',world:'garden',coach:'sage',program:'flow',tag:'Tai chi'},
 {id:'qigong-three',title:'Brocades introduction',description:'A short introduction to the adapted hand sequence.',mode:'qigong',minutes:3,difficulty:'easy',world:'garden',coach:'sage',program:'flow',tag:'Qigong'},
 {id:'qigong-six',title:'Eight gentle movements',description:'Eight upright movements inspired by Baduanjin.',mode:'qigong',minutes:6,difficulty:'easy',world:'garden',coach:'sage',program:'flow',tag:'Qigong'},
 {id:'qigong-twelve',title:'Brocades garden',description:'Repeat the eight-movement sequence at your pace.',mode:'qigong',minutes:12,difficulty:'easy',world:'garden',coach:'sage',program:'flow',tag:'Qigong'},
 {id:'qigong-fifteen',title:'Seated brocades',description:'A shorter reach range with gentle natural breathing.',mode:'qigong',minutes:15,difficulty:'easy',world:'garden',coach:'sage',program:'flow',tag:'Seated',seated:true},
 {id:'yoga-three',title:'Three-minute grounding',description:'A short upright yoga reset.',mode:'yoga',minutes:3,difficulty:'easy',world:'garden',coach:'lumen',program:'flow',tag:'Yoga'},
 {id:'yoga-twelve',title:'Lantern yoga circle',description:'A gentle upright flow for solo or group sessions.',mode:'yoga',minutes:12,difficulty:'easy',world:'garden',coach:'lumen',program:'flow',tag:'Yoga'},
 {id:'yoga-thirty',title:'The quiet gathering',description:'A longer repeating yoga flow, with seated options.',mode:'yoga',minutes:30,difficulty:'easy',world:'garden',coach:'lumen',program:'flow',tag:'Yoga'},
 {id:'wave-three',title:'First wave dance',description:'Alternating reaches that rise with the beat.',mode:'rave',minutes:3,difficulty:'easy',world:'orbit',coach:'nova',program:'balanced',tag:'Wave dance',raveStyle:'waves'},
 {id:'wave-six',title:'Neon waves',description:'Follow rising hand phrases at an easy pace.',mode:'rave',minutes:6,difficulty:'easy',world:'temple',coach:'nova',program:'balanced',tag:'Wave dance',raveStyle:'waves'},
 {id:'groove-nine',title:'Open the groove',description:'Alternate close and outward reaches, with recovery breaks.',mode:'rave',minutes:9,difficulty:'steady',world:'orbit',coach:'nova',program:'intervals',tag:'Groove',raveStyle:'groove'},
 {id:'groove-fifteen',title:'Festival phrases',description:'A longer groove with repeating arm phrases and breaks.',mode:'rave',minutes:15,difficulty:'steady',world:'temple',coach:'nova',program:'intervals',tag:'Groove',raveStyle:'groove'},
];
export function applyPreset(c:Config,p:Preset):Config {return {...c,...p,seated:!!p.seated,noHold:true,companions:c.companions??2,presetId:p.id,missionId:undefined,journeyId:undefined,journeyStep:undefined,customMissionId:undefined,raveStyle:p.raveStyle??'free'};}

export type Mission = {id:string;title:string;description:string;chapter:number;preset:string;target:number;unit:string;metric:'seconds'|'hits'|'combo'|'sessions'|'modes'|'shared'|'clan';mode?:Mode;mindful?:boolean;minimum?:number;raveStyle?:Config['raveStyle']};
export const MISSIONS:Mission[] = [
 {id:'first-light',title:'First light',description:'Complete one session of at least 1 minute.',chapter:1,preset:'spark',target:1,unit:'session',metric:'sessions',minimum:60},
 {id:'neon-footsteps',title:'Neon footsteps',description:'Spend 5 minutes in rave sessions for this mission.',chapter:1,preset:'desk-rave',target:300,unit:'minutes',metric:'seconds',mode:'rave'},
 {id:'catch-the-beat',title:'Catch the beat',description:'Hit 36 targets across your mission sessions.',chapter:1,preset:'first-flow',target:36,unit:'targets',metric:'hits'},
 {id:'find-your-focus',title:'Find your focus',description:'Build a 10-target combo in a mission session.',chapter:1,preset:'neon-six',target:10,unit:'combo',metric:'combo'},
 {id:'steady-hands',title:'Steady hands',description:'Spend 6 minutes in controlled boxing sessions.',chapter:2,preset:'box-six',target:360,unit:'minutes',metric:'seconds',mode:'box'},
 {id:'quiet-orbit',title:'Quiet orbit',description:'Spend 3 minutes in gentle breathing sessions.',chapter:2,preset:'breath-three',target:180,unit:'minutes',metric:'seconds',mode:'breathe'},
 {id:'release-reset',title:'Release & reset',description:'Spend 5 minutes stretching in mission sessions.',chapter:2,preset:'stretch-five',target:300,unit:'minutes',metric:'seconds',mode:'stretch'},
 {id:'grounded',title:'Grounded',description:'Spend 6 minutes in slow yoga sessions.',chapter:2,preset:'yoga-six',target:360,unit:'minutes',metric:'seconds',mode:'yoga'},
 {id:'make-a-routine',title:'Make a routine',description:'Complete 3 mission sessions of at least 3 minutes each.',chapter:3,preset:'first-flow',target:3,unit:'sessions',metric:'sessions',minimum:180},
 {id:'deep-quiet',title:'Deep quiet',description:'Collect 9 mindful minutes across recovery modes.',chapter:3,preset:'mind-nine',target:540,unit:'minutes',metric:'seconds',mindful:true},
 {id:'festival-lights',title:'Festival lights',description:'Collect 369 rhythm targets across mission sessions.',chapter:3,preset:'rave-fifteen',target:369,unit:'targets',metric:'hits'},
 {id:'shared-energy',title:'Shared energy',description:'Complete a mission session of at least 3 minutes in a real shared room.',chapter:3,preset:'neon-six',target:1,unit:'shared session',metric:'shared',minimum:180},
 {id:'guard-light',title:'Guard the light',description:'Collect 36 strike or guard targets in Krav rhythm mission sessions.',chapter:4,preset:'krav-three',target:36,unit:'targets',metric:'hits',mode:'krav'},
 {id:'cloud-path',title:'Follow the clouds',description:'Spend 6 minutes in tai chi mission sessions.',chapter:4,preset:'tai-six',target:360,unit:'minutes',metric:'seconds',mode:'tai-chi'},
 {id:'eight-threads',title:'Eight gentle threads',description:'Spend 6 minutes in adapted Eight Brocades mission sessions.',chapter:4,preset:'qigong-six',target:360,unit:'minutes',metric:'seconds',mode:'qigong'},
 {id:'yoga-circle',title:'Yoga circle',description:'Complete one shared yoga mission session of at least 3 minutes.',chapter:4,preset:'yoga-three',target:1,unit:'shared session',metric:'shared',mode:'yoga',minimum:180},
 {id:'clan-flame',title:'Carry the clan flame',description:'Complete one mission session of at least 3 minutes and contribute it to your clan.',chapter:4,preset:'neon-six',target:1,unit:'clan session',metric:'clan',minimum:180},
 {id:'clan-rest',title:'A calm contribution',description:'Complete one mindful mission session of at least 3 minutes and contribute it to your clan.',chapter:4,preset:'qigong-three',target:1,unit:'clan session',metric:'clan',mindful:true,minimum:180},
 {id:'ride-the-wave',title:'Ride the wave',description:'Spend 3 minutes in wave dance mission sessions.',chapter:5,preset:'wave-three',target:180,unit:'minutes',metric:'seconds',mode:'rave',raveStyle:'waves'},
 {id:'open-the-groove',title:'Open the groove',description:'Spend 9 minutes in open-and-return groove mission sessions.',chapter:5,preset:'groove-nine',target:540,unit:'minutes',metric:'seconds',mode:'rave',raveStyle:'groove'},
];
export type MissionState = {id:string;started_at:number;completed_at:number|null;progress:number};
export type Award = {id:string;earned_at:number};
export type Career = {missions:MissionState[];awards:Award[];journeys:JourneyState[];customMissions:CustomMission[]};
export const EMPTY_CAREER:Career={missions:[],awards:[],journeys:[],customMissions:[]};
export function missionProgress(m:Mission,all:SessionResult[]) {
 const s=all.filter(s=>(!m.mode||s.mode===m.mode)&&(!m.mindful||!isActive(s.mode))&&(!m.raveStyle||s.rave_style===m.raveStyle));
 const value=m.metric==='seconds'?s.reduce((n,x)=>n+x.seconds,0):m.metric==='hits'?s.reduce((n,x)=>n+x.hits,0):m.metric==='combo'?s.reduce((n,x)=>Math.max(n,x.combo),0):m.metric==='modes'?new Set(s.filter(x=>x.completed).map(x=>x.mode)).size:s.filter(x=>x.completed&&x.seconds>=(m.minimum??0)&&(m.metric!=='shared'||!!x.room_id)&&(m.metric!=='clan'||!!x.clan_id)).length;
 return Math.min(m.target,value);
}
export function missionLabel(m:Mission,value:number){return m.metric==='seconds'?`${Math.floor(value/60)} / ${m.target/60} min`:`${value} / ${m.target} ${m.unit}`;}
export type Achievement={id:string;title:string;description:string;icon:string;journey?:string;custom?:number;test:(s:SessionResult[])=>boolean};
const complete=(s:SessionResult[])=>s.filter(x=>x.completed);
export const ACHIEVEMENTS:Achievement[]=[
 {id:'hello-flow',title:'Hello, flow',description:'Complete your first session.',icon:'✦',test:s=>complete(s).length>=1},
 {id:'three-is-magic',title:'Three is magic',description:'Complete 3 sessions.',icon:'Ⅲ',test:s=>complete(s).length>=3},
 {id:'nine-lives',title:'Nine lives',description:'Complete 9 sessions.',icon:'9',test:s=>complete(s).length>=9},
 {id:'rhythm-regular',title:'Rhythm regular',description:'Complete 36 sessions.',icon:'36',test:s=>complete(s).length>=36},
 {id:'in-the-room',title:'In the room',description:'Complete a session in VR.',icon:'◉',test:s=>complete(s).some(x=>x.device==='vr')},
 {id:'better-together',title:'Better together',description:'Complete a verified room session.',icon:'∞',test:s=>complete(s).some(x=>!!x.room_id)},
 {id:'ten-in-a-row',title:'Ten in a row',description:'Build a 10-target combo.',icon:'10',test:s=>s.some(x=>x.combo>=10)},
 {id:'twenty-five',title:'In the groove',description:'Build a 25-target combo.',icon:'25',test:s=>s.some(x=>x.combo>=25)},
 {id:'fifty',title:'Flow state',description:'Build a 50-target combo.',icon:'50',test:s=>s.some(x=>x.combo>=50)},
 {id:'369-lights',title:'369 lights',description:'Hit 369 targets across your sessions.',icon:'369',test:s=>s.reduce((n,x)=>n+x.hits,0)>=369},
 {id:'thousand-lights',title:'Light collector',description:'Hit 1,000 targets.',icon:'1k',test:s=>s.reduce((n,x)=>n+x.hits,0)>=1000},
 {id:'mindful-nine',title:'Room to breathe',description:'Collect 9 mindful minutes.',icon:'☾',test:s=>s.filter(x=>!isActive(x.mode)).reduce((n,x)=>n+x.seconds,0)>=540},
 {id:'mindful-thirty',title:'Quiet devotion',description:'Collect 30 mindful minutes.',icon:'☼',test:s=>s.filter(x=>!isActive(x.mode)).reduce((n,x)=>n+x.seconds,0)>=1800},
 {id:'all-six',title:'Every kind of flow',description:'Complete the original 6 movement modes.',icon:'6',test:s=>['rave','box','breathe','meditate','stretch','yoga'].every(mode=>complete(s).some(x=>x.mode===mode))},
 {id:'own-pace',title:'Your own pace',description:'Complete a seated session.',icon:'♡',test:s=>complete(s).some(x=>x.seated)},
 {id:'world-tour',title:'World tour',description:'Complete sessions in 3 different worlds.',icon:'◎',test:s=>new Set(complete(s).filter(x=>x.world).map(x=>x.world)).size>=3},
 {id:'long-play',title:'Long play',description:'Complete a session of at least 15 minutes.',icon:'15',test:s=>complete(s).some(x=>x.seconds>=900)},
 {id:'main-stage',title:'Main stage',description:'Complete a 30-minute session.',icon:'30',test:s=>complete(s).some(x=>x.seconds>=1800)},
 {id:'gentle-guard',title:'Gentle guard',description:'Complete a Krav rhythm session.',icon:'◇',test:s=>complete(s).some(x=>x.mode==='krav')},
 {id:'cloud-dancer',title:'Cloud dancer',description:'Complete a tai chi flow session.',icon:'☁',test:s=>complete(s).some(x=>x.mode==='tai-chi')},
 {id:'eight-brocades',title:'Eight Brocades',description:'Complete a qigong session of at least 4 minutes.',icon:'8',test:s=>complete(s).some(x=>x.mode==='qigong'&&x.seconds>=240)},
 {id:'clan-contributor',title:'A light in the clan',description:'Contribute a complete session to a clan.',icon:'✧',test:s=>complete(s).some(x=>!!x.clan_id)},
 {id:'clan-circle',title:'The clan circle',description:'Complete a real group session and contribute it to your clan.',icon:'∞',test:s=>complete(s).some(x=>!!x.clan_id&&!!x.room_id)},
 {id:'nine-ways',title:'Nine ways to move',description:'Complete sessions in all 9 movement modes.',icon:'9',test:s=>['rave','box','krav','breathe','meditate','stretch','yoga','tai-chi','qigong'].every(mode=>complete(s).some(x=>x.mode===mode))},
 {id:'path-first-lights',title:'A bright beginning',description:'Finish the First lights training path.',icon:'✦',journey:'first-lights',test:()=>false},
 {id:'path-rave-momentum',title:'Rhythm & rest',description:'Finish the Rave momentum training path.',icon:'♫',journey:'rave-momentum',test:()=>false},
 {id:'path-quiet-practice',title:'A quiet practice',description:'Finish the Quiet practice training path.',icon:'☾',journey:'quiet-practice',test:()=>false},
 {id:'path-guard-flow',title:'Guard & grow',description:'Finish the Guard & flow training path.',icon:'◇',journey:'guard-flow',test:()=>false},
 {id:'wave-catcher',title:'Wave catcher',description:'Complete a wave dance session.',icon:'≈',test:s=>complete(s).some(x=>x.mode==='rave'&&x.rave_style==='waves')},
 {id:'groove-builder',title:'Groove builder',description:'Complete an open-and-return groove session.',icon:'♫',test:s=>complete(s).some(x=>x.mode==='rave'&&x.rave_style==='groove')},
 {id:'personal-milestone',title:'Make it yours',description:'Finish one personal custom mission.',icon:'✧',custom:1,test:()=>false},
 {id:'personal-three',title:'Your own rhythm',description:'Finish three personal custom missions.',icon:'3',custom:3,test:()=>false},
];

export type CoachSignal={elapsed:number;combo:number;hits:number;total:number;phase:string;recentHits?:number;recentTotal?:number};
export function coachDirective(c:Config,s:CoachSignal) {
 const coach=COACHES.find(x=>x.id===(c.coach??(isActive(c.mode)?'nova':'lumen'))),phase=sessionPhase(c,Math.max(0,s.elapsed));
 const name=coach?.name??'Your guide';
 if(s.phase==='paused')return {title:`${name}: take your time`,detail:'Resume whenever you feel ready.',mood:'rest'};
 if(!isActive(c.mode))return {title:`${name}: move gently`,detail:c.mode==='breathe'?'Follow the sphere. Return to natural breathing whenever you need.':c.mode==='meditate'?'Let thoughts pass. Come back to one sound.':c.mode==='tai-chi'||c.mode==='qigong'?'Follow my slow hand paths. Keep your feet grounded, or stay seated. Breathe naturally.':'Keep the reach comfortable. A chair is always an option.',mood:'calm'};
 if(phase.id==='cooldown'||phase.id==='recovery')return {title:`${name}: easy reset`,detail:'No targets for this moment. Lower your hands and let your shoulders soften.',mood:'rest'};
 if(phase.id==='warmup'||s.elapsed<8)return {title:`${name}: find your stance`,detail:c.seated?'Settle into your chair. Keep your reaches small.':c.mode==='krav'?'Circle: controlled strike. Shield: gentle guard. Keep your feet grounded.':c.mode==='box'?'Keep a soft elbow. Follow my alternating hands.':'Watch my hands. Start with a comfortable reach.',mood:'guide'};
 const recentTotal=s.recentTotal??s.total,recentHits=s.recentHits??s.hits;
 if(recentTotal>=8&&recentHits/recentTotal<.55)return {title:`${name}: one beat at a time`,detail:'Try smaller movements. Missed targets are fine; you can lower the pace next time.',mood:'support'};
 if(s.combo>=10)return {title:`${name}: you found the groove`,detail:`${s.combo} in a row. Keep that comfortable rhythm.`,mood:'celebrate'};
 if(c.mode==='rave'&&c.raveStyle&&c.raveStyle!=='free'){const cue=danceCue(c,s.elapsed);return {title:`${name}: ${cue.title.toLowerCase()}`,detail:cue.detail,mood:'guide'};}
 return {title:`${name}: ${c.mode==='krav'?'strike, guard, return':c.mode==='box'?'controlled punches':'ride the beat'}`,detail:c.mode==='krav'?'Follow the next target. A guard needs position, not impact.':c.mode==='box'?'Bring each hand back gently. You choose your range.':'Reach, return, and let the next beat come to you.',mood:'guide'};
}
export function recommendSession(coach:CoachId,s:SessionResult[]) {
 const latest=s.find(x=>isActive(x.mode)&&x.total>=12),easy=latest&&latest.hits/latest.total<.55;
 const p=PRESETS.find(p=>p.coach===coach&&(coach==='sage'?p.id==='tai-six':coach==='lumen'?p.id==='breath-three':easy?p.difficulty==='easy'&&p.minutes===3:p.minutes===6))??PRESETS[1];
 return {preset:p,reason:coach==='sage'?'A slow hand-path sequence for a mindful movement break.':coach==='lumen'?'A gentle reset to balance your movement.':easy?'Your recent rhythm session suggests an easier pace could help you settle in.':s.length?'A short, balanced session to keep your routine going.':'A welcoming session to get to know your coach.'};
}
