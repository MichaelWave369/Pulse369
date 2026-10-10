import { ApiError, db, json, number, payload, str } from './server';
import { CLAN_COLORS, validTimezone, weekStartInZone } from './clans';
type Row=Record<string,unknown>;

export async function requireClan(id:string,uid:string,leader=false):Promise<Row>{
 const clan=await db().prepare('SELECT c.* FROM clans c JOIN clan_members m ON m.clan_id = c.id WHERE c.id = ? AND m.user_id = ?').bind(id,uid).first<Row>();
 if(!clan)throw new ApiError(403,'Join this clan to see its members, chat, and workouts.');
 if(leader&&clan.leader_id!==uid)throw new ApiError(403,'Only the clan leader can change this.');return clan;
}
export async function myClans(uid:string){return (await db().prepare('SELECT c.*,(SELECT COUNT(*) FROM clan_members WHERE clan_id = c.id) AS member_count FROM clans c JOIN clan_members m ON m.clan_id = c.id WHERE m.user_id = ? ORDER BY c.created_at').bind(uid).all()).results;}
export async function clanView(row:Row){
 const start=weekStartInZone(Date.now(),String(row.timezone)),end=weekStartInZone(start+8*86400000,String(row.timezone));
 const [members,messages,rooms]=await Promise.all([
  db().prepare("SELECT m.user_id,m.joined_at,p.name,p.color,COALESCE(SUM(CASE WHEN c.mode IN ('rave','box','krav') THEN c.seconds ELSE 0 END),0) AS active_seconds,COALESCE(SUM(CASE WHEN c.mode NOT IN ('rave','box','krav') THEN c.seconds ELSE 0 END),0) AS mindful_seconds,COALESCE(SUM(c.completed),0) AS sessions FROM clan_members m JOIN profiles p ON p.user_id = m.user_id LEFT JOIN clan_credits c ON c.clan_id = m.clan_id AND c.owner_id = m.user_id AND c.created_at >= ? AND c.created_at < ? AND c.created_at >= m.joined_at WHERE m.clan_id = ? GROUP BY m.user_id,m.joined_at,p.name,p.color ORDER BY p.name,m.user_id").bind(start,end,row.id).all<{user_id:string;active_seconds:number;mindful_seconds:number;sessions:number}>(),
  db().prepare('SELECT m.id,m.body,m.created_at,p.name FROM clan_messages m JOIN profiles p ON p.user_id = m.user_id WHERE m.clan_id = ? ORDER BY m.created_at DESC LIMIT 100').bind(row.id).all(),
  db().prepare("SELECT r.id,r.code,r.title,r.state,r.config,r.clan_id,p.name AS host_name,(SELECT COUNT(*) FROM members m WHERE m.room_id = r.id AND m.last_seen > ?) AS online FROM rooms r JOIN profiles p ON p.user_id = r.host_id WHERE r.clan_id = ? AND r.state != 'ended' AND r.expires_at > ? ORDER BY r.created_at DESC LIMIT 20").bind(Date.now()-15000,row.id,Date.now()).all<Row>(),
 ]);
 const week=members.results.reduce((sum,m)=>({start,end,active_seconds:sum.active_seconds+Number(m.active_seconds),mindful_seconds:sum.mindful_seconds+Number(m.mindful_seconds),sessions:sum.sessions+Number(m.sessions)}),{start,end,active_seconds:0,mindful_seconds:0,sessions:0});
 return {...row,member_count:members.results.length,members:members.results,messages:messages.results.reverse(),rooms:rooms.results.map(r=>({...r,config:JSON.parse(String(r.config))})),week,serverTime:Date.now()};
}
async function roomLimit(uid:string){const count=await db().prepare('SELECT COUNT(*) AS n FROM clan_members WHERE user_id = ?').bind(uid).first<{n:number}>();if((count?.n??0)>=3)throw new ApiError(409,'You can belong to three clans. Leave one before joining another.');}
async function removeMember(id:string,uid:string){
 await db().batch([
  db().prepare('DELETE FROM clan_members WHERE clan_id = ? AND user_id = ?').bind(id,uid),
  db().prepare('DELETE FROM clan_credits WHERE clan_id = ? AND owner_id = ?').bind(id,uid),
  db().prepare('UPDATE sessions SET clan_id = NULL WHERE clan_id = ? AND owner_id = ?').bind(id,uid),
  db().prepare('DELETE FROM members WHERE user_id = ? AND room_id IN (SELECT id FROM rooms WHERE clan_id = ?)').bind(uid,id),
  db().prepare("UPDATE rooms SET state = 'ended' WHERE clan_id = ? AND host_id = ?").bind(id,uid),
 ]);
}
export async function clanRoute(r:Request,parts:string[],uid:string):Promise<Response>{
 if(parts.length===1&&r.method==='GET')return json({clans:await myClans(uid)});
 if(parts.length===1&&r.method==='POST'){
  await roomLimit(uid);const p=await payload(r),name=str(p.name,48);if(!name)throw new ApiError(400,'Give your clan a name.');if(p.timezone!==undefined&&!validTimezone(p.timezone))throw new ApiError(400,'Choose a valid timezone.');
  const id=crypto.randomUUID(),code=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');const color=CLAN_COLORS.includes(String(p.color))?p.color:'#c1a4ff',zone=validTimezone(p.timezone)?p.timezone:'America/Los_Angeles';
  const writes=await db().batch([db().prepare('INSERT INTO clans (id,code,name,description,leader_id,color,move_goal,mindful_goal,session_goal,timezone,created_at) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM clan_members WHERE user_id = ?) < 3').bind(id,code,name,str(p.description,240),uid,color,Math.round(number(p.move_goal,3,10000,180)),Math.round(number(p.mindful_goal,3,5000,60)),Math.round(number(p.session_goal,1,1000,12)),zone,Date.now(),uid),db().prepare('INSERT INTO clan_members (clan_id,user_id,joined_at) SELECT id, ?, ? FROM clans WHERE id = ?').bind(uid,Date.now(),id)]);
  if(!writes[0].meta.changes)throw new ApiError(409,'You can belong to three clans. Leave one before joining another.');
  return json({clan:await clanView(await requireClan(id,uid)),clans:await myClans(uid)},201);
 }
 if(parts[1]==='join'&&r.method==='POST'){
  const p=await payload(r),code=str(p.code,8).toUpperCase();const clan=await db().prepare('SELECT * FROM clans WHERE code = ?').bind(code).first<Row>();if(!clan)throw new ApiError(404,'Clan not found. Check the eight-character invite code.');
  const existing=await db().prepare('SELECT user_id FROM clan_members WHERE clan_id = ? AND user_id = ?').bind(clan.id,uid).first();
  if(!existing){await roomLimit(uid);const n=await db().prepare('SELECT COUNT(*) AS n FROM clan_members WHERE clan_id = ?').bind(clan.id).first<{n:number}>();if((n?.n??0)>=48)throw new ApiError(409,'This clan has 48 members.');await db().prepare('INSERT OR IGNORE INTO clan_members (clan_id,user_id,joined_at) SELECT ?, ?, ? WHERE (SELECT COUNT(*) FROM clan_members WHERE user_id = ?) < 3 AND (SELECT COUNT(*) FROM clan_members WHERE clan_id = ?) < 48 AND EXISTS (SELECT 1 FROM clans WHERE id = ?)').bind(clan.id,uid,Date.now(),uid,clan.id,clan.id).run();if(!await db().prepare('SELECT user_id FROM clan_members WHERE clan_id = ? AND user_id = ?').bind(clan.id,uid).first()){await roomLimit(uid);throw new ApiError(409,'This clan has filled or closed. Try another clan.');}}
  return json({clan:await clanView(clan),clans:await myClans(uid)});
 }
 const id=parts[1],action=parts[2];if(!id)throw new ApiError(404,'Clan action not found.');
 if(parts.length===2&&r.method==='GET')return json({clan:await clanView(await requireClan(id,uid))});
 if(parts.length===2&&r.method==='PATCH'){
  const clan=await requireClan(id,uid,true),p=await payload(r);if(p.timezone!==undefined&&!validTimezone(p.timezone))throw new ApiError(400,'Choose a valid timezone.');
  await db().prepare('UPDATE clans SET name = ?,description = ?,color = ?,move_goal = ?,mindful_goal = ?,session_goal = ?,timezone = ? WHERE id = ?').bind(str(p.name,48,String(clan.name))||clan.name,str(p.description,240,String(clan.description)),CLAN_COLORS.includes(String(p.color))?p.color:clan.color,Math.round(number(p.move_goal,3,10000,Number(clan.move_goal))),Math.round(number(p.mindful_goal,3,5000,Number(clan.mindful_goal))),Math.round(number(p.session_goal,1,1000,Number(clan.session_goal))),p.timezone??clan.timezone,id).run();return json({clan:await clanView(await requireClan(id,uid))});
 }
 if(action==='chat'&&r.method==='POST'){
  await requireClan(id,uid);const p=await payload(r),body=str(p.body,300);if(!body)throw new ApiError(400,'Write a message first.');const last=await db().prepare('SELECT created_at FROM clan_messages WHERE clan_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1').bind(id,uid).first<{created_at:number}>();if(last&&Date.now()-last.created_at<1000)throw new ApiError(429,'Give your last message a moment.');await db().prepare('INSERT INTO clan_messages (id,clan_id,user_id,body,created_at) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(),id,uid,body,Date.now()).run();return json({clan:await clanView(await requireClan(id,uid))});
 }
 if(action==='transfer'&&r.method==='POST'){
  await requireClan(id,uid,true);const p=await payload(r),next=str(p.user_id,150);const member=await db().prepare('SELECT user_id FROM clan_members WHERE clan_id = ? AND user_id = ?').bind(id,next).first();if(!member)throw new ApiError(400,'Choose a current member as leader.');await db().prepare('UPDATE clans SET leader_id = ? WHERE id = ? AND leader_id = ?').bind(next,id,uid).run();return json({clan:await clanView(await requireClan(id,uid))});
 }
 if(action==='members'&&parts[3]&&r.method==='DELETE'){
  await requireClan(id,uid,true);let memberId:string;try{memberId=decodeURIComponent(parts[3]);}catch{throw new ApiError(400,'Choose a valid member.');}if(memberId===uid)throw new ApiError(400,'Use Leave clan to leave, after choosing a new leader.');await removeMember(id,memberId);return json({clan:await clanView(await requireClan(id,uid))});
 }
 if(action==='leave'&&r.method==='POST'){
  const clan=await requireClan(id,uid);const n=await db().prepare('SELECT COUNT(*) AS n FROM clan_members WHERE clan_id = ?').bind(id).first<{n:number}>();if(clan.leader_id===uid&&(n?.n??0)>1)throw new ApiError(409,'Choose a new leader before leaving your clan.');await removeMember(id,uid);
  if(clan.leader_id===uid)await db().batch([db().prepare('DELETE FROM clan_messages WHERE clan_id = ?').bind(id),db().prepare('DELETE FROM clan_credits WHERE clan_id = ?').bind(id),db().prepare('DELETE FROM custom_missions WHERE clan_id = ?').bind(id),db().prepare('DELETE FROM clans WHERE id = ?').bind(id)]);
  return json({left:true,clans:await myClans(uid)});
 }
 throw new ApiError(404,'Clan action not found.');
}
