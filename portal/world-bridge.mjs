/** Pulse369 WorldBridge R1.
 * Accepts portable Domistika XR workshop / Showpack v1 JSON, locally.
 * No executable input, network fetches, URLs, movement scoring, or backend writes.
 */
export const WORLD_SCHEMA = 'pulse369.worldpack.v1';
export const SHOW_SCHEMA = 'domistika.xr.showpack.v1';
export const WORKSHOP_SCHEMA = 'domistika.xr.workshop.v1';
export const MAX_FILE_BYTES = 2_250_000;
export const MAX_OBJECTS = 48;
export const MAX_MESH_TRIANGLES = 6000;
export const PALETTES = ['outrun','aurora','ember','ice'];
const KINDS = ['box','sphere','cylinder','torus','tube','mesh'];
const BANDS = ['full','bass','mid','high','beat'];
const MODES = ['none','spin','bob','orbit','pulse'];
const isObj = o => o !== null && typeof o === 'object' && !Array.isArray(o);
const exact = (o, allowed, required = []) => isObj(o) && Object.keys(o).every(k => allowed.includes(k)) && required.every(k => Object.hasOwn(o,k));
const fail = message => { throw new Error(message); };
const num = (v,lo,hi,label) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : fail('Invalid ' + label);
const vec = (v,n,lo,hi,label) => Array.isArray(v) && v.length === n ? v.map(x => num(x,lo,hi,label)) : fail('Invalid ' + label);
const str = (v,max,label) => typeof v === 'string' && v.trim() && v.length <= max ? v : fail('Invalid ' + label);

function validateMotion(input) {
  if(input === null || input === undefined) return null;
  if(!exact(input,['mode','speed','amplitude','phase','band'],['mode','speed','amplitude','phase']) || !MODES.includes(input.mode))
    fail('Invalid motion');
  const band = input.band ?? 'full';
  if(!BANDS.includes(band)) fail('Invalid motion band');
  return {mode:input.mode,speed:num(input.speed,.1,3,'motion speed'),
    amplitude:num(input.amplitude,0,1.5,'motion amplitude'),phase:num(input.phase,0,Math.PI*2,'motion phase'),band};
}
function validateObject(input) {
  if(!exact(input,['id','name','kind','color','position','rotation','scale','dimensions','source','mirroredX','motion','positions'],
    ['id','name','kind','color','position','rotation','scale'])) fail('Invalid workshop object keys');
  if(typeof input.id !== 'string' || !/^work-[a-z0-9-]{4,65}$/.test(input.id)) fail('Invalid object ID');
  if(typeof input.name !== 'string' || input.name.length > 65) fail('Invalid object name');
  if(!KINDS.includes(input.kind)) fail('Invalid object kind');
  if(typeof input.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(input.color)) fail('Invalid object color');
  if(typeof (input.mirroredX ?? false) !== 'boolean') fail('Invalid mirror flag');
  let source = null;
  if(input.source != null) {
    if(!exact(input.source,['app','ref'],['app','ref']) ||
      !['FramefieldStudio','OpenBlueprintStudio'].includes(input.source.app) ||
      typeof input.source.ref !== 'string' || input.source.ref.length > 80) fail('Invalid source label');
    source = {app:input.source.app,ref:input.source.ref};
  }
  const result = {id:input.id,name:input.name,kind:input.kind,color:input.color.toLowerCase(),
    position:vec(input.position,3,-25,25,'position'),rotation:vec(input.rotation,3,-Math.PI*8,Math.PI*8,'rotation'),
    scale:vec(input.scale,3,.1,8,'scale'),dimensions:vec(input.dimensions ?? [.6,.6,.6],3,.02,30,'dimensions'),
    source,mirroredX:input.mirroredX ?? false,motion:validateMotion(input.motion)};
  if(input.kind === 'mesh') {
    if(!Array.isArray(input.positions) || input.positions.length < 9 || input.positions.length > 10800 ||
       input.positions.length % 9 !== 0) fail('Invalid mesh triangles');
    result.positions = input.positions.map(x => num(x,-30,30,'mesh position'));
  } else if(Object.hasOwn(input,'positions')) fail('Unexpected mesh data');
  return result;
}
export function validateWorkshop(workshop) {
  if(!exact(workshop,['schema','objects'],['schema','objects']) ||
     workshop.schema !== WORKSHOP_SCHEMA || !Array.isArray(workshop.objects) ||
     workshop.objects.length > MAX_OBJECTS) fail('Unsupported or oversized workshop');
  const objects = workshop.objects.map(validateObject);
  if(new Set(objects.map(o => o.id)).size !== objects.length) fail('Duplicate object ID');
  const triangles = objects.reduce((n,o) => n + (o.kind === 'mesh' ? o.positions.length / 9 : 0),0);
  if(triangles > MAX_MESH_TRIANGLES) fail('Mesh triangle budget exceeded');
  if(JSON.stringify({schema:WORKSHOP_SCHEMA,objects}).length > 2_000_000) fail('Workshop exceeds 2 MB');
  return {schema:WORKSHOP_SCHEMA,objects};
}
export function validateShow(show) {
  if(!exact(show,['title','cues'],['title','cues']) || !Array.isArray(show.cues) ||
    show.cues.length < 1 || show.cues.length > 8) fail('Invalid Showrunner show');
  const title = str(show.title,65,'show title');
  const cues = show.cues.map((cue,i) => {
    if(!exact(cue,['title','duration','palette','gain','energy'],['title','duration','palette','gain','energy']) ||
      !PALETTES.includes(cue.palette) || !Number.isInteger(cue.duration) ||
      cue.duration < 4 || cue.duration > 120) fail('Invalid cue ' + (i+1));
    return {title:str(cue.title,45,'cue title'),duration:cue.duration,palette:cue.palette,
      gain:num(cue.gain,0,1.5,'cue gain'),energy:num(cue.energy,.25,1.5,'cue energy')};
  });
  return {title,cues};
}
const defaultShow = {title:'Domistika workshop preview',cues:[{title:'Visual preview',duration:60,palette:'aurora',gain:.7,energy:1}]};
export function validateWorldPack(pack) {
  if(!exact(pack,['schema','version','title','source','workshop','show'],
    ['schema','version','title','source','workshop','show']) ||
    pack.schema !== WORLD_SCHEMA || pack.version !== 1 ||
    !exact(pack.source,['app','schema'],['app','schema']) ||
    pack.source.app !== 'Domistika XR' ||
    ![SHOW_SCHEMA,WORKSHOP_SCHEMA].includes(pack.source.schema)) fail('Unsupported Pulse worldpack');
  const workshop = validateWorkshop(pack.workshop);
  const show = validateShow(pack.show);
  const title = str(pack.title,65,'world title');
  return {schema:WORLD_SCHEMA,version:1,title,source:{app:'Domistika XR',schema:pack.source.schema},workshop,show};
}
/** Returns a NEW validated value. Callers retain the last good scene on errors. */
export function readWorldFile(text) {
  if(typeof text !== 'string' || text.length > MAX_FILE_BYTES) fail('World file exceeds 2.25 MB');
  let input;
  try { input = JSON.parse(text); } catch { fail('Invalid JSON'); }
  if(!isObj(input)) fail('Expected a JSON object');
  if(input.schema === WORLD_SCHEMA) return validateWorldPack(input);
  if(input.schema === SHOW_SCHEMA) {
    if(!exact(input,['schema','app','version','show','workshop'],['schema','app','version','show','workshop']) ||
       input.app !== 'Domistika XR' || input.version !== '1.0') fail('Invalid Domistika Showpack');
    const show = validateShow(input.show);
    return validateWorldPack({schema:WORLD_SCHEMA,version:1,title:show.title,
      source:{app:'Domistika XR',schema:SHOW_SCHEMA},workshop:input.workshop,show});
  }
  if(input.schema === WORKSHOP_SCHEMA) return validateWorldPack({
    schema:WORLD_SCHEMA,version:1,title:defaultShow.title,source:{app:'Domistika XR',schema:WORKSHOP_SCHEMA},
    workshop:input,show:defaultShow});
  fail('Select a Domistika XR Showpack or workshop JSON file');
}
export function writeWorldPack(pack) {
  const text = JSON.stringify(validateWorldPack(pack));
  if(text.length > MAX_FILE_BYTES) fail('Worldpack exceeds 2.25 MB');
  return text;
}
export function activeCue(show,elapsed) {
  const cues = validateShow(show).cues;
  const total = cues.reduce((n,c) => n+c.duration,0);
  let t = ((Math.max(0,elapsed)%total)+total)%total;
  for(const cue of cues) {if(t < cue.duration) return cue; t-=cue.duration;}
  return cues.at(-1);
}
export const SAMPLE_WORLD = readWorldFile(JSON.stringify({
  schema:SHOW_SCHEMA,app:'Domistika XR',version:'1.0',
  show:{title:'Pulse Portal · Sample',cues:[
    {title:'Arrival',duration:12,palette:'aurora',gain:.5,energy:.65},
    {title:'Flow',duration:18,palette:'outrun',gain:.85,energy:1},
    {title:'Finale',duration:14,palette:'ember',gain:.9,energy:1.1}]},
  workshop:{schema:WORKSHOP_SCHEMA,objects:Array.from({length:9},(_,i) => ({
    id:'work-pulse'+String(i).padStart(4,'0'),name:'Pulse ring '+(i+1),kind:'torus',
    color:i%2?'#bb8cff':'#70e6da',position:[(i%3-1)*1.8,1.5,Math.floor(i/3)*-1.8],
    rotation:[0,0,i*.23],scale:[1,1,1],dimensions:[1.4,1.4,.4],source:null,mirroredX:false,
    motion:{mode:'pulse',speed:1,amplitude:.28,phase:i*.3,band:i%2?'bass':'beat'}
  }))}}));
