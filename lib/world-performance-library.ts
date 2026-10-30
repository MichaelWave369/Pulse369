/** IndexedDB-only, explicit opt-in private library for validated R6 bundles.
 * No network requests, SDKs, service worker caching, automatic synchronization,
 * or user account integration. Browser eviction can still remove this data.
 */
import {readBundle,writeBundle,type WorldLibraryBundle,type BundleMetadata,type BundlePreview}
 from '../portal/world-library-bundle.mjs';
export interface LibraryRecord{
 id:string;createdAt:number;bytes:number;metadata:BundleMetadata;preview:BundlePreview;
}
type StoredRecord=LibraryRecord&{json:string};
const DB_NAME='pulse369-world-performance-library-v1';
const STORE='shows';
export const MAX_LIBRARY_SHOWS=12;
export const MAX_LIBRARY_TOTAL_BYTES=48_000_000;
function openDB():Promise<IDBDatabase>{
 if(typeof indexedDB==='undefined')return Promise.reject(Error('This browser does not support IndexedDB. Export your show instead.'));
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};
  request.onerror=()=>reject(Error('Local library could not open: '+(request.error?.message??'Browser storage denied')));
  request.onblocked=()=>reject(Error('Close other Pulse369 tabs to upgrade the local library.'));
  request.onsuccess=()=>resolve(request.result);
 });
}
async function withStore<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore,resolve:(value:T)=>void,reject:(reason:Error)=>void)=>void):Promise<T>{
 const db=await openDB();
 return new Promise<T>((resolve,reject)=>{
  let settled=false,output:T;
  const fail=(reason:Error)=>{if(!settled){settled=true;db.close();reject(reason);}};
  try{
   const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
   operation(store,(value:T)=>{output=value;},fail);
   tx.oncomplete=()=>{if(!settled){settled=true;db.close();resolve(output);}};
   tx.onerror=()=>fail(Error('Local library failed: '+(tx.error?.message??'IndexedDB error')));
   tx.onabort=()=>fail(Error('Local library transaction was cancelled or storage quota was exceeded.'));
  }catch(e){fail(e instanceof Error?e:Error('Local library operation failed'));}
 });
}
const readAll=()=>withStore<StoredRecord[]>('readonly',(store,resolve,reject)=>{
 const request=store.getAll();
 request.onsuccess=()=>resolve(request.result as StoredRecord[]);
 request.onerror=()=>reject(Error('Cannot read private world library.'));
});
const safeMeta=(r:StoredRecord):LibraryRecord=>({
 id:r.id,createdAt:r.createdAt,bytes:r.bytes,metadata:r.metadata,preview:r.preview
});
export async function listLibrary():Promise<LibraryRecord[]>{
 const records=await readAll();
 return records.map(safeMeta).sort((a,b)=>b.createdAt-a.createdAt);
}
export async function saveBundleToLibrary(input:WorldLibraryBundle):Promise<LibraryRecord>{
 // Verify schema and hash again before any persistent browser write.
 const verified=await readBundle(writeBundle(input));
 const json=writeBundle(verified),bytes=new TextEncoder().encode(json).byteLength;
 const id=verified.sha256;
 const existing=await readAll();
 const old=existing.find(r=>r.id===id);
 if(!old&&existing.length>=MAX_LIBRARY_SHOWS)throw Error('Local library is full (12 shows). Delete a copy or export it first.');
 if(existing.reduce((n,r)=>n+r.bytes,0)-(old?.bytes??0)+bytes>MAX_LIBRARY_TOTAL_BYTES)
  throw Error('Local library is at its 48 MB size limit. Export or delete a show before saving.');
 const record:StoredRecord={
  id,createdAt:old?.createdAt??Date.now(),bytes,json,
  metadata:verified.metadata,preview:verified.preview
 };
 await withStore<void>('readwrite',(store,_resolve,reject)=>{
  const request=store.put(record);
  request.onerror=()=>reject(Error('Could not save to this browser. Check free device space or private browsing settings.'));
 });
 return safeMeta(record);
}
export async function openLibraryBundle(id:string):Promise<WorldLibraryBundle>{
 if(typeof id!=='string'||!(/^[0-9a-f]{64}$/.test(id)))throw Error('Invalid local show ID');
 const record=await withStore<StoredRecord|undefined>('readonly',(store,resolve,reject)=>{
  const request=store.get(id);
  request.onsuccess=()=>resolve(request.result as StoredRecord|undefined);
  request.onerror=()=>reject(Error('Could not open the local show'));
 });
 if(!record)throw Error('That local show is no longer available');
 const bundle=await readBundle(record.json);
 if(bundle.sha256!==id)throw Error('Stored show ID does not match its content');
 return bundle;
}
export async function deleteLibraryBundle(id:string):Promise<void>{
 if(typeof id!=='string'||!(/^[0-9a-f]{64}$/.test(id)))throw Error('Invalid local show ID');
 await withStore<void>('readwrite',(store,_resolve,reject)=>{
  const request=store.delete(id);
  request.onerror=()=>reject(Error('Could not delete local show'));
 });
}
