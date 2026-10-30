import test from 'node:test';import assert from 'node:assert/strict';
import {SAMPLE_WORLD} from './world-bridge.mjs';
import {starterChart} from './choreo-model.mjs';
import {createPerformance} from './world-performance.mjs';
import {estimateWorldCost,sceneTransitionPolicy,performanceBudgetReport,RENDER_BUDGETS} from './world-render-budget.mjs';
const object=SAMPLE_WORLD.workshop.objects[0];
const dense={...SAMPLE_WORLD,title:'Dense torus knots',workshop:{...SAMPLE_WORLD.workshop,
  objects:Array.from({length:48},(_,i)=>({...object,id:'work-r5-'+String(i).padStart(5,'0'),name:'Knot '+i,kind:'tube',dimensions:[1,1,1]}))}};
test('estimate counts rendered primitive triangles, not just imported mesh triangles',()=>{
 const desktop=estimateWorldCost(dense,'desktop'),quest=estimateWorldCost(dense,'quest');
 assert.equal(desktop.triangles,48*1024);assert.equal(quest.triangles,48*480);
 assert.equal(desktop.draws,48);assert.equal(quest.draws,48);
 assert.ok(quest.triangles<RENDER_BUDGETS.quest.maxSingleTriangles);
});
test('safe cuts are chosen before allocating two dense Quest scenes',()=>{
 const p=sceneTransitionPolicy([dense,dense],0,1,'quest');
 assert.equal(p.crossfade,false);assert.equal(p.reason,'crossfade-over-budget');
 assert.equal(sceneTransitionPolicy([dense,dense],0,1,'desktop').crossfade,true);
 assert.equal(sceneTransitionPolicy([SAMPLE_WORLD,SAMPLE_WORLD],0,1,'quest').crossfade,true);
 assert.equal(sceneTransitionPolicy([dense],0,0,'quest').reason,'same-scene');
});
test('repeatable performance diagnostics and invalid tier / mesh fail closed',()=>{
 const show=createPerformance(starterChart(),[SAMPLE_WORLD,dense]);
 const report=performanceBudgetReport(show,'quest');
 assert.ok(report.cuts>0);assert.equal(report.worlds.length,2);
 assert.throws(()=>estimateWorldCost(SAMPLE_WORLD,'ultra'));
 assert.throws(()=>estimateWorldCost({...SAMPLE_WORLD,workshop:{objects:[{kind:'mesh',positions:[1,2]}]}},'quest'));
 assert.throws(()=>sceneTransitionPolicy([SAMPLE_WORLD],0,1,'quest'));
});
