import { ApiError, bucket, db, identity, json, limitedBytes, number, payload, profile, str } from '@/lib/server';
import { DEMOS, MODES, DURATIONS, RAVE_STYLES, type Config, type Track } from '@/lib/pulse';
import { COACHES, MISSIONS, PRESETS, PROGRAMS, WORLDS } from '@/lib/training';
import { careerState, heartSummary, sessionView } from '@/lib/career-server';
import { clanRoute, myClans, requireClan } from '@/lib/clan-server';
import { customMissionRoute, requireCustomMission } from '@/lib/custom-mission-server';
import { JOURNEYS, qualifiesJourneyStep, type JourneyState } from '@/lib/journeys';

type Row=Record<string,unknown>;
const now=()=>Date.now();
async function requireRoom(id:string,uid:string,host=false):Promise<Row>{
 const room=await db().prepare('SELECT * FROM rooms WHERE id = ? AND expires_at > ?').bind(id,now()).first<Row>();
 if(!room)throw new ApiError(404,'This room has closed. Create a new one.');
 if(host&&room.host_id!==uid)throw new ApiError(403,'Only the host can control the room.');
 const member=await db().prepare('SELECT user_id FROM members WHERE room_id = ? AND user_id = ?').bind(id,uid).first();
 if(!member)throw new ApiError(403,'Join this room first.');if(room.clan_id)await requireClan(String(room.clan_id),uid);return room;
}
async function roomView(room:Row){
 const [members,messages]=await Promise.all([
  db().prepare('SELECT m.*, p.name, p.color FROM members m JOIN profiles p ON p.user_id = m.user_id WHERE m.room_id = ? AND m.last_seen > ? ORDER BY m.user_id').bind(room.id,now()-15000).all<Row>(),
  db().prepare('SELECT m.id,m.body,m.created_at,p.name FROM messages m JOIN profiles p ON p.user_id = m.user_id WHERE m.room_id = ? ORDER BY m.created_at DESC LIMIT 50').bind(room.id).all<Row>(),
 ]);
 return {...room,config:JSON.parse(String(room.config)),members:members.results.map(m=>({...m,pose:JSON.parse(String(m.pose))})),messages:messages.results.reverse(),serverTime:now()};
}
async function normalizeConfig(v:unknown,uid:string):Promise<Config>{
 const c=(v&&typeof v==='object'?v:{}) as Record<string,unknown>;
 if(!MODES.some(m=>m.id===c.mode))throw new ApiError(400,'Choose a session type.');
 const supplied=c.track as Track|undefined;
 let track=DEMOS.find(t=>t.id===supplied?.id);
 if(!track){
  const row=await db().prepare('SELECT id,title,bpm,offset,duration,shared FROM tracks WHERE id = ? AND owner_id = ?').bind(str(supplied?.id,80),uid).first<Track>();
  if(!row||!row.shared)throw new ApiError(400,'Choose an original demo or a track you have enabled for room sharing.');track=row;
 }
 return {mode:c.mode as Config['mode'],minutes:DURATIONS.includes(Number(c.minutes))?Number(c.minutes):3,difficulty:['easy','steady','intense'].includes(String(c.difficulty))?c.difficulty as Config['difficulty']:'easy',seated:c.seated===true,calm:c.calm===true,noHold:c.noHold!==false,track,seed:crypto.getRandomValues(new Uint32Array(1))[0],world:WORLDS.find(w=>w.id===c.world)?.id??'temple',coach:c.coach==='none'?'none':COACHES.find(x=>x.id===c.coach)?.id??'nova',companions:Math.round(number(c.companions,0,2,2)),program:PROGRAMS.find(p=>p.id===c.program)?.id??'flow',presetId:PRESETS.find(p=>p.id===c.presetId)?.id,raveStyle:RAVE_STYLES.find(s=>s.id===c.raveStyle)?.id??'free'};
}
async function route(r:Request){
 const url=new URL(r.url),parts=url.pathname.replace(/^\/api\//,'').split('/'),uid=identity(r);
 if(r.method!=='GET'&&r.headers.get('sec-fetch-site')==='cross-site')throw new ApiError(403,'Open your studio to make changes.');
 await profile(uid);
 if(parts[0]==='clans')return clanRoute(r,parts,uid);
 if(parts[0]==='custom-missions')return customMissionRoute(r,parts,uid);
 if(parts[0]==='state'&&r.method==='GET'){
  const [p,t,s,clans]=await Promise.all([profile(uid),db().prepare('SELECT * FROM tracks WHERE owner_id = ? ORDER BY created_at DESC').bind(uid).all(),db().prepare('SELECT * FROM sessions WHERE owner_id = ? ORDER BY created_at DESC LIMIT 1000').bind(uid).all<Row>(),myClans(uid)]);
  return json({profile:p,tracks:t.results,sessions:s.results.map(sessionView),career:await careerState(uid),clans,serverTime:now()});
 }
 if(parts[0]==='missions'&&parts[1]&&r.method==='POST'){
  const mission=MISSIONS.find(m=>m.id===parts[1]);if(!mission)throw new ApiError(404,'Mission not found.');
  await db().prepare('INSERT OR IGNORE INTO missions (owner_id,mission_id,started_at) VALUES (?, ?, ?)').bind(uid,mission.id,now()).run();
  return json({career:await careerState(uid)});
 }
 if(parts[0]==='journeys'&&parts.length===2&&r.method==='POST'){
  const journey=JOURNEYS.find(j=>j.id===parts[1]);if(!journey)throw new ApiError(404,'Training path not found.');
  await db().prepare('INSERT OR IGNORE INTO journey_enrollments (owner_id,journey_id,next_step,started_at) VALUES (?, ?, 0, ?)').bind(uid,journey.id,now()).run();
  return json({career:await careerState(uid)});
 }
 if(parts[0]==='sessions'&&parts[1]&&parts[2]==='heart-rate'&&r.method==='DELETE'){
  const own=await db().prepare('SELECT id FROM sessions WHERE id = ? AND owner_id = ?').bind(parts[1],uid).first();if(!own)throw new ApiError(404,'Session not found.');
  await db().prepare('UPDATE sessions SET hr_summary = NULL WHERE id = ? AND owner_id = ?').bind(parts[1],uid).run();return json({removed:true});
 }
 if(parts[0]==='profile'&&r.method==='PATCH'){
  const p=await payload(r),name=str(p.name,28);if(!name)throw new ApiError(400,'Choose a name to use in rooms.');
  const color=['#c1a4ff','#d1fc74','#ff9aaf','#75d7ed'].includes(String(p.color))?p.color:'#c1a4ff';
  await db().prepare('UPDATE profiles SET name = ?,color = ?,move_goal = ?,session_goal = ?,mindful_goal = ? WHERE user_id = ?').bind(name,color,Math.round(number(p.move_goal,3,1000,60)),Math.round(number(p.session_goal,1,100,3)),Math.round(number(p.mindful_goal,3,500,18)),uid).run();
  return json({profile:await profile(uid)});
 }
 if(parts[0]==='sessions'&&r.method==='POST'){
  const p=await payload(r),id=str(p.id,80),mode=str(p.mode,20);if(!id||!MODES.some(m=>m.id===mode))throw new ApiError(400,'This session could not be saved.');
  const seconds=Math.floor(number(p.seconds,0,1800,0));if(seconds<1)throw new ApiError(400,'Complete at least a second before saving.');
  const total=Math.floor(number(p.total,0,15000,0)),hits=Math.floor(number(p.hits,0,total,0)),combo=Math.floor(number(p.combo,0,hits,0)),score=Math.floor(number(p.score,0,hits*150,0));
  const same=await db().prepare('SELECT owner_id FROM sessions WHERE id = ?').bind(id).first<Row>();if(same&&same.owner_id!==uid)throw new ApiError(409,'This session id is already in use.');
  if(same)return json({saved:true,id,session:sessionView((await db().prepare('SELECT * FROM sessions WHERE id = ? AND owner_id = ?').bind(id,uid).first<Row>())!),career:await careerState(uid)});
  const missionId=MISSIONS.find(m=>m.id===p.mission_id)?.id??null;
  if(missionId&&!await db().prepare('SELECT mission_id FROM missions WHERE owner_id = ? AND mission_id = ?').bind(uid,missionId).first())throw new ApiError(400,'Accept this mission before recording a mission session.');
  let roomId:string|null=null,runId:string|null=null;
  if(p.room_id&&p.run_id){const room=await db().prepare("SELECT r.* FROM rooms r JOIN members m ON m.room_id = r.id WHERE r.id = ? AND m.user_id = ? AND r.run_id = ? AND r.state IN ('running','ended') AND r.start_at < ? AND EXISTS (SELECT 1 FROM members other WHERE other.room_id = r.id AND other.user_id != ?)").bind(str(p.room_id,80),uid,str(p.run_id,80),now(),uid).first<Row>();if(room&&mode===JSON.parse(String(room.config)).mode&&seconds<=(now()-Number(room.start_at))/1000+5){roomId=String(room.id);runId=String(room.run_id);}}
  const summary=p.save_heart_rate===true?heartSummary(p.hr_summary):null;
  const clanId=p.share_clan_progress===true?str(p.clan_id,80)||null:null;if(clanId)await requireClan(clanId,uid);const created=now();
  let journeyId:string|null=null,journeyStep:number|null=null;
  const journey=JOURNEYS.find(j=>j.id===p.journey_id);
  if(p.journey_id){
   if(!journey||typeof p.journey_step!=='number'||!Number.isInteger(p.journey_step)||p.journey_step<0||p.journey_step>=journey.presets.length)throw new ApiError(400,'Choose a valid training path step.');
   const enrolled=await db().prepare('SELECT journey_id AS id,next_step,started_at,completed_at FROM journey_enrollments WHERE owner_id = ? AND journey_id = ?').bind(uid,journey.id).first<JourneyState>();if(!enrolled)throw new ApiError(400,'Start this training path before recording its sessions.');
   const step=p.journey_step,planned=PRESETS.find(x=>x.id===journey.presets[step])!;
   if(!enrolled.completed_at&&enrolled.next_step===step&&planned.mode===mode){journeyId=journey.id;journeyStep=step;}
  }
  let customMissionId:string|null=null;
  if(p.custom_mission_id){const goal=await requireCustomMission(str(p.custom_mission_id,80),uid);if(goal.clan_id)throw new ApiError(400,'Clan missions count opted-in clan contributions. Choose a personal mission for private progress.');if(!goal.archived_at&&!goal.completed_at)customMissionId=goal.id;}
  const raveStyle=mode==='rave'?(RAVE_STYLES.find(s=>s.id===p.rave_style)?.id??'free'):null;
  const writes=[db().prepare('INSERT OR IGNORE INTO sessions (id,owner_id,mode,seconds,hits,total,combo,score,device,completed,created_at,mission_id,preset_id,world,coach,seated,room_id,run_id,hr_summary,clan_id,journey_id,journey_step,custom_mission_id,rave_style) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id,uid,mode,seconds,hits,total,combo,score,p.device==='vr'?'vr':'desktop',p.completed===true?1:0,created,missionId,PRESETS.find(x=>x.id===p.preset_id)?.id??null,WORLDS.find(x=>x.id===p.world)?.id??null,p.coach==='none'?'none':COACHES.find(x=>x.id===p.coach)?.id??null,p.seated===true?1:0,roomId,runId,summary?JSON.stringify(summary):null,clanId,journeyId,journeyStep,customMissionId,raveStyle)];
  if(journey&&journeyId&&journeyStep!==null&&qualifiesJourneyStep(journey,journeyStep,{mode:mode as Config['mode'],seconds,completed:p.completed===true})){const planned=PRESETS.find(x=>x.id===journey.presets[journeyStep])!;writes.push(db().prepare('UPDATE journey_enrollments SET next_step = next_step + 1,completed_at = CASE WHEN next_step + 1 = ? THEN ? ELSE NULL END WHERE owner_id = ? AND journey_id = ? AND next_step = ? AND completed_at IS NULL AND EXISTS (SELECT 1 FROM sessions WHERE id = ? AND owner_id = ? AND journey_id = ? AND journey_step = ? AND mode = ? AND completed = 1 AND seconds >= ?)').bind(journey.presets.length,created,uid,journeyId,journeyStep,id,uid,journeyId,journeyStep,planned.mode,planned.minutes*60));}
  if(clanId)writes.push(db().prepare('INSERT OR IGNORE INTO clan_credits (session_id,clan_id,owner_id,seconds,mode,completed,created_at) SELECT id,clan_id,owner_id,seconds,mode,completed,created_at FROM sessions WHERE id = ? AND owner_id = ? AND clan_id = ?').bind(id,uid,clanId));await db().batch(writes);
  return json({saved:true,id,session:sessionView((await db().prepare('SELECT * FROM sessions WHERE id = ? AND owner_id = ?').bind(id,uid).first<Row>())!),career:await careerState(uid)});
 }
 if(parts[0]==='tracks'&&parts.length===1&&r.method==='POST'){
  const count=await db().prepare('SELECT COUNT(*) AS n FROM tracks WHERE owner_id = ?').bind(uid).first<{n:number}>();if((count?.n??0)>=60)throw new ApiError(400,'Your studio holds up to 60 tracks. Remove a track to add another.');
  const bytes=await limitedBytes(r,24*1024*1024),magic=new TextDecoder().decode(bytes.slice(0,12));
  const wav=magic.startsWith('RIFF')&&magic.slice(8,12)==='WAVE';
  const mp3=magic.startsWith('ID3')||(bytes[0]===255&&(bytes[1]&224)===224);
  if(!wav&&!mp3)throw new ApiError(400,'That file is not an MP3 or WAV.');
  const id=crypto.randomUUID(),mime=wav?'audio/wav':'audio/mpeg';let title='My track';try{title=str(decodeURIComponent(r.headers.get('x-track-title')??''),100,'My track');}catch{}
  const bpm=number(Number(r.headers.get('x-track-bpm')),60,200,128),duration=number(Number(r.headers.get('x-track-duration')),1,7200,180),shared=r.headers.get('x-track-shared')==='1'?1:0;
  await bucket().put('music/'+id,bytes,{httpMetadata:{contentType:mime}});
  try {await db().prepare('INSERT INTO tracks (id,owner_id,title,mime,size,duration,bpm,offset,shared,created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)').bind(id,uid,title||'My track',mime,bytes.length,duration,bpm,shared,now()).run();}catch(error){await bucket().delete('music/'+id);throw error;}
  return json({track:{id,title,bpm,duration,offset:0,shared,size:bytes.length,mime}},201);
 }
 if(parts[0]==='tracks'&&parts[1]&&r.method==='PATCH'){
  const p=await payload(r),track=await db().prepare('SELECT * FROM tracks WHERE id = ? AND owner_id = ?').bind(parts[1],uid).first<Row>();if(!track)throw new ApiError(404,'Track not found.');
  const used=await db().prepare("SELECT id FROM rooms WHERE json_extract(config,'$.track.id') = ? AND state != 'ended' AND expires_at > ?").bind(parts[1],now()).first();if(used)throw new ApiError(409,'Close the room using this track before editing it.');
  await db().prepare('UPDATE tracks SET title = ?,bpm = ?,offset = ?,shared = ? WHERE id = ? AND owner_id = ?').bind(str(p.title,100,String(track.title)),number(p.bpm,60,200,Number(track.bpm)),number(p.offset,-1,1,Number(track.offset)),typeof p.shared==='boolean'?(p.shared?1:0):track.shared,parts[1],uid).run();
  return json({track:await db().prepare('SELECT * FROM tracks WHERE id = ? AND owner_id = ?').bind(parts[1],uid).first()});
 }
 if(parts[0]==='tracks'&&parts[1]&&r.method==='DELETE'){
  const track=await db().prepare('SELECT id FROM tracks WHERE id = ? AND owner_id = ?').bind(parts[1],uid).first();if(!track)throw new ApiError(404,'Track not found.');
  const used=await db().prepare("SELECT id FROM rooms WHERE json_extract(config,'$.track.id') = ? AND state != 'ended' AND expires_at > ?").bind(parts[1],now()).first();if(used)throw new ApiError(409,'Close the room using this track before removing it.');
  await bucket().delete('music/'+parts[1]);await db().prepare('DELETE FROM tracks WHERE id = ? AND owner_id = ?').bind(parts[1],uid).run();return json({deleted:true});
 }
 if(parts[0]==='audio'&&parts[1]&&r.method==='GET'){
  const t=await db().prepare('SELECT * FROM tracks WHERE id = ?').bind(parts[1]).first<Row>();if(!t)throw new ApiError(404,'Track not found.');
  if(t.owner_id!==uid){const member=await db().prepare("SELECT m.user_id FROM members m JOIN rooms r ON r.id = m.room_id WHERE m.user_id = ? AND json_extract(r.config,'$.track.id') = ? AND r.expires_at > ?").bind(uid,parts[1],now()).first();if(!t.shared||!member)throw new ApiError(403,'This track is private.');}
  const head=await bucket().head('music/'+parts[1]);if(!head)throw new ApiError(404,'Audio is unavailable.');
  const range=r.headers.get('range');const match=range?.match(/^bytes=(\d*)-(\d*)$/);let offset=0,length=head.size,partial=false;
  if(range){if(!match) return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});
   if(match[1]){offset=Number(match[1]);const end=match[2]?Math.min(Number(match[2]),head.size-1):head.size-1;length=end-offset+1;}else if(match[2]){length=Math.min(Number(match[2]),head.size);offset=head.size-length;}else length=0;
   if(offset>=head.size||length<=0)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});partial=true;}
  const object=await bucket().get('music/'+parts[1],partial?{range:{offset,length}}:undefined);if(!object)throw new ApiError(404,'Audio is unavailable.');
  const headers=new Headers({'Content-Type':String(t.mime),'Cache-Control':'private, no-store','Accept-Ranges':'bytes','Content-Length':String(length),'X-Content-Type-Options':'nosniff'});
  if(partial)headers.set('Content-Range',`bytes ${offset}-${offset+length-1}/${head.size}`);return new Response(object.body,{status:partial?206:200,headers});
 }
 if(parts[0]==='rooms'&&parts.length===1&&r.method==='GET'){
  const rooms=await db().prepare("SELECT r.id,r.code,r.title,r.state,r.host_id,r.config,r.clan_id,p.name AS host_name,(SELECT COUNT(*) FROM members m WHERE m.room_id = r.id AND m.last_seen > ?) AS online FROM rooms r JOIN profiles p ON p.user_id = r.host_id WHERE r.expires_at > ? AND r.state != 'ended' AND (r.clan_id IS NULL OR EXISTS (SELECT 1 FROM clan_members cm WHERE cm.clan_id = r.clan_id AND cm.user_id = ?)) ORDER BY r.created_at DESC LIMIT 30").bind(now()-15000,now(),uid).all<Row>();
  return json({rooms:rooms.results.map(r=>({...r,config:JSON.parse(String(r.config))})),serverTime:now()});
 }
 if(parts[0]==='rooms'&&parts.length===1&&r.method==='POST'){
  const p=await payload(r),title=str(p.title,60);if(!title)throw new ApiError(400,'Give your room a name.');
  const active=await db().prepare("SELECT COUNT(*) AS n FROM rooms WHERE host_id = ? AND state != 'ended' AND expires_at > ?").bind(uid,now()).first<{n:number}>();if((active?.n??0)>=5)throw new ApiError(400,'Close one of your rooms before creating another.');
  const clanId=str(p.clan_id,80)||null;if(clanId)await requireClan(clanId,uid);const config=await normalizeConfig(p.config,uid),id=crypto.randomUUID(),code=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join('');
  await db().batch([
   db().prepare('INSERT INTO rooms (id,code,title,host_id,state,config,expires_at,created_at,clan_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id,code,title,uid,'lobby',JSON.stringify(config),now()+4*3600000,now(),clanId),
   db().prepare('INSERT INTO members (room_id,user_id,ready,last_seen,score,pose) VALUES (?, ?, 0, ?, 0, ?)').bind(id,uid,now(),'[]'),
  ]);return json({room:await roomView((await db().prepare('SELECT * FROM rooms WHERE id = ?').bind(id).first<Row>())!)},201);
 }
 if(parts[0]==='rooms'&&parts[1]==='join'&&r.method==='POST'){
  const p=await payload(r),code=str(p.code,6).toUpperCase();
  const room=await db().prepare("SELECT * FROM rooms WHERE code = ? AND expires_at > ? AND state != 'ended'").bind(code,now()).first<Row>();if(!room)throw new ApiError(404,'Room not found. Check the six-character code.');
  if(room.clan_id)await requireClan(String(room.clan_id),uid);
  const n=await db().prepare('SELECT COUNT(*) AS n FROM members WHERE room_id = ? AND last_seen > ? AND user_id != ?').bind(room.id,now()-15000,uid).first<{n:number}>();if((n?.n??0)>=12)throw new ApiError(409,'This room has 12 people. Try another room.');
  await db().prepare('INSERT INTO members (room_id,user_id,ready,last_seen,score,pose) VALUES (?, ?, 0, ?, 0, ?) ON CONFLICT(room_id,user_id) DO UPDATE SET last_seen = excluded.last_seen,ready = 0').bind(room.id,uid,now(),'[]').run();return json({room:await roomView(room)});
 }
 if(parts[0]==='rooms'&&parts[1]){
  const rid=parts[1],action=parts[2];
  if(r.method==='GET')return json({room:await roomView(await requireRoom(rid,uid))});
  if(r.method==='POST'&&action==='pulse'){
   const room=await requireRoom(rid,uid),p=await payload(r),pose=Array.isArray(p.pose)&&p.pose.length===9?p.pose.map(n=>number(n,-4,4,0)):[];
   await db().prepare('UPDATE members SET last_seen = ?,pose = ?,score = ? WHERE room_id = ? AND user_id = ?').bind(now(),JSON.stringify(pose),Math.round(number(p.score,0,1000000,0)),rid,uid).run();return json({room:await roomView(room)});
  }
  if(r.method==='POST'&&action==='ready'){
   const room=await requireRoom(rid,uid),p=await payload(r);await db().prepare('UPDATE members SET ready = ?,last_seen = ? WHERE room_id = ? AND user_id = ?').bind(p.ready===true?1:0,now(),rid,uid).run();return json({room:await roomView(room)});
  }
  if(r.method==='POST'&&action==='start'){
   const room=await requireRoom(rid,uid,true);if(room.state!=='lobby')throw new ApiError(409,'This room has already started.');
   const unready=await db().prepare('SELECT user_id FROM members WHERE room_id = ? AND last_seen > ? AND ready = 0').bind(rid,now()-15000).first();if(unready)throw new ApiError(409,'Everyone needs to enable audio and mark ready first.');
   await db().prepare("UPDATE rooms SET state = 'running',start_at = ?,run_id = ? WHERE id = ? AND state = 'lobby'").bind(now()+8000,crypto.randomUUID(),rid).run();return json({room:await roomView((await db().prepare('SELECT * FROM rooms WHERE id = ?').bind(rid).first<Row>())!)});
  }
  if(r.method==='POST'&&action==='end'){
   const room=await requireRoom(rid,uid,true);await db().prepare("UPDATE rooms SET state = 'ended' WHERE id = ?").bind(rid).run();return json({room:await roomView({...room,state:'ended'})});
  }
  if(r.method==='POST'&&action==='leave'){
   const room=await requireRoom(rid,uid);await db().prepare('DELETE FROM members WHERE room_id = ? AND user_id = ?').bind(rid,uid).run();if(room.host_id===uid)await db().prepare("UPDATE rooms SET state = 'ended' WHERE id = ?").bind(rid).run();return json({left:true});
  }
  if(r.method==='POST'&&action==='chat'){
   await requireRoom(rid,uid);const p=await payload(r),body=str(p.body,300);if(!body)throw new ApiError(400,'Write a message first.');
   const recent=await db().prepare('SELECT created_at FROM messages WHERE room_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1').bind(rid,uid).first<{created_at:number}>();if(recent&&now()-recent.created_at<1000)throw new ApiError(429,'Give your last message a moment.');
   await db().prepare('INSERT INTO messages (id,room_id,user_id,body,created_at) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(),rid,uid,body,now()).run();return json({sent:true});
  }
 }
 throw new ApiError(404,'This studio action was not found.');
}
async function handle(r:Request){try{return await route(r);}catch(e){if(e instanceof ApiError)return json({error:e.message},e.status);console.error('Pulse request failed',e);return json({error:'Your studio is temporarily unavailable. Please try again.'},503);}}
export const GET=handle;export const POST=handle;export const PATCH=handle;export const DELETE=handle;
