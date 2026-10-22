import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESET_SCHEMA,BUILTIN_PRESETS,builtInPreset,normalizePreset,encodePreset,parsePreset,
  capturePreset,applyPreset,cueSheetRows,cueSheetText,rehearsalStart
} from './dance-show-runner.mjs';
import {starterShow,changeScene,replaceSource,buildShow} from './dance-performance.mjs';
import {starterChart} from './choreo-model.mjs';
test('R7 show remains backwards compatible; R8 preset is a separate format',()=>{
  const previous=starterShow();
  assert.equal(previous.schema,'pulse369.dance-performance.v1');
  assert.equal(Object.hasOwn(previous,'presets'),false);
  for(const id of Object.keys(BUILTIN_PRESETS)){
    const preset=builtInPreset(id);
    assert.equal(preset.schema,PRESET_SCHEMA);
    assert.deepEqual(parsePreset(encodePreset(preset)),normalizePreset(preset));
    const composed=applyPreset(previous,preset);
    const p=buildShow(composed);
    assert.equal(p.totalCounts,buildShow(previous).totalCounts);
    assert.equal(composed.source.kind,previous.source.kind);
    assert.equal(composed.settings.frame,preset.frame);
    for(let i=0;i<p.segments.length;i++)
      assert.equal(p.segments[i].stage,preset.pattern[i%preset.pattern.length]);
  }
});
test('capture and restore stage direction for the exact R7 show, with no song or tracking fields',()=>{
  let original=starterShow();
  original=changeScene(original,0,'ember');
  original=changeScene(original,2,'aurora');
  original=changeScene(original,4,'twilight');
  const captured=capturePreset(original,'MY STAGE MIX');
  const fresh=applyPreset(starterShow(),parsePreset(encodePreset(captured)));
  assert.deepEqual(buildShow(fresh).segments.map(s=>s.stage),
    buildShow(original).segments.map(s=>s.stage));
  const text=encodePreset({...captured,privateName:'Secret',songFile:'song.mp3',cameraData:[1,2]});
  for(const privateKey of ['privateName','songFile','cameraData','rawPose','userId']){
    assert.ok(!text.includes(privateKey));
  }
});
test('preset validation rejects malformed strings, stage IDs and duplicate source assumptions',()=>{
  const base=builtInPreset('royal');
  assert.throws(()=>parsePreset('{'),/Invalid stage preset/);
  assert.throws(()=>parsePreset(' '.repeat(8193)),/8 KiB/);
  assert.throws(()=>normalizePreset({...base,pattern:['camera']}),/Invalid stage pattern/);
  assert.throws(()=>normalizePreset({...base,pattern:[]}),/Invalid stage pattern/);
  assert.throws(()=>normalizePreset({...base,reducedMotion:'false'}),/Invalid preset display/);
  assert.throws(()=>normalizePreset({...base,name:' '}),/Preset name/);
  assert.throws(()=>builtInPreset('secret'),/Unknown built-in/);
});
test('cue sheet covers every R2 and R6 section without gaps and keeps exact source timing',()=>{
  const samples=[starterShow(),replaceSource(starterShow(),'chart',starterChart())];
  for(const show of samples){
    const rows=cueSheetRows(show),plan=buildShow(show);
    assert.equal(rows.length,plan.segments.length);
    assert.equal(rows[0].count,1);
    assert.equal(rows.at(-1).endCount,plan.totalCounts);
    for(let i=0;i<rows.length;i++){
      const row=rows[i],segment=plan.segments[i];
      assert.equal(row.startSeconds,segment.start*60/plan.bpm);
      assert.equal(row.atSeconds,row.startSeconds+plan.offsetMs/1000);
      assert.equal(row.endCount,segment.end);
      if(i>0)assert.equal(row.count,rows[i-1].endCount+1);
    }
    const page=cueSheetText(show);
    assert.match(page,/PROCEDURAL|Procedural/);
    assert.match(page,/NO. \| SONG TIME/);
    assert.ok(!page.includes('audioBytes'));
  }
});
test('rehearse section from either synth guide or local song offsets no fake lead-in',()=>{
  const show=replaceSource(starterShow(),'chart',starterChart());
  const plan=buildShow(show);
  const first=rehearsalStart(show,0,'local');
  assert.equal(first.count,0);
  assert.equal(first.audioSeconds,0);
  assert.equal(first.leadInSeconds,show.source.data.offsetMs/1000);
  const second=rehearsalStart(show,1,'local');
  assert.equal(second.count,plan.segments[1].start);
  assert.equal(second.audioSeconds,plan.offsetMs/1000+second.count*60/plan.bpm);
  assert.equal(second.leadInSeconds,0);
  const guide=rehearsalStart(show,1,'guide');
  assert.equal(guide.count,second.count);
  assert.equal(guide.audioSeconds,null);
  assert.equal(guide.leadInSeconds,0);
  assert.throws(()=>rehearsalStart(show,-1,'local'),/Unknown section/);
  assert.throws(()=>rehearsalStart(show,0,'random'),/Unknown rehearsal/);
});
test('scene transitions never shift R6 recovery or chart phrasing under a preset',()=>{
  for(const show of [starterShow(),replaceSource(starterShow(),'chart',starterChart())]){
    const original=buildShow(show);
    const changed=buildShow(applyPreset(show,builtInPreset('mellow')));
    assert.deepEqual(original.segments.map(s=>[s.start,s.end,s.kind]),
      changed.segments.map(s=>[s.start,s.end,s.kind]));
    assert.equal(changed.show.settings.reducedMotion,true);
  }
});
