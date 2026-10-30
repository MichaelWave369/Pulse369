import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createRequire}from'node:module';
import{pathToFileURL}from'node:url';
import ts from 'typescript';
const require=createRequire(import.meta.url),temp=await fs.mkdtemp(path.join(os.tmpdir(),'pulse-game-'));
let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
try{
 for(const name of ['pulse','audio','training','journeys','coaching','worlds','custom-workout-world','performance-workout-world','companions','heart-rate','clans','custom-missions','game-engine']){const source=await fs.readFile('lib/'+name+'.ts','utf8');let code=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;code=code.replace(/from '(\.\/[\w-]+)'/g,"from '$1.mjs'").replaceAll("from 'three'","from '"+pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href+"'");code=code.replace(/from '\.\.\/portal\/([^']+)'/g,(_,asset)=>"from '"+pathToFileURL(path.resolve('portal',asset)).href+"'");
 await fs.writeFile(path.join(temp,name+'.mjs'),code);}
 const {DEFAULT_CONFIG,makeChart,recoveryCue,clock,weekStats,sessionPhase,DURATIONS,mindfulHands,movementProgress,MODES,isActive,danceCue}=await import(pathToFileURL(path.join(temp,'pulse.mjs')).href);
 const {JOURNEYS,journeyPresets,qualifiesJourneyStep,nextJourneyPreset}=await import(pathToFileURL(path.join(temp,'journeys.mjs')).href);
 const {coachDebrief}=await import(pathToFileURL(path.join(temp,'coaching.mjs')).href);
 const {weekStartInZone,validTimezone}=await import(pathToFileURL(path.join(temp,'clans.mjs')).href);
 const {PRESETS,MISSIONS,ACHIEVEMENTS,missionProgress,coachDirective,recommendSession}=await import(pathToFileURL(path.join(temp,'training.mjs')).href);
 const {parseHeartRate,HeartAccumulator,HeartMonitor}=await import(pathToFileURL(path.join(temp,'heart-rate.mjs')).href);
 const {matchesActivity,customMissionProgress,customMissionPreset}=await import(pathToFileURL(path.join(temp,'custom-missions.mjs')).href);
 const {PulseGame}=await import(pathToFileURL(path.join(temp,'game-engine.mjs')).href);
 const {PerformanceWorkoutWorld}=await import(pathToFileURL(path.join(temp,'performance-workout-world.mjs')).href);
 const {PulseAudio}=await import(pathToFileURL(path.join(temp,'audio.mjs')).href);
 const {fitWorldBackdrop}=await import(pathToFileURL(path.resolve('portal/world-stage-layout.mjs')).href);
 const {SAMPLE_WORLD,readWorldFile,writeWorldPack}=await import(pathToFileURL(path.resolve('portal/world-bridge.mjs')).href);
 const {visualCueForSession}=await import(pathToFileURL(path.resolve('portal/world-visual-clock.mjs')).href);
 const {starterChart}=await import(pathToFileURL(path.resolve('portal/choreo-model.mjs')).href);
 const {createPerformance,editPerformanceCue,samplePerformance,writePerformance,readPerformance}=await import(pathToFileURL(path.resolve('portal/world-performance.mjs')).href);
 const authored=starterChart();
 const composed=createPerformance(authored,[SAMPLE_WORLD,{...SAMPLE_WORLD,title:'Second Domistika realm'}]);
 check(composed.cues.length===authored.phrases.length&&readPerformance(writePerformance(composed)).worlds.length===2,
   'World Forge R4 composes validated offline choreography and scenery into a music-free show');
 const transitionStart=8*60/authored.bpm;
 const atBoundary=samplePerformance(composed,transitionStart),atHalf=samplePerformance(composed,transitionStart+2*60/authored.bpm);
 check(atBoundary.phraseIndex===1&&atBoundary.blend===0&&Math.abs(atHalf.blend-.5)<1e-7,
   'World Forge R4 scene crossfade aligns to authored eight-count phrase boundaries');
 const recolored=editPerformanceCue(composed,1,{palette:'ember',glow:.4,motion:.3});
 check(recolored.cues[1].palette==='ember'&&composed.cues[1].palette==='aurora',
   'Visual phrase edits do not mutate the source performance or gameplay chart');
 const mixed=new PerformanceWorkoutWorld(composed);
 mixed.update(0,authored.bpm,false,undefined,1,0);
 check(mixed.visibleStages.size===1,'Only one world is resident outside a crossfade');
 mixed.update(transitionStart,authored.bpm,false,undefined,1,transitionStart);
 check(mixed.visibleStages.size===2,'World transition uses at most two live display scenes');
 mixed.update(transitionStart+5*60/authored.bpm,authored.bpm,false,undefined,1,transitionStart+2);
 check(mixed.visibleStages.size===1,'Old scenes dispose when the authored transition completes');
 mixed.dispose();
 check(mixed.visibleStages.size===0,'All authored world geometry is disposed at teardown');
 const {estimateWorldCost,sceneTransitionPolicy,performanceBudgetReport}=await import(pathToFileURL(path.resolve('portal/world-render-budget.mjs')).href);
 const heavyObjects=Array.from({length:48},(_,i)=>({...SAMPLE_WORLD.workshop.objects[0],
   id:'quest-r5-'+String(i).padStart(4,'0'),name:'Quest knot '+i,kind:'tube',dimensions:[1,1,1]}));
 const heavyWorld={...SAMPLE_WORLD,workshop:{schema:'domistika.xr.workshop.v1',objects:heavyObjects}};
 const heavyShow=createPerformance(authored,[heavyWorld,{...heavyWorld,title:'Heavy second world'}]);
 const projected=estimateWorldCost(heavyWorld,'quest');
 check(projected.triangles===48*480&&projected.draws===48,'R5 counts actual Quest torus-knot tessellation and draw calls.');
 check(!sceneTransitionPolicy(heavyShow.worlds,0,1,'quest').crossfade
   &&sceneTransitionPolicy(heavyShow.worlds,0,1,'desktop').crossfade,
   'R5 VR auto-cut prevents two expensive worlds while desktop can still crossfade.');
 check(performanceBudgetReport(heavyShow,'quest').cuts>0,'R5 preflight exposes headset scene cuts before training.');
 const capped=new PerformanceWorkoutWorld(heavyShow);
 capped.setQuality('quest');
 capped.update(transitionStart,authored.bpm,false,undefined,1,transitionStart);
 check(capped.visibleStages.size===1&&capped.getRenderStatus().reason==='crossfade-over-budget',
   'R5 chooses one world BEFORE a Quest over-budget transition allocation.');
 capped.setQuality('desktop');
 check(capped.visibleStages.size===0,'R5 headset-to-desktop tier change disposes incompatible GPU geometry.');
 capped.update(transitionStart,authored.bpm,false,undefined,1,transitionStart);
 check(capped.visibleStages.size===2,'R5 desktop mode preserves original smooth visual crossfade.');
 capped.dispose();
 check(capped.visibleStages.size===0,'R5 safe scene mixer releases all resident geometry.');
 check(visualCueForSession(SAMPLE_WORLD.show,4,120,0,true).title==='Flow','Rave visual scenes change at eight-count boundaries.');
 const {spectrumBands,ZERO_WORLD_AUDIO}=await import(pathToFileURL(path.resolve('portal/world-audio-frame.mjs')).href);
 const {assignObjectBand}=await import(pathToFileURL(path.resolve('portal/world-director.mjs')).href);
 const bins=new Uint8Array(1024);bins[Math.round(100*2048/48000)]=230;
 check(spectrumBands(bins,48000,2048).bass>0,'R3 live FFT produces a real bass envelope from existing audio bins.');
 const directed=assignObjectBand(SAMPLE_WORLD,SAMPLE_WORLD.workshop.objects[0].id,'mid');
 check(directed.workshop.objects[0].motion.band==='mid'&&SAMPLE_WORLD.workshop.objects[0].motion.band!=='mid',
   'R3 per-object visual director keeps the original world unchanged.');
 const audio=new PulseAudio();let audioConnected=null,audioStops=0;
 audio.context={state:'running',sampleRate:48000,currentTime:10,createBufferSource(){return {
   connect(node){audioConnected=node;},start(){},stop(){audioStops++;},disconnect(){}};}};
 audio.gain={};audio.analyser={fftSize:2048,getByteFrequencyData(data){data.fill(0);data[Math.round(100*2048/48000)]=230;}};
 audio.frequencyBins=new Uint8Array(1024);audio.cache.set('world-test',{duration:15});
 audio.setAnalysisEnabled(true);audio.play({id:'world-test'},0);
 const sampled=audio.sampleVisualFrame();
 check(audioConnected===audio.analyser&&sampled.bass>0&&sampled.mid===0,
   'PulseAudio routes ONE original music source through FFT to the original gain.');
 audio.stop();
 check(audioStops===1&&JSON.stringify(audio.sampleVisualFrame())===JSON.stringify(ZERO_WORLD_AUDIO),
   'Stopping song playback cancels FFT samples and reactive light energy.');
 audio.setAnalysisEnabled(false);
 check(JSON.stringify(audio.sampleVisualFrame())===JSON.stringify(ZERO_WORLD_AUDIO),
   'Switching to a native environment disables visual audio analysis.');
 const fitted=fitWorldBackdrop({min:[-80,-20,-40],max:[80,20,40]});
 check(fitted.width<=24&&fitted.height<=12&&fitted.depth<=12&&fitted.maxZ<=-14,'Imported worlds fit behind the scoring target corridor.');
 const roundtrip=readWorldFile(writeWorldPack(SAMPLE_WORLD));
 check(roundtrip.workshop.objects.length===9&&roundtrip.schema==='pulse369.worldpack.v1','Validated local WorldPack survives import/export without server state.');
 check(!Object.hasOwn(DEFAULT_CONFIG,'customWorld')&&!Object.hasOwn(DEFAULT_CONFIG,'worldPack'),'Untrusted imported scene bytes never enter the shared room config.');
 const a=makeChart(DEFAULT_CONFIG),b=makeChart({...DEFAULT_CONFIG});check(JSON.stringify(a)===JSON.stringify(b),'Room peers generate identical target charts.');
 check(a.length>100&&a.every(n=>n.time>=3&&n.time<180&&n.lane>=0&&n.lane<=3),'Targets have bounded timing and reach.');
 check(makeChart({...DEFAULT_CONFIG,seed:370}).some((n,i)=>n.lane!==a[i].lane),'Changing a room seed produces a different routine.');
 check(makeChart({...DEFAULT_CONFIG,difficulty:'intense'}).length>makeChart({...DEFAULT_CONFIG,difficulty:'steady'}).length&&makeChart({...DEFAULT_CONFIG,difficulty:'steady'}).length>a.length,'Difficulty changes target frequency.');
 check(makeChart({...DEFAULT_CONFIG,seated:true}).every(n=>Math.abs(n.x)<=.4&&n.y<=1.32),'Seated targets have a shorter, lower reach.');
 check(makeChart({...DEFAULT_CONFIG,mode:'yoga'}).length===0,'Recovery modes do not score rhythm targets.');
 const intervals={...DEFAULT_CONFIG,program:'intervals',minutes:9};const intervalChart=makeChart(intervals);
 check(intervalChart.every(n=>sessionPhase(intervals,n.time).targets)&&!sessionPhase(intervals,95).targets&&sessionPhase(intervals,110).targets,'Interval charts contain no targets during scheduled recovery.');
 const balanced={...DEFAULT_CONFIG,program:'balanced'};check(sessionPhase(balanced,5).id==='warmup'&&sessionPhase(balanced,179).id==='cooldown'&&makeChart(balanced).every(n=>n.time<153),'Balanced sessions end with a target-free cooldown.');
 check(DURATIONS.includes(1)&&DURATIONS.includes(30)&&PRESETS.length===40&&PRESETS.every(p=>DURATIONS.includes(p.minutes)),'Every preset uses an available duration from one to thirty minutes.');
 check(makeChart({...DEFAULT_CONFIG,minutes:30}).at(-1).time<1800&&makeChart({...DEFAULT_CONFIG,minutes:30}).length>a.length*9,'Thirty-minute sets generate a complete bounded chart.');
 check(coachDirective(DEFAULT_CONFIG,{elapsed:30,phase:'playing',hits:3,total:20,combo:0}).mood==='support'&&coachDirective(DEFAULT_CONFIG,{elapsed:30,phase:'playing',hits:20,total:20,combo:15}).mood==='celebrate','Coaches adapt their guidance to real misses and combos.');
 check(coachDirective(intervals,{elapsed:95,phase:'playing',hits:20,total:20,combo:10}).mood==='rest'&&coachDirective(DEFAULT_CONFIG,{elapsed:30,phase:'paused',hits:20,total:20,combo:10}).mood==='rest','Coaches prioritize interval breaks and personal pauses.');
 check(recommendSession('nova',[{mode:'rave',total:20,hits:3}]).preset.difficulty==='easy','Coach session recommendations respond to recent timing results.');
 check(missionProgress(MISSIONS.find(m=>m.id==='neon-footsteps'),[{mode:'rave',seconds:100},{mode:'rave',seconds:220},{mode:'yoga',seconds:300}])===300,'Mission minutes count only the required movement and stop at the target.');
 check(missionProgress(MISSIONS.find(m=>m.id==='first-light'),[{completed:false,seconds:60},{completed:true,seconds:50}])===0,'Completion missions reject partial or too-short sessions.');
 check(!ACHIEVEMENTS.find(a=>a.id==='hello-flow').test([{completed:false}])&&ACHIEVEMENTS.find(a=>a.id==='hello-flow').test([{completed:true}]),'First-session achievements require a completed session.');
 check(MODES.length===9&&isActive('krav')&&!isActive('tai-chi')&&!isActive('qigong'),'Martial rhythm contributes active time; tai chi and qigong contribute mindful time.');
 const martial=makeChart({...DEFAULT_CONFIG,mode:'krav'});check(martial.some(n=>n.gesture==='guard')&&martial.some(n=>n.gesture==='strike')&&JSON.stringify(martial)===JSON.stringify(makeChart({...DEFAULT_CONFIG,mode:'krav'})),'Shared martial charts contain deterministic strike and guard phrases.');
 check(makeChart({...DEFAULT_CONFIG,mode:'krav',seated:true}).every(n=>Math.abs(n.x)<=.35+1e-9&&n.y<=1.28+1e-9),'Seated martial target reaches are shortened and lowered.');
 const titles=Array.from({length:8},(_,i)=>recoveryCue({...DEFAULT_CONFIG,mode:'qigong'},i*30).title);check(new Set(titles).size===8&&recoveryCue({...DEFAULT_CONFIG,mode:'qigong'},240).title===titles[0],'The adapted Eight Brocades cycle visits eight movements before repeating.');
 check(new Set(Array.from({length:6},(_,i)=>recoveryCue({...DEFAULT_CONFIG,mode:'tai-chi'},i*30).title)).size===6,'Tai chi guides a six-phase slow hand-path sequence.');
 for(const mode of ['yoga','tai-chi','qigong']){const paths=Array.from({length:240},(_,t)=>mindfulHands({...DEFAULT_CONFIG,mode},t+.3));check(paths.flat().every(([x,y,z])=>Number.isFinite(x+y+z)&&Math.abs(x)<=.65&&y>=1&&y<=1.9&&z>=0&&z<=.45),mode+' hand guides remain in a bounded upright range.');}
 check(mindfulHands({...DEFAULT_CONFIG,mode:'qigong',seated:true},4).every((p,i)=>p[1]<mindfulHands({...DEFAULT_CONFIG,mode:'qigong'},4)[i][1]),'Seated mindful demonstrations lower the hand positions.');
 check(recommendSession('sage',[]).preset.mode==='tai-chi','Sage recommends the new mindful movement sessions.');
 check(missionProgress(MISSIONS.find(m=>m.id==='clan-rest'),[{completed:true,seconds:180,mode:'qigong',clan_id:null},{completed:true,seconds:180,mode:'rave',clan_id:'real'}])===0,'Clan mindful missions require both a mindful session and an actual contribution.');
 check(weekStartInZone(Date.parse('2026-10-08T05:00:00Z'),'America/Los_Angeles')===Date.parse('2026-10-05T07:00:00Z'),'Clans share Monday midnight in the selected timezone.');
 check(weekStartInZone(Date.parse('2026-11-03T00:00:00Z'),'America/Los_Angeles')===Date.parse('2026-11-02T08:00:00Z')&&weekStartInZone(Date.parse('2026-10-28T00:00:00Z'),'America/Los_Angeles')===Date.parse('2026-10-26T07:00:00Z'),'Shared weekly boundaries follow daylight-saving transitions.');
 check(validTimezone('America/Los_Angeles')&&!validTimezone('not-a-zone'),'Invalid clan timezones are rejected.');
 check(JOURNEYS.length===4&&JOURNEYS.every(j=>journeyPresets(j).length===j.presets.length&&journeyPresets(j).every(p=>p&&DURATIONS.includes(p.minutes))),'Every training path uses real playable session presets.');
 const intro=JOURNEYS[0];check(qualifiesJourneyStep(intro,0,{mode:'breathe',seconds:60,completed:true})&&!qualifiesJourneyStep(intro,0,{mode:'breathe',seconds:59,completed:true})&&!qualifiesJourneyStep(intro,0,{mode:'breathe',seconds:60,completed:false})&&!qualifiesJourneyStep(intro,0,{mode:'rave',seconds:60,completed:true}),'Path steps require the right activity, full planned time, and completion.');
 check(nextJourneyPreset(intro,{next_step:1,completed_at:null}).id==='first-flow'&&nextJourneyPreset(intro,{next_step:7,completed_at:100})===undefined,'Paths resume the next step and do not restart after completion.');
 check(ACHIEVEMENTS.length===32&&ACHIEVEMENTS.filter(a=>a.journey).every(a=>!a.test([{journey_id:a.journey,completed:true}])),'Path achievements require durable enrollment completion, not client session claims.');
 check(movementProgress({...DEFAULT_CONFIG,mode:'qigong'},239.9).step===8&&movementProgress({...DEFAULT_CONFIG,mode:'qigong'},240).step===1&&movementProgress({...DEFAULT_CONFIG,mode:'tai-chi'},31).remaining===29&&movementProgress({...DEFAULT_CONFIG,mode:'meditate'},10)===null,'Mindful countdowns track six or eight movements and wrap correctly.');
 const review={id:'review',mode:'rave',seconds:180,hits:10,total:30,combo:3,completed:true,device:'desktop',coach:'nova'};check(coachDebrief(review,[]).next.difficulty==='easy'&&coachDebrief({...review,seconds:900},[]).next.mode==='stretch','Debriefs suggest gentler timing practice or recovery based on the recorded session.');
 check(coachDebrief({...review,hits:27},[{...review,id:'earlier',hits:15}]).detail.includes('40 percentage points'),'Debriefs compare target timing with actual previous same-mode sessions.');
 check(JSON.stringify(coachDebrief({...review,hr_summary:{average:200}},[]))===JSON.stringify(coachDebrief(review,[]))&&coachDebrief({...review,coach:'none'},[]).coach==='Session notes','Debriefs ignore sensor readings and honor the no-coach choice.');
 const waveConfig={...DEFAULT_CONFIG,raveStyle:'waves'},waveChart=makeChart(waveConfig),grooveConfig={...DEFAULT_CONFIG,raveStyle:'groove'},grooveChart=makeChart(grooveConfig);
 check(JSON.stringify(makeChart({...DEFAULT_CONFIG,raveStyle:'free'}))===JSON.stringify(a),'The original free dance chart remains unchanged.');
 check(['waves','groove'].every(raveStyle=>{const notes=makeChart({...balanced,raveStyle}).filter(n=>sessionPhase(balanced,n.time).id==='warmup');return notes.some(n=>n.lane<2)&&notes.some(n=>n.lane>=2)&&notes[0].lane<2&&notes[1].lane>=2;}),'Slower structured warmups preserve alternating left and right reaches.');
 check(JSON.stringify(waveChart)===JSON.stringify(makeChart(waveConfig))&&JSON.stringify(grooveChart)===JSON.stringify(makeChart(grooveConfig)),'Wave and groove charts are deterministic for room peers.');
 check(waveChart.slice(0,8).map(n=>n.lane).join(',')==='1,3,1,3,0,2,0,2'&&waveChart[0].y===1.12&&waveChart[2].y===1.3&&waveChart[6].y===1.65,'Wave phrases alternate hands while rising through four comfortable heights.');
 check(grooveChart.slice(0,4).every(n=>Math.abs(n.x)===.42)&&grooveChart.slice(4,8).every(n=>Math.abs(n.x)===.64),'Groove phrases alternate close and outward reaches.');
 check(['waves','groove'].every(raveStyle=>makeChart({...DEFAULT_CONFIG,raveStyle,seated:true}).every(n=>Math.abs(n.x)<=.4&&n.y<=1.32)),'Seated dance phrases keep every target in the smaller reach range.');
 check(['waves','groove'].every(raveStyle=>makeChart({...intervals,raveStyle}).every(n=>sessionPhase(intervals,n.time).targets)),'Structured dance phrases respect every recovery interval.');
 check(danceCue(waveConfig,waveChart[0].time+.1).title.includes('Wave upward')&&danceCue(grooveConfig,grooveChart[4].time+.1).title.includes('Open gently'),'Dance callouts follow the current target phrase.');
 check(coachDirective(DEFAULT_CONFIG,{elapsed:50,phase:'playing',hits:97,total:110,combo:0,recentHits:2,recentTotal:12}).mood==='support','Recent misses trigger coaching even after a strong earlier session.');
 check(coachDirective(DEFAULT_CONFIG,{elapsed:50,phase:'playing',hits:15,total:100,combo:4,recentHits:10,recentTotal:12}).mood==='guide','Recovered recent timing clears the earlier support cue.');
 check(coachDirective(grooveConfig,{elapsed:grooveChart[4].time+8,phase:'playing',hits:4,total:4,combo:4}).detail.includes('grounded'),'Structured dance guidance includes grounded movement instructions.');
 check(matchesActivity('active','krav')&&!matchesActivity('active','qigong')&&matchesActivity('mindful','qigong')&&matchesActivity('all','rave')&&!matchesActivity('yoga','rave'),'Custom mission activity groups distinguish active, mindful, and exact modes.');
 check(customMissionProgress({activity:'rave',metric:'minutes',target:3},[{mode:'rave',seconds:90,completed:false},{mode:'yoga',seconds:600,completed:true}])===1.5,'Minute missions include matching partial workouts and exclude other activities.');
 check(customMissionProgress({activity:'all',metric:'sessions',target:2},[{mode:'rave',seconds:59,completed:true},{mode:'rave',seconds:90,completed:false},{mode:'yoga',seconds:60,completed:true}])===1,'Session missions require completion and at least one minute.');
 check(customMissionProgress({activity:'all',metric:'minutes',target:3},[{mode:'rave',seconds:600,completed:true}])===3&&customMissionPreset({activity:'mindful'}).mode==='breathe','Custom mission progress is capped and activity choices select real presets.');
 check(missionProgress(MISSIONS.find(m=>m.id==='ride-the-wave'),[{mode:'rave',seconds:180,rave_style:'free'}])===0&&missionProgress(MISSIONS.find(m=>m.id==='ride-the-wave'),[{mode:'rave',seconds:180,rave_style:'waves'}])===180,'Wave campaign missions require the recorded dance style.');
 check(!ACHIEVEMENTS.find(a=>a.id==='wave-catcher').test([{mode:'rave',completed:true,rave_style:'free'}])&&ACHIEVEMENTS.find(a=>a.id==='groove-builder').test([{mode:'rave',completed:true,rave_style:'groove'}]),'Dance style achievements require the matching recorded style.');
 const packet=bytes=>new DataView(Uint8Array.from(bytes).buffer);check(parseHeartRate(packet([0,72])).bpm===72&&parseHeartRate(packet([1,44,1])).bpm===300,'Bluetooth BPM parsing handles both byte widths and little-endian values.');
 check(parseHeartRate(packet([6,80])).contact===true&&parseHeartRate(packet([4,80])).contact===false&&parseHeartRate(packet([0,80])).contact===null,'Sensor contact flags preserve supported, absent, and unknown contact.');
 check(parseHeartRate(packet([1,80]))===null&&parseHeartRate(packet([8,80,0]))===null&&parseHeartRate(packet([16,80,0]))===null&&parseHeartRate(packet([0,0]))===null,'Truncated sensor packets and missing readings are rejected.');
 check(parseHeartRate(packet([24,80,0,0,0,4])).bpm===80,'Optional energy and RR fields do not alter the BPM value.');
 const accumulator=new HeartAccumulator();accumulator.add(70);accumulator.add(90);accumulator.add(NaN);check(JSON.stringify(accumulator.summary())===JSON.stringify({average:80,min:70,max:90,samples:2}),'Private heart summaries exclude invalid samples.');accumulator.reset();check(accumulator.summary()===null,'Starting a new session clears previous sensor summaries.');
 const breath={...DEFAULT_CONFIG,mode:'breathe',noHold:false};check(recoveryCue(breath,0).title==='Breathe in'&&recoveryCue(breath,4).title==='Soft hold'&&recoveryCue(breath,10).title==='Breathe out'&&recoveryCue(breath,18).title==='Breathe in','The 369 breath cycle is 3/6/9 seconds.');
 check(recoveryCue({...breath,noHold:true},4).title==='Breathe out'&&recoveryCue({...breath,noHold:true},9).title==='Breathe in','Gentle breathing removes holds.');
 check(clock(369)==='6:09'&&clock(-1)==='0:00','The session clock formats and clamps time.');
 const fakeNow=new Date('2026-10-08T12:00:00');const stats=weekStats([{mode:'rave',seconds:180,completed:true,created_at:fakeNow.getTime()},{mode:'yoga',seconds:60,completed:false,created_at:fakeNow.getTime()},{mode:'rave',seconds:999,completed:true,created_at:new Date('2026-09-01').getTime()}],fakeNow);check(stats.move===3&&stats.mindful===1&&stats.sessions===1,'Weekly progress separates active, mindful, partial, and previous-week sessions.');
 globalThis.window={speechSynthesis:{cancel(){}}};let time=0;const original=Object.getOwnPropertyDescriptor(globalThis,'performance');Object.defineProperty(globalThis,'performance',{value:{now:()=>time},configurable:true});
 const game=Object.create(PulseGame.prototype);Object.assign(game,{config:{...DEFAULT_CONFIG,journeyId:'rave-momentum',journeyStep:0,customMissionId:'private-goal',raveStyle:'waves'},status:{phase:'playing',elapsed:0,score:0,hits:0,total:0,combo:0,maxCombo:0,vr:false},clockStart:0,groupAnchor:0,segmentStart:0,countedSeconds:0,notes:[],audio:{stop(){},unlock:async()=>{},play(){}},onStatus(){},setPauseLabel(){},onFinish:r=>game.result=r,scene:{remove(){}},sessionId:'test',usedVR:true});
 time=10000;game.pause();time=30000;await game.resume();time=40000;game.finish();check(game.result.seconds===20,'A group pause is excluded from recorded exercise time while playback resynchronizes.');
 const result=game.result;game.finish();check(game.result===result,'Finishing twice does not create another result.');
 check(result.custom_mission_id==='private-goal'&&result.rave_style==='waves','The engine captures personal mission and dance style from the played session.');
 check(result.journey_id==='rave-momentum'&&result.journey_step===0,'The engine captures the selected path step with the finished session.');
 game.heart=new HeartAccumulator();game.status.phase='paused';game.setHeartRate(90);game.status.phase='playing';time=50000;game.setHeartRate(80);check(game.heart.summary().samples===1&&game.heart.summary().average===80,'Only active playback samples enter a heart-rate summary.');
 const THREE=await import(pathToFileURL(path.join(path.dirname(require.resolve('three')),'three.module.js')).href);
 function collisionGame(mode='box',wrongHand=false,stationary=false){
  const g=Object.create(PulseGame.prototype),pos=new THREE.Vector3(-.48,1.65,-.55),note={time:0,lane:0,x:pos.x,y:pos.y,mesh:new THREE.Group(),done:false};note.mesh.position.copy(pos);
  const left=wrongHand?new THREE.Vector3(4,1,0):pos.clone(),right=wrongHand?pos.clone():new THREE.Vector3(4,1,0);
  Object.assign(g,{config:{...DEFAULT_CONFIG,mode},status:{phase:'playing',elapsed:0,score:0,hits:0,total:0,combo:0,maxCombo:0,vr:true},clockStart:1000,segmentStart:1000,countedSeconds:0,lastFrame:84,lastPublish:100,notes:[note],audio:{source:{},stop(){}},onStatus(){},scene:new THREE.Scene(),tunnel:new THREE.Group(),particles:new THREE.Group(),orb:new THREE.Mesh(),grips:[{getWorldPosition(v){return v.copy(left);}},{getWorldPosition(v){return v.copy(right);}}],lastHands:[left.clone().add(new THREE.Vector3(stationary?0:.2,0,0)),right.clone()],sources:[{handedness:'left'},{handedness:'right'}],materials:[new THREE.MeshBasicMaterial(),new THREE.MeshBasicMaterial()],effectFlashes:[],peers:new Map(),renderer:{render(){},xr:{isPresenting:true}},destroyed:false});return g;
 }
 time=1000;const hit=collisionGame();hit.frame(100);check(hit.status.hits===1&&hit.status.combo===1&&hit.status.score===102,'A moving matching VR hand scores a real collision.');
 const wrong=collisionGame('box',true);wrong.frame(100);check(wrong.status.hits===0,'The wrong VR hand cannot collect a target.');
 const still=collisionGame('box',false,true);still.frame(100);check(still.status.hits===0,'A stationary controller cannot score boxing hits.');
 const guard=collisionGame('krav',false,true);guard.notes[0].gesture='guard';guard.frame(100);check(guard.status.hits===1,'A matching guard position scores without requiring impact velocity.');
 const strike=collisionGame('krav',false,true);strike.notes[0].gesture='strike';strike.frame(100);check(strike.status.hits===0,'A stationary controller cannot score a martial strike.');
 const missed=collisionGame();time=1400;missed.frame(100);check(missed.status.total===1&&missed.status.hits===0,'A passed target is recorded as missed.');
 for(let i=0;i<14;i++)missed.recordTarget(i>=4);check(missed.status.recentTotal===12&&missed.status.recentHits===10,'Coaching tracks only the most recent twelve target results.');
 const paused=collisionGame();paused.status.phase='paused';paused.frame(100);check(paused.status.hits===0,'Paused sessions do not accept collisions.');
 let finishLoading;const loading=Object.create(PulseGame.prototype);Object.assign(loading,{status:{phase:'idle'},startGeneration:0,audio:{stop(){},unlock:async()=>{},prepare:()=>new Promise(resolve=>finishLoading=resolve)},renderer:{xr:{isPresenting:false}},onStatus(){},destroyed:false});const pending=loading.start(DEFAULT_CONFIG);await Promise.resolve();await Promise.resolve();loading.cancelLoad();finishLoading({});await pending;check(loading.status.phase==='idle','Cancelling music preparation prevents a delayed ghost session.');
 const characteristic=new EventTarget();characteristic.startNotifications=async()=>characteristic;characteristic.stopNotifications=async()=>characteristic;const device=new EventTarget();device.name='Verification monitor';device.gatt={connected:false,async connect(){this.connected=true;return this;},disconnect(){this.connected=false;},async getPrimaryService(name){assert.equal(name,'heart_rate');return{async getCharacteristic(name){assert.equal(name,'heart_rate_measurement');return characteristic;}};}};
 const nav=Object.getOwnPropertyDescriptor(globalThis,'navigator');Object.defineProperty(globalThis,'navigator',{value:{bluetooth:{async requestDevice(options){assert.deepEqual(options,{filters:[{services:['heart_rate']}]});return device;}}},configurable:true});let sensorState,sample;const monitor=new HeartMonitor(s=>sensorState=s,bpm=>sample=bpm);await monitor.connect();characteristic.value=packet([6,85]);characteristic.dispatchEvent(new Event('characteristicvaluechanged'));check(sensorState.phase==='connected'&&sample===85,'A real notification path publishes the selected monitor reading.');device.dispatchEvent(new Event('gattserverdisconnected'));check(sensorState.bpm===null&&sample===null&&sensorState.phase==='off','Disconnect immediately clears the live reading.');monitor.dispose();if(nav)Object.defineProperty(globalThis,'navigator',nav);else delete globalThis.navigator;
 if(original)Object.defineProperty(globalThis,'performance',original);
 console.log(`PASS: ${checks} game checks — rhythm collisions, intervals, missions, adaptive coaching, Bluetooth packets, privacy accounting, and lifecycle.`);
}finally{await fs.rm(temp,{recursive:true,force:true});}
