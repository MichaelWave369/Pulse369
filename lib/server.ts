import { env } from 'cloudflare:workers';

export class ApiError extends Error { constructor(public status:number,message:string){super(message);} }
export function db(){if(!env.DB)throw new ApiError(503,'Your studio is temporarily unavailable. Please try again.');return env.DB;}
export function bucket(){if(!env.BUCKET)throw new ApiError(503,'Music storage is temporarily unavailable.');return env.BUCKET;}
export function identity(r:Request){const id=r.headers.get('oai-authenticated-user-id');if(!id)throw new ApiError(401,'Sign in to save your music, goals, and sessions.');return id;}
export function str(v:unknown,max:number,fallback=''){return typeof v==='string'?v.trim().slice(0,max):fallback;}
export function number(v:unknown,min:number,max:number,fallback:number){return typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;}
export function json(v:unknown,status=200){return Response.json(v,{status,headers:{'Cache-Control':'no-store'}});}
export async function profile(id:string){
 const existing=await db().prepare('SELECT * FROM profiles WHERE user_id = ?').bind(id).first();
 if(existing)return existing;
 await db().prepare('INSERT OR IGNORE INTO profiles (user_id,name,color,move_goal,session_goal,mindful_goal,created_at) VALUES (?, ?, ?, 60, 3, 18, ?)').bind(id,'Dancer','#c1a4ff',Date.now()).run();
 return db().prepare('SELECT * FROM profiles WHERE user_id = ?').bind(id).first();
}
export async function payload(r:Request):Promise<Record<string,unknown>> {try {return await r.json();}catch{throw new ApiError(400,'Please check the information and try again.');}}
export async function limitedBytes(r:Request,max:number){
 const length=Number(r.headers.get('content-length')||0);if(length>max)throw new ApiError(413,'Choose an MP3 or WAV under 24 MB.');
 if(!r.body)throw new ApiError(400,'Choose an audio file.');
 const reader=r.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new ApiError(413,'Choose an MP3 or WAV under 24 MB.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}return bytes;
}
