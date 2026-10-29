import test from 'node:test';
import assert from 'node:assert/strict';
import {fitWorldBackdrop} from './world-stage-layout.mjs';
test('far background stays behind the z=-8 target approach corridor',()=>{
  for(const b of [
    {min:[-1,0,-2],max:[1,3,2]},
    {min:[-600,-100,-800],max:[800,300,900]},
    {min:[0,0,0],max:[0,0,0]},
    {min:[-25,-25,-25],max:[25,25,25]}
  ]){
    const fit=fitWorldBackdrop(b);
    assert.ok(fit.maxZ <= -14+1e-5);
    assert.ok(fit.width<=24+1e-5&&fit.height<=12+1e-5&&fit.depth<=12+1e-5);
  }
});
test('rejects NaN, infinities and inverted boxes',()=>{
  for(const bounds of [
    {min:[0,0,0],max:[Infinity,1,1]},
    {min:[2,2,2],max:[1,3,3]},
    {min:[0,NaN,0],max:[2,2,2]},
    {min:[0,0],max:[1,1,1]}
  ])assert.throws(()=>fitWorldBackdrop(bounds));
});
