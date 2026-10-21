import { DANCE_STYLES, danceMove } from './dance-core.mjs';

/**
 * DanceFlow R2 chart contract. Explicitly allowlisted, portable, locally authored.
 * A chart contains movement directions, never music bytes, account information,
 * tracked body positions, identities, health stats or performance history.
 */
export const CHART_SCHEMA = 'pulse369.choreography.v1';
export const MAX_CHART_BYTES = 65536;
export const MAX_PHRASES = 16;
export const MAX_REPEATS = 4;
export const MAX_COUNTS = MAX_PHRASES * MAX_REPEATS * 8;
export const STYLES = Object.freeze(Object.keys(DANCE_STYLES));

function cleanText(value,max,field) {
  if (typeof value !== 'string') throw new Error(field+' must be text.');
  const s=value.replace(/[\u0000-\u001f\u007f]/g,'').trim();
  if(!s || s.length>max) throw new Error(field+' must be 1–'+max+' characters.');
  return s;
}
function integer(value,lo,hi,label) {
  if(!Number.isInteger(value)||value<lo||value>hi)
    throw new Error(label+' must be an integer from '+lo+' to '+hi+'.');
  return value;
}
export function makeStep(style='groove',moveIndex=0,mirror=false) {
  if (!STYLES.includes(style)) throw new Error('Unknown dance style.');
  integer(moveIndex,0,7,'Move index');
  if(typeof mirror!=='boolean') throw new Error('Mirror must be true or false.');
  return {style,moveIndex,mirror};
}
export function phraseFromStyle(style='groove',name,repeat=1) {
  if(!STYLES.includes(style))throw new Error('Unknown style.');
  return {
    name:name || DANCE_STYLES[style].name,
    repeat,
    steps:Array.from({length:8},(_,i)=>makeStep(style,i,false))
  };
}
export function starterChart() {
  return {
    schema:CHART_SCHEMA,title:'MY DANCEFLOW MIX',bpm:112,offsetMs:0,
    phrases:[
      phraseFromStyle('groove','OPENING GROOVE'),
      phraseFromStyle('funk','FUNK BREAK'),
      phraseFromStyle('disco','DISCO LIFT'),
      phraseFromStyle('groove','FINAL GROOVE')
    ]
  };
}
export function normalizeChart(input) {
  if(!input || typeof input!=='object' || Array.isArray(input))throw new Error('Chart must be a JSON object.');
  if(input.schema!==CHART_SCHEMA)throw new Error('Unsupported chart schema.');
  const title=cleanText(input.title,64,'Title');
  const bpm=integer(input.bpm,60,180,'Manual BPM');
  const offsetMs=integer(input.offsetMs,0,1000,'Manual offset');
  if(!Array.isArray(input.phrases)||input.phrases.length<1||input.phrases.length>MAX_PHRASES)
    throw new Error('A chart needs 1–'+MAX_PHRASES+' phrases.');
  const phrases=input.phrases.map((p,i)=>{
    if(!p || typeof p!=='object'||Array.isArray(p))throw new Error('Phrase '+(i+1)+' is invalid.');
    const name=cleanText(p.name,40,'Phrase '+(i+1)+' name');
    const repeat=integer(p.repeat,1,MAX_REPEATS,'Phrase repeat');
    if(!Array.isArray(p.steps)||p.steps.length!==8)
      throw new Error('Phrase '+(i+1)+' needs exactly eight counts.');
    const steps=p.steps.map((step,j)=>{
      if(!step||typeof step!=='object'||Array.isArray(step))throw new Error('Count '+(j+1)+' is invalid.');
      return makeStep(step.style,step.moveIndex,step.mirror);
    });
    return {name,repeat,steps};
  });
  return {schema:CHART_SCHEMA,title,bpm,offsetMs,phrases};
}
export function encodeChart(input) {
  return JSON.stringify(normalizeChart(input),null,2)+'\n';
}
export function parseChart(json) {
  if(typeof json!=='string' || new TextEncoder().encode(json).byteLength>MAX_CHART_BYTES)
    throw new Error('Chart must be JSON under 64 KiB.');
  let raw;
  try {raw=JSON.parse(json);}catch{throw new Error('Invalid JSON choreography file.');}
  return normalizeChart(raw);
}
export function totalCounts(chart) {
  return chart.phrases.reduce((sum,p)=>sum+p.repeat*8,0);
}
export function cueForCount(chart,count) {
  if(!chart||!Number.isInteger(count)||count<0 || count>=totalCounts(chart))return null;
  let remaining=count;
  for(let phraseIndex=0;phraseIndex<chart.phrases.length;phraseIndex++){
    const phrase=chart.phrases[phraseIndex],length=phrase.repeat*8;
    if(remaining>=length){remaining-=length;continue;}
    const step=phrase.steps[remaining%8];
    const original=danceMove(step.style,step.moveIndex);
    if(!original)return null;
    const hands=original.hands.map(h=>step.mirror?{
      side:h.side==='left'?'right':'left',x:-h.x,y:h.y,z:h.z
    }:{side:h.side,x:h.x,y:h.y,z:h.z});
    return {
      phraseIndex,phraseName:phrase.name,phraseRepeat:Math.floor(remaining/8)+1,
      beat:remaining%8+1,style:step.style,moveIndex:step.moveIndex,mirror:step.mirror,
      name:step.mirror?'MIRROR · '+original.name:original.name,
      coach:step.mirror?'Mirror the hand targets. Keep a comfortable range.':original.coach,
      hands
    };
  }
  return null;
}
export function loopingCue(chart,count) {
  const total=totalCounts(chart);
  if(!Number.isInteger(count)||count<0||!total)return null;
  return cueForCount(chart,count%total);
}
export function replaceStep(chart,phraseIndex,countIndex,step) {
  const safe=normalizeChart(chart);
  integer(phraseIndex,0,safe.phrases.length-1,'Phrase index');
  integer(countIndex,0,7,'Count index');
  safe.phrases[phraseIndex].steps[countIndex]=makeStep(step.style,step.moveIndex,step.mirror);
  return safe;
}
export function replacePhrase(chart,index,changes) {
  const safe=normalizeChart(chart);
  integer(index,0,safe.phrases.length-1,'Phrase index');
  const previous=safe.phrases[index];
  safe.phrases[index]={...previous,...changes};
  return normalizeChart(safe);
}
export function addPhrase(chart,style='groove',index) {
  const safe=normalizeChart(chart);
  if(safe.phrases.length>=MAX_PHRASES)throw new Error('The maximum is 16 phrases.');
  const at=index===undefined?safe.phrases.length:integer(index,0,safe.phrases.length,'Insert index');
  safe.phrases.splice(at,0,phraseFromStyle(style));
  return safe;
}
export function duplicatePhrase(chart,index) {
  const safe=normalizeChart(chart);
  integer(index,0,safe.phrases.length-1,'Phrase index');
  if(safe.phrases.length>=MAX_PHRASES)throw new Error('The maximum is 16 phrases.');
  const copy=JSON.parse(JSON.stringify(safe.phrases[index]));
  copy.name=copy.name.slice(0,32)+' COPY';
  safe.phrases.splice(index+1,0,copy);
  return normalizeChart(safe);
}
export function deletePhrase(chart,index) {
  const safe=normalizeChart(chart);
  integer(index,0,safe.phrases.length-1,'Phrase index');
  if(safe.phrases.length===1)throw new Error('Keep at least one phrase.');
  safe.phrases.splice(index,1);
  return safe;
}
export function movePhrase(chart,index,delta) {
  const safe=normalizeChart(chart);
  integer(index,0,safe.phrases.length-1,'Phrase index');
  if(![-1,1].includes(delta))throw new Error('Move direction must be -1 or +1.');
  const next=index+delta;
  if(next<0||next>=safe.phrases.length)return safe;
  const [phrase]=safe.phrases.splice(index,1);
  safe.phrases.splice(next,0,phrase);
  return safe;
}
export function trackLengthError(chart,durationSeconds) {
  const safe=normalizeChart(chart);
  const needed=safe.offsetMs/1000+totalCounts(safe)*60/safe.bpm+.5;
  if(!Number.isFinite(durationSeconds)||durationSeconds<needed)
    return 'Track is too short. Need at least '+Math.ceil(needed)+' seconds for this chart and offset.';
  return null;
}
export function chartPreviewReceipt(chart,mode,displayedCounts) {
  const safe=normalizeChart(chart);
  const counts=Number.isInteger(displayedCounts)?Math.max(0,Math.min(totalCounts(safe),displayedCounts)):0;
  return {
    schema:'pulse369.choreo-preview.v1',provenance:'SCREEN_DEMONSTRATION_UNVERIFIED',
    manualBpm:safe.bpm,phrases:safe.phrases.length,totalCounts:totalCounts(safe),
    displayedCounts:counts,musicMode:mode==='local'?'local-file-not-uploaded':'synth-guide',
    limits:'No body, controller, dance quality or fitness measurement. Chart and music were not uploaded.'
  };
}
