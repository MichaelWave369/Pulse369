import type { Config } from './pulse';

export const CLAN_COLORS=['#c1a4ff','#d1fc74','#ff9aaf','#75d7ed'];
export type ClanSummary={id:string;code:string;name:string;description:string;leader_id:string;color:string;member_count:number;move_goal:number;mindful_goal:number;session_goal:number;timezone:string};
export type ClanMember={user_id:string;name:string;color:string;joined_at:number;active_seconds:number;mindful_seconds:number;sessions:number};
export type ClanRoom={id:string;code:string;title:string;state:string;host_name:string;online:number;config:Config;clan_id:string};
export type Clan=ClanSummary&{members:ClanMember[];messages:{id:string;name:string;body:string;created_at:number}[];rooms:ClanRoom[];week:{start:number;end:number;active_seconds:number;mindful_seconds:number;sessions:number};serverTime:number};

export function validTimezone(value:unknown){if(typeof value!=='string'||value.length>80)return false;try{new Intl.DateTimeFormat('en',{timeZone:value}).format();return true;}catch{return false;}}
// Derive one shared Monday boundary in the clan's chosen timezone, including DST.
export function weekStartInZone(time:number,zone:string){
 const dateParts=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(new Date(time));
 const values=Object.fromEntries(dateParts.map(p=>[p.type,p.value]));const day={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6}[values.weekday as 'Mon']??0;
 const wall=Date.UTC(Number(values.year),Number(values.month)-1,Number(values.day)-day);
 const format=new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 let utc=wall;for(let i=0;i<3;i++){const p=Object.fromEntries(format.formatToParts(new Date(utc)).map(p=>[p.type,p.value]));const represented=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);utc=wall-(represented-utc);}
 return utc;
}
