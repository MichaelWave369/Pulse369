import { ApiError, db, json, payload, str } from './server';
import { MISSION_ACTIVITIES, type CustomMission } from './custom-missions';

type GoalRow=Omit<CustomMission,'progress'|'can_manage'>&{leader_id?:string|null;raw_progress?:number};
async function clanScope(id:string,uid:string,leader=false){const row=await db().prepare('SELECT c.leader_id FROM clans c JOIN clan_members m ON m.clan_id = c.id WHERE c.id = ? AND m.user_id = ?').bind(id,uid).first<{leader_id:string}>();if(!row)throw new ApiError(403,'Join this clan to see its missions.');if(leader&&row.leader_id!==uid)throw new ApiError(403,'Only the clan leader can create or archive clan missions.');return row;}
export async function requireCustomMission(id:string,uid:string,manage=false){const m=await db().prepare('SELECT * FROM custom_missions WHERE id = ?').bind(id).first<GoalRow>();if(!m)throw new ApiError(404,'Mission not found.');if(m.clan_id)await clanScope(m.clan_id,uid,manage);else if(m.owner_id!==uid)throw new ApiError(403,'This mission belongs to another account.');return m;}

function activitySql(alias:string){return `(g.activity = 'all' OR (g.activity = 'active' AND ${alias}.mode IN ('rave','box','krav')) OR (g.activity = 'mindful' AND ${alias}.mode NOT IN ('rave','box','krav')) OR g.activity = ${alias}.mode)`;}
export async function customMissionsFor(uid:string):Promise<CustomMission[]>{
 const rows=await db().prepare(`SELECT g.*,c.name AS clan_name,c.leader_id,
 CASE WHEN g.completed_at IS NOT NULL THEN g.target WHEN g.clan_id IS NULL THEN
  (SELECT COALESCE(SUM(CASE WHEN g.metric = 'minutes' THEN s.seconds WHEN s.completed = 1 AND s.seconds >= 60 THEN 1 ELSE 0 END),0) / CASE WHEN g.metric = 'minutes' THEN 60.0 ELSE 1 END FROM sessions s WHERE s.owner_id = g.owner_id AND s.custom_mission_id = g.id AND s.created_at >= g.created_at AND (g.archived_at IS NULL OR s.created_at <= g.archived_at) AND ${activitySql('s')})
 ELSE
  (SELECT COALESCE(SUM(CASE WHEN g.metric = 'minutes' THEN x.seconds WHEN x.completed = 1 AND x.seconds >= 60 THEN 1 ELSE 0 END),0) / CASE WHEN g.metric = 'minutes' THEN 60.0 ELSE 1 END FROM clan_credits x JOIN clan_members m ON m.clan_id = x.clan_id AND m.user_id = x.owner_id WHERE x.clan_id = g.clan_id AND x.created_at >= g.created_at AND x.created_at >= m.joined_at AND (g.archived_at IS NULL OR x.created_at <= g.archived_at) AND ${activitySql('x')})
 END AS raw_progress FROM custom_missions g LEFT JOIN clans c ON c.id = g.clan_id WHERE (g.clan_id IS NULL AND g.owner_id = ?) OR EXISTS (SELECT 1 FROM clan_members m WHERE m.clan_id = g.clan_id AND m.user_id = ?) ORDER BY CASE WHEN g.completed_at IS NULL AND g.archived_at IS NULL THEN 0 ELSE 1 END,g.created_at DESC,g.id LIMIT 100`).bind(uid,uid).all<GoalRow>();
 const completed=rows.results.filter(m=>!m.archived_at&&!m.completed_at&&Number(m.raw_progress)>=m.target),time=Date.now();
 for(let i=0;i<completed.length;i+=80){const ids=completed.slice(i,i+80).map(m=>m.id);await db().prepare(`UPDATE custom_missions SET completed_at = ? WHERE id IN (${ids.map(()=>'?').join(',')}) AND completed_at IS NULL AND archived_at IS NULL`).bind(time,...ids).run();}
 const timestamps=completed.length?(await db().prepare(`SELECT id,completed_at FROM custom_missions WHERE id IN (${completed.map(()=>'?').join(',')})`).bind(...completed.map(m=>m.id)).all<{id:string;completed_at:number|null}>()).results:[];
 return rows.results.map(m=>({id:m.id,owner_id:m.owner_id,clan_id:m.clan_id,title:m.title,activity:m.activity,metric:m.metric,target:m.target,created_at:m.created_at,completed_at:m.completed_at??timestamps.find(t=>t.id===m.id)?.completed_at??null,archived_at:m.archived_at,progress:Math.min(m.target,Number(m.raw_progress)),can_manage:m.clan_id?m.leader_id===uid:m.owner_id===uid,clan_name:m.clan_name??null}));
}
export async function customMissionRoute(r:Request,parts:string[],uid:string){
 if(parts.length===1&&r.method==='GET')return json({missions:await customMissionsFor(uid)});
 if(parts.length===1&&r.method==='POST'){
  const p=await payload(r),title=str(p.title,72),clanId=str(p.clan_id,80)||null;if(!title)throw new ApiError(400,'Give your mission a name.');
  if(clanId)await clanScope(clanId,uid,true);
  if(!MISSION_ACTIVITIES.some(a=>a.id===p.activity)||!['minutes','sessions'].includes(String(p.metric))||typeof p.target!=='number'||!Number.isInteger(p.target)||p.target<1||p.target>(p.metric==='minutes'?2000:100))throw new ApiError(400,'Choose an activity and a valid minute or session target.');
  const id=crypto.randomUUID(),scope=clanId?'clan_id = ?':'clan_id IS NULL AND owner_id = ?';
  const write=await db().prepare(`INSERT INTO custom_missions (id,owner_id,clan_id,title,activity,metric,target,created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM custom_missions WHERE ${scope} AND completed_at IS NULL AND archived_at IS NULL) < 12 AND (? IS NULL OR EXISTS (SELECT 1 FROM clans c JOIN clan_members m ON m.clan_id = c.id WHERE c.id = ? AND c.leader_id = ? AND m.user_id = ?))`).bind(id,uid,clanId,title,p.activity,p.metric,p.target,Date.now(),clanId??uid,clanId,clanId,uid,uid).run();if(!write.meta.changes){if(clanId)await clanScope(clanId,uid,true);throw new ApiError(409,'This space has 12 active missions. Finish or archive one first.');}
  const missions=await customMissionsFor(uid);return json({mission:missions.find(m=>m.id===id),missions},201);
 }
 if(parts.length===3&&parts[2]==='archive'&&r.method==='POST'){
  await requireCustomMission(parts[1],uid,true);await db().prepare('UPDATE custom_missions SET archived_at = ? WHERE id = ? AND archived_at IS NULL AND ((clan_id IS NULL AND owner_id = ?) OR EXISTS (SELECT 1 FROM clans c JOIN clan_members m ON m.clan_id = c.id WHERE c.id = custom_missions.clan_id AND c.leader_id = ? AND m.user_id = ?))').bind(Date.now(),parts[1],uid,uid,uid).run();await requireCustomMission(parts[1],uid,true);return json({missions:await customMissionsFor(uid)});
 }
 throw new ApiError(404,'Mission action not found.');
}
