import test from 'node:test';import assert from 'node:assert/strict';
import {starterChart} from './choreo-model.mjs';
import {SAMPLE_WORLD} from './world-bridge.mjs';
import {createPerformance} from './world-performance.mjs';
import {createBundle,readBundle,writeBundle,previewManifest,sha256} from './world-library-bundle.mjs';
const show=createPerformance(starterChart(),[SAMPLE_WORLD]);
test('R6 local bundle roundtrip includes only verified creative content and a preview',async()=>{
 const bundle=await createBundle(show,{creator:'Local Artist',description:'Made at home',license:'CC-BY-4.0',tags:['rave','world']});
 const restored=await readBundle(writeBundle(bundle));
 assert.deepEqual(restored,bundle);
 assert.equal(restored.preview.phrases,4);
 assert.equal(restored.preview.scenes[0].objects,9);
 assert.equal(restored.sha256.length,64);
 assert.equal(JSON.stringify(bundle).includes('audioFile'),false);
 assert.equal(JSON.stringify(bundle).includes('trackId'),false);
 assert.deepEqual(previewManifest(show),bundle.preview);
});
test('R6 rejects altered creator metadata, scene data, preview, and unsafe licenses',async()=>{
 const bundle=await createBundle(show);
 const modified=structuredClone(bundle);modified.performance.worlds[0].workshop.objects[0].name='Tampered';
 await assert.rejects(readBundle(writeBundle(modified)),/integrity/);
 const preview=structuredClone(bundle);preview.preview.bpm=999;
 await assert.rejects(readBundle(writeBundle(preview)),/preview/);
 const unsafe=structuredClone(bundle);unsafe.metadata.license='<script>';
 await assert.rejects(readBundle(writeBundle(unsafe)),/license/);
 const added=structuredClone(bundle);added.remoteUrl='https://somewhere';
 await assert.rejects(readBundle(writeBundle(added)),/invalid World Library/);
 assert.equal(await sha256('hello'), '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});
test('R6 blocks oversized and foreign bundles and keeps all creator data opt-in',async()=>{
 await assert.rejects(readBundle('x'.repeat(7_300_001)),/7.3 MB/);
 await assert.rejects(readBundle('{}'),/invalid World Library/);
 await assert.rejects(createBundle(show,{creator:'',description:'',license:'personal',tags:['bad','BAD']}),/Duplicate/);
});
