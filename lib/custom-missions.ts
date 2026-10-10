import { MODES, isActive, type Mode, type SessionResult } from './pulse';
import { PRESETS, type Preset } from './training';

export type MissionActivity=Mode|'all'|'active'|'mindful';
export type CustomMission={id:string;owner_id:string;clan_id:string|null;title:string;activity:MissionActivity;metric:'minutes'|'sessions';target:number;created_at:number;completed_at:number|null;archived_at:number|null;progress:number;can_manage:boolean;clan_name?:string|null};
export const MISSION_ACTIVITIES=[{id:'all',title:'Any activity'},{id:'active',title:'Active movement'},{id:'mindful',title:'Mindful movement'},...MODES.map(m=>({id:m.id,title:m.title}))];
export function matchesActivity(activity:MissionActivity,mode:Mode){return activity==='all'||activity==='active'&&isActive(mode)||activity==='mindful'&&!isActive(mode)||activity===mode;}
export function customMissionProgress(m:Pick<CustomMission,'activity'|'metric'|'target'>,sessions:Pick<SessionResult,'mode'|'seconds'|'completed'>[]){const s=sessions.filter(x=>matchesActivity(m.activity,x.mode));return Math.min(m.target,m.metric==='minutes'?s.reduce((n,x)=>n+x.seconds,0)/60:s.filter(x=>x.completed&&x.seconds>=60).length);}
export function customMissionLabel(m:Pick<CustomMission,'metric'|'target'|'progress'>){return `${m.metric==='minutes'?Math.floor(m.progress):m.progress} / ${m.target} ${m.metric==='minutes'?'min':'sessions'}`;}
export function customMissionPreset(m:Pick<CustomMission,'activity'>):Preset {const mode=m.activity==='all'||m.activity==='active'?'rave':m.activity==='mindful'?'breathe':m.activity;return PRESETS.find(p=>p.mode===mode&&p.minutes===3)??PRESETS.find(p=>p.mode===mode)!;}
