import { DANCE_STYLES, danceMove } from './dance-core.mjs';

// Authored progression, not a health or dance-skill assessment. Timings are
// derived from the user-selected MANUAL tempo, not auto beat-detected audio.
export const CLASS_MINUTES = Object.freeze([3, 5, 10]);
export const CLASS_PHASES = Object.freeze([
  {id:'warmup', name:'WARM UP', hint:'Easy movement. Ease your shoulders into the groove.',scored:false},
  {id:'learn', name:'LEARN', hint:'Follow the instructor cue. Discover the eight-count phrase.',scored:false},
  {id:'rehearse', name:'REHEARSE', hint:'Repeat the whole eight-count sequence.',scored:true},
  {id:'perform', name:'DANCE', hint:'Put the phrase together. Keep your own comfortable pace.',scored:true},
  {id:'cooldown', name:'COOL DOWN', hint:'Gentle arms, slow breath, no breath holds.',scored:false}
]);

export function createDanceClass(bpm, minutes) {
  if (!Number.isInteger(bpm) || bpm < 60 || bpm > 180 || !CLASS_MINUTES.includes(minutes)) return null;
  const totalBeats = Math.round(minutes * bpm / 8) * 8; // ~3 / 5 / 10 minutes at given tempo
  const warmup = minutes === 10 ? 48 : 32;
  const learn = minutes === 10 ? 64 : 32;
  const rehearse = minutes === 10 ? 64 : 32;
  const cooldown = minutes === 10 ? 48 : 32;
  const blocks = [
    { ...CLASS_PHASES[0],beats:warmup },
    { ...CLASS_PHASES[1],beats:learn },
    { ...CLASS_PHASES[2],beats:rehearse },
    { ...CLASS_PHASES[3],beats:totalBeats - warmup - learn - rehearse - cooldown },
    { ...CLASS_PHASES[4],beats:cooldown }
  ];
  if (blocks[3].beats < 8) return null;
  let start=0;
  return {
    bpm, minutes,totalBeats,durationSeconds:totalBeats*60/bpm,
    blocks:blocks.map(b=>{const out={...b,start,end:start+b.beats};start+=b.beats;return out;})
  };
}

const warmupMoves = [
  {name:'SETTLE',coach:'Stand or sit comfortably. Relax your shoulders.',hands:[{side:'left',x:-.27,y:-.16,z:-.52},{side:'right',x:.27,y:-.16,z:-.52}]},
  {name:'SIDE GROOVE',coach:'Easy leftward arm reach. A step is optional.',hands:[{side:'left',x:-.34,y:-.12,z:-.52}]},
  {name:'SIDE GROOVE',coach:'Easy rightward arm reach. A step is optional.',hands:[{side:'right',x:.34,y:-.12,z:-.52}]},
  {name:'OPEN',coach:'Open your forearms without straining.',hands:[{side:'left',x:-.35,y:0,z:-.52},{side:'right',x:.35,y:0,z:-.52}]},
  {name:'RESET',coach:'Keep your spine tall. No deep bend.',hands:[{side:'left',x:-.26,y:-.15,z:-.52},{side:'right',x:.26,y:-.15,z:-.52}]},
  {name:'REACH',coach:'Bring left forearm up gently.',hands:[{side:'left',x:-.30,y:.10,z:-.52}]},
  {name:'REACH',coach:'Bring right forearm up gently.',hands:[{side:'right',x:.30,y:.10,z:-.52}]},
  {name:'EASY GROOVE',coach:'Keep movement comfortable.',hands:[{side:'left',x:-.27,y:-.15,z:-.52},{side:'right',x:.27,y:-.15,z:-.52}]}
];
const cooldownMoves = warmupMoves.map((m,i)=>({...m, name:['BREATHE','SOFT LEFT','SOFT RIGHT','OPEN','RESET','RELEASE','RELEASE','FINISH'][i],coach:'Move gently. Let your breathing return to normal.',hands:m.hands}));

export function classCue(plan, style, index) {
  if (!plan || !Object.hasOwn(DANCE_STYLES,style) || !Number.isInteger(index) || index<0 || index>=plan.totalBeats) return null;
  const block=plan.blocks.find(x=>index>=x.start && index<x.end);
  if(!block)return null;
  const local=index-block.start;
  const cycle=local%8;
  const move=block.id==='warmup' ? warmupMoves[cycle] :
    block.id==='cooldown' ? cooldownMoves[cycle] : danceMove(style,cycle);
  // Body mechanics are explained, never scored. For learning, teach each half
  // of the phrase twice before full repetitions.
  const learnStage=block.id==='learn' ? (Math.floor(local/8)%4) : -1;
  const coach=block.id==='learn' && learnStage<2
    ? ('BREAKDOWN '+(cycle+1)+'/8 · '+move.coach)
    : move.coach;
  return {
    index,beat:cycle+1, phrase:Math.floor(local/8)+1,
    phase:block.id,phaseName:block.name,phaseHint:block.hint,
    phaseProgress:(local+1)/block.beats,scoreEligible:block.scored,
    name:move.name,coach,hands:move.hands,
    upcoming:index+1<plan.totalBeats ? plan.blocks.find(x=>index+1>=x.start&&index+1<x.end)?.name : null
  };
}

export function classPosition(seconds, startSeconds, bpm, count) {
  if (![seconds,startSeconds,bpm].every(Number.isFinite) || bpm<=0 || !Number.isInteger(count) || count<1) return -1;
  const elapsed=(seconds-startSeconds)*bpm/60;
  return Math.max(-1,Math.min(count,Math.floor(elapsed + 1e-8)));
}

export function validateClassTrack(durationSeconds, plan, offsetMs) {
  if(!plan)return 'Choose a supported tempo and class duration.';
  if(!Number.isInteger(offsetMs)||offsetMs<0||offsetMs>1000)return 'Beat offset must be between 0 and 1000 ms.';
  if(!Number.isFinite(durationSeconds)||durationSeconds<plan.durationSeconds+offsetMs/1000+.5)
    return 'Choose a longer local MP3/WAV (at least '+Math.ceil(plan.durationSeconds+offsetMs/1000+.5)+' seconds) or switch to the synthesized guide beat.';
  return null;
}

export function classReceipt({style,plan,posture,completedBeats,eligibleBeats,matchedCues,musicMode}) {
  const total=plan?.totalBeats||0;
  const offered=Number.isInteger(completedBeats)?Math.max(0,Math.min(total,completedBeats)):0;
  const eligible=Number.isInteger(eligibleBeats)?Math.max(0,Math.min(offered,eligibleBeats)):0;
  const matched=Number.isInteger(matchedCues)?Math.max(0,Math.min(eligible,matchedCues)):0;
  return {
    schema:'pulse369.danceflow-class.v1',
    provenance:'LOCAL_UNVERIFIED',
    style:Object.hasOwn(DANCE_STYLES,style)?style:'unknown',
    manualBpm:plan?.bpm||null,selectedMinutes:plan?.minutes||null,
    posture:posture==='seated'?'seated':'standing',
    musicMode:musicMode==='local'?'local-file-not-uploaded':'synth-guide',
    offeredBeats:offered,scorableControllerCues:eligible,matchedControllerCues:matched,
    limits:'Not full-body tracking, dance form, calories, heart rate, song beat detection, or validated fitness scoring.'
  };
}

/** Check a controller cue against the same AudioContext beat grid used for music playback. */
export function classHitAt(clockSeconds, anchorSeconds, bpm, count, windowMs=220) {
  if (![clockSeconds,anchorSeconds,bpm,windowMs].every(Number.isFinite) || bpm<60 || bpm>180 || !Number.isInteger(count) || count<1 || count>2048 || windowMs<=0 || windowMs>260) return null;
  const step=60/bpm;
  const index=Math.round((clockSeconds-anchorSeconds)/step);
  if(index<0||index>=count) return null;
  const errorMs=(clockSeconds-anchorSeconds-index*step)*1000;
  if(Math.abs(errorMs)>windowMs)return null;
  return {index,errorMs};
}
