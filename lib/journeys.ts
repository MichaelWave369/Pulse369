import { PRESETS, type Preset } from './training';
import type { CoachId, SessionResult } from './pulse';

export type Journey={id:string;title:string;description:string;focus:string;coach:CoachId;color:string;presets:string[]};
export type JourneyState={id:string;next_step:number;started_at:number;completed_at:number|null};
export const JOURNEYS:Journey[]=[
 {id:'first-lights',title:'First lights',description:'Get familiar with the studio through short dance, recovery, and movement sessions.',focus:'Getting started',coach:'nova',color:'#c1a4ff',presets:['breath-one','first-flow','stretch-five','box-three','yoga-three','tai-three','qigong-six']},
 {id:'rave-momentum',title:'Rave momentum',description:'Build a dance routine with recovery sessions between longer sets.',focus:'Dance & recovery',coach:'nova',color:'#ff9aaf',presets:['neon-six','orbital-nine','qigong-three','rave-twelve','breath-three','rave-twenty']},
 {id:'quiet-practice',title:'Quiet practice',description:'Explore yoga, tai chi, Eight Brocades, breathing, and stillness.',focus:'Mindful movement',coach:'sage',color:'#7ee8c6',presets:['yoga-three','tai-six','qigong-six','breath-three','stretch-five','mind-nine','yoga-twelve']},
 {id:'guard-flow',title:'Guard & flow',description:'Begin with controlled boxing, then alternate martial rhythm with gentle recovery.',focus:'Martial fitness',coach:'atlas',color:'#75d7ed',presets:['box-three','krav-three','krav-six','stretch-five','krav-twelve','qigong-six']},
];
export function journeyPresets(j:Journey):Preset[]{return j.presets.map(id=>PRESETS.find(p=>p.id===id)!);}
export function nextJourneyPreset(j:Journey,state:JourneyState):Preset|undefined{return state.completed_at?undefined:PRESETS.find(p=>p.id===j.presets[state.next_step]);}
export function qualifiesJourneyStep(j:Journey,index:number,s:Pick<SessionResult,'mode'|'seconds'|'completed'>){const p=PRESETS.find(p=>p.id===j.presets[index]);return !!p&&s.completed&&s.mode===p.mode&&s.seconds>=p.minutes*60;}
