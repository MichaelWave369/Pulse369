/** R6 exchange envelope: portable, verified, music-free authored World Performance.
 * This validates data only; no identity claims, remote resources or active content.
 */
import {normalizePerformance,readPerformance,writePerformance} from './world-performance.mjs';
import {performanceBudgetReport} from './world-render-budget.mjs';
import {totalCounts} from './choreo-model.mjs';
export const BUNDLE_SCHEMA='pulse369.world-library-bundle.v1';
export const MAX_BUNDLE_BYTES=7_300_000;
export const LICENSES=Object.freeze(['personal','CC0-1.0','CC-BY-4.0']);
const text=(value,max,label,optional=false)=>{
 if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value)||
   (!optional&&!value.trim()))throw Error('Invalid '+label);
 return value.trim();
};
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(o,keys)=>isObject(o)&&Object.keys(o).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(o,k));
const encoded=x=>new TextEncoder().encode(x);
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export async function sha256(textValue){
 if(typeof textValue!=='string'||typeof crypto==='undefined'||!crypto.subtle)
  throw Error('Secure local Web Crypto is required for integrity verification');
 return hex(await crypto.subtle.digest('SHA-256',encoded(textValue)));
}
function metadata(input){
 if(!exact(input,['creator','description','license','tags']))throw Error('Invalid bundle metadata');
 const creator=text(input.creator,64,'creator alias',true);
 const description=text(input.description,240,'description',true);
 if(!LICENSES.includes(input.license))throw Error('Unknown sharing license');
 if(!Array.isArray(input.tags)||input.tags.length>5)throw Error('Too many tags');
 const tags=input.tags.map(tag=>text(tag,24,'tag'));
 if(new Set(tags.map(x=>x.toLowerCase())).size!==tags.length)throw Error('Duplicate tags');
 return {creator,description,license:input.license,tags};
}
export function previewManifest(show){
 const safe=normalizePerformance(show),budget=performanceBudgetReport(safe,'quest');
 return {
  title:safe.title,
  phrases:safe.chart.phrases.length,
  counts:totalCounts(safe.chart),
  bpm:safe.chart.bpm,
  scenes:safe.worlds.map(w=>({title:w.title,objects:w.workshop.objects.length})),
  questMaxTriangles:Math.max(...budget.worlds.map(x=>x.triangles)),
  questAutoCuts:budget.cuts
 };
}
export async function createBundle(raw,options={creator:'',description:'',license:'personal',tags:[]}){
 const show=normalizePerformance(raw),meta=metadata(options);
 const payload=writePerformance(show),digest=await sha256(payload);
 const bundle={schema:BUNDLE_SCHEMA,version:1,sha256:digest,metadata:meta,
  preview:previewManifest(show),performance:show};
 if(encoded(JSON.stringify(bundle)).length>MAX_BUNDLE_BYTES)throw Error('Bundle exceeds 7.3 MB');
 return bundle;
}
export async function readBundle(json){
 if(typeof json!=='string'||encoded(json).length>MAX_BUNDLE_BYTES)throw Error('Bundle exceeds 7.3 MB');
 let value;try{value=JSON.parse(json);}catch{throw Error('Invalid bundle JSON');}
 if(!exact(value,['schema','version','sha256','metadata','preview','performance'])||
  value.schema!==BUNDLE_SCHEMA||value.version!==1||
  typeof value.sha256!=='string'||!(/^[0-9a-f]{64}$/.test(value.sha256)))
  throw Error('Unsupported or invalid World Library bundle');
 const meta=metadata(value.metadata);
 const serialized=writePerformance(readPerformance(JSON.stringify(value.performance)));
 const digest=await sha256(serialized);
 if(digest!==value.sha256)throw Error('Bundle integrity check failed: the authored show was changed');
 const show=readPerformance(serialized),preview=previewManifest(show);
 if(JSON.stringify(value.preview)!==JSON.stringify(preview))throw Error('Bundle preview does not match the authored show');
 return {schema:BUNDLE_SCHEMA,version:1,sha256:digest,metadata:meta,preview,performance:show};
}
export function writeBundle(bundle){
 const json=JSON.stringify(bundle);
 if(encoded(json).length>MAX_BUNDLE_BYTES)throw Error('Bundle exceeds 7.3 MB');
 return json;
}
