import { db } from './server';
import { ACHIEVEMENTS, MISSIONS, missionProgress, type Career } from './training';
import type { HeartSummary, SessionResult } from './pulse';
import type { JourneyState } from './journeys';
import { customMissionsFor } from './custom-mission-server';

export function heartSummary(v:unknown):HeartSummary|null {
 if(!v||typeof v!=='object')return null;const p=v as Record<string,unknown>;
 const values=[p.average,p.min,p.max,p.samples];if(!values.every(x=>typeof x==='number'&&Number.isInteger(x)&&x>0))return null;
 const summary={average:p.average as number,min:p.min as number,max:p.max as number,samples:p.samples as number};
 return summary.min<=summary.average&&summary.average<=summary.max&&summary.max<=65535&&summary.samples<=72000?summary:null;
}
export function sessionView(row:Record<string,unknown>):SessionResult {return {...row,completed:!!row.completed,seated:!!row.seated,hr_summary:row.hr_summary?JSON.parse(String(row.hr_summary)):null} as SessionResult;}
export async function careerState(uid:string):Promise<Career> {
 const [history,missions,awards,journeys,customMissions]=await Promise.all([
  db().prepare('SELECT id,mode,seconds,hits,total,combo,score,device,completed,created_at,mission_id,world,coach,seated,room_id,clan_id,rave_style FROM sessions WHERE owner_id = ? ORDER BY created_at DESC').bind(uid).all<Record<string,unknown>>(),
  db().prepare('SELECT mission_id AS id,started_at,completed_at FROM missions WHERE owner_id = ?').bind(uid).all<{id:string;started_at:number;completed_at:number|null}>(),
  db().prepare('SELECT achievement_id AS id,earned_at FROM awards WHERE owner_id = ?').bind(uid).all<{id:string;earned_at:number}>(),
  db().prepare('SELECT journey_id AS id,next_step,started_at,completed_at FROM journey_enrollments WHERE owner_id = ? ORDER BY started_at').bind(uid).all<JourneyState>(),
  customMissionsFor(uid),
 ]);
 const sessions=history.results.map(sessionView),earned=new Set(awards.results.map(a=>a.id)),time=Date.now();
 const completedJourneys=new Set(journeys.results.filter(j=>j.completed_at).map(j=>j.id));
 const personalCompleted=(await db().prepare('SELECT COUNT(*) AS n FROM custom_missions WHERE owner_id = ? AND clan_id IS NULL AND completed_at IS NOT NULL').bind(uid).first<{n:number}>())?.n??0;
 const newAwards=ACHIEVEMENTS.filter(a=>!earned.has(a.id)&&(a.journey?completedJourneys.has(a.journey):a.custom?personalCompleted>=a.custom:a.test(sessions)));
 const progress=missions.results.map(m=>{const definition=MISSIONS.find(x=>x.id===m.id);const value=definition?missionProgress(definition,sessions.filter(s=>s.mission_id===m.id&&(s.created_at??0)>=m.started_at)):0;return {...m,progress:value,completed_at:m.completed_at??(definition&&value>=definition.target?time:null)};});
 const writes=[...newAwards.map(a=>db().prepare('INSERT OR IGNORE INTO awards (owner_id,achievement_id,earned_at) VALUES (?, ?, ?)').bind(uid,a.id,time)),...progress.filter(m=>m.completed_at&&!missions.results.find(x=>x.id===m.id)?.completed_at).map(m=>db().prepare('UPDATE missions SET completed_at = ? WHERE owner_id = ? AND mission_id = ? AND completed_at IS NULL').bind(m.completed_at,uid,m.id))];
 if(writes.length)await db().batch(writes);
 // Re-read durable timestamps so concurrent requests return the same awards.
 const saved=await db().prepare('SELECT achievement_id AS id,earned_at FROM awards WHERE owner_id = ? ORDER BY earned_at DESC').bind(uid).all<{id:string;earned_at:number}>();
 return {missions:progress,awards:saved.results,journeys:journeys.results,customMissions};
}
