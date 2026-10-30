import test from 'node:test';import assert from 'node:assert/strict';
import {CHECKLIST,createAcceptanceRecorder} from './world-acceptance.mjs';
import {readAcceptanceReceipt,compareAcceptanceReceipts,writeAcceptanceComparison}
 from './world-acceptance-compare.mjs';
const checklist=Object.fromEntries(CHECKLIST.map(k=>[k,false]));
function run(hz=72,seconds=38,gaps=0,phrases=2){
 const recorder=createAcceptanceRecorder();recorder.start();
 const length=Math.ceil(hz*seconds);
 let time=1000;
 for(let i=0;i<length;i++){
  const step=1000/hz+(gaps>0&&i%250===0&&i>0?300:0);
  time+=step;
  recorder.capture({timeMs:time,xrPresenting:true,calls:12,triangles:6000,
   activeStages:1,phraseIndex:Math.floor(i/(length/phrases)),reason:'single-stage'});
 }
 recorder.stop();return recorder.receipt(checklist);
}
test('R8 parses authentic R7 receipt and rejects unknown personal-data keys',()=>{
 const receipt=run();
 assert.deepEqual(readAcceptanceReceipt(JSON.stringify(receipt)),receipt);
 const extra=structuredClone(receipt);extra.deviceId='private';assert.throws(()=>readAcceptanceReceipt(JSON.stringify(extra)),/format/);
 const altered=structuredClone(receipt);altered.measurements.estimatedCallbackHz=Infinity;
 assert.throws(()=>readAcceptanceReceipt(JSON.stringify(altered)),/measurements/);
 const fake=structuredClone(receipt);fake.measurements.xrObserved=false;
 assert.throws(()=>readAcceptanceReceipt(JSON.stringify(fake)),/measurements/);
 assert.throws(()=>readAcceptanceReceipt('x'.repeat(24001)),/24 KB/);
});
test('R8 computes callback deltas but refuses a verdict without matched conditions',()=>{
 const a=run(72),b=run(60);
 const neutral=compareAcceptanceReceipts(a,b);
 assert.equal(neutral.comparable,false);assert.equal(neutral.interpretation,'NOT_COMPARABLE');
 assert.equal(neutral.fields[0].delta>0,true);
 const compared=compareAcceptanceReceipts(a,b,true);
 assert.equal(compared.comparable,true);assert.equal(compared.interpretation,'POSSIBLE_REGRESSION_REVIEW');
 assert.equal(compared.flags.length>0,true);
 assert.equal(JSON.parse(writeAcceptanceComparison(compared)).source,'TWO_USER_SUPPLIED_UNVERIFIED_R7_RECEIPTS');
 assert.equal(writeAcceptanceComparison(compared).includes('userAgent'),false);
});
test('R8 comparable identical runs do not assert certified performance',()=>{
 const a=run(),b=run();
 const diff=compareAcceptanceReceipts(a,b,true);
 assert.equal(diff.comparable,true);assert.equal(diff.interpretation,'NO_LARGE_CALLBACK_REGRESSION_DETECTED');
 assert.ok(diff.disclaimer.includes('not GPU'));
});
test('R8 mismatched phrases, short runs and malformed data cannot claim comparable',()=>{
 const a=run(72,40,0,2),b=run(72,40,0,3),c=run(72,8,0,2);
 assert.equal(compareAcceptanceReceipts(a,b,true).comparable,false);
 assert.equal(compareAcceptanceReceipts(a,c,true).comparable,false);
 assert.throws(()=>compareAcceptanceReceipts(a,b,'yes'),/conditions/);
 const t=structuredClone(a);t.measurements.callbackFrames=0;
 assert.throws(()=>compareAcceptanceReceipts(t,b,true),/measurements/);
});
