import test from 'node:test';
import assert from 'node:assert/strict';
import {LESSONS,LESSON_IDS,ACADEMY_BPMS,ACADEMY_MINUTES,academyPlan,academyCue,academyExportChart,academyReceipt} from './dance-academy.mjs';
import {parseChart,encodeChart,totalCounts} from './choreo-model.mjs';

test('three authored eight-count lessons use grounded in-place positions',()=>{
  assert.deepEqual(LESSON_IDS,['house','funk','disco']);
  for(const key of LESSON_IDS){
    const lesson=LESSONS[key];
    assert.equal(lesson.counts.length,8);
    for(const move of lesson.counts){
      for(const field of ['label','standing','seated','tip'])assert.ok(move[field].length>8);
      assert.ok(['left','right','both'].includes(move.focus));
      for(const side of ['left','right']){
        const p=move.feet[side];
        assert.ok(Math.abs(p.x)<=.3 && Math.abs(p.z)<=.1);
      }
    }
  }
});
test('session partitions are exact at 2,4,6 minutes and each tempo',()=>{
  for(const id of LESSON_IDS)for(const bpm of ACADEMY_BPMS)for(const minutes of ACADEMY_MINUTES){
    const plan=academyPlan(id,bpm,minutes);
    assert.ok(plan);
    assert.ok(Math.abs(plan.durationSeconds-minutes*60)<5);
    assert.equal(plan.segments[0].start,0);
    assert.equal(plan.segments.at(-1).end,plan.total);
    assert.ok(plan.segments.every((b,i)=>b.counts>=16&&b.counts%8===0&&(i===0||b.start===plan.segments[i-1].end)));
    for(let i=0;i<plan.total;i++){
      const standing=academyCue(plan,i,'standing');
      const seated=academyCue(plan,i,'seated');
      assert.equal(standing.globalCount,i+1);
      assert.equal(seated.seated,true);
      assert.equal(standing.seated,false);
      assert.equal(standing.illustrationOnly,true);
      if(standing.phase==='first')assert.ok(standing.count<=4);
      if(standing.phase==='second')assert.ok(standing.count>=5);
      assert.ok(seated.instruction.length>10);
      assert.equal(seated.footDiagram.left.x,-.22);
      assert.equal(seated.footDiagram.right.x,.22);
    }
    assert.equal(academyCue(plan,plan.total),null);
  }
  assert.equal(academyPlan('unknown',96,2),null);
  assert.equal(academyPlan('house',161,2),null);
});
test('R2 compatible exported charts never contain foot diagrams or health metrics',()=>{
  for(const id of LESSON_IDS){
    const chart=academyExportChart(id,96);
    const json=encodeChart(chart);
    const roundtrip=parseChart(json);
    assert.equal(roundtrip.phrases.length,1);
    assert.equal(totalCounts(roundtrip),8);
    for(const forbidden of ['standing','seated','footDiagram','feet','posture','audio','heartRate','calories','balance','proficiency']){
      assert.equal(json.includes('"'+forbidden+'":'),false,forbidden);
    }
  }
  assert.throws(()=>academyExportChart('malicious',96),/Unknown/);
});
test('local practice receipt is allowlisted and not an assessment',()=>{
  const plan=academyPlan('funk',96,2);
  const receipt=academyReceipt(plan,100000,'seated');
  assert.equal(receipt.displayedCounts,plan.total);
  assert.equal(receipt.provenance,'SCREEN_DEMONSTRATION_UNVERIFIED');
  for(const privateKey of ['person','rawPose','filename','footData','heartRate','name','timestamp','controllerPositions'])
    assert.equal(Object.hasOwn(receipt,privateKey),false);
});
