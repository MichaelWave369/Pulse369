import {normalizeChart,phraseFromStyle} from './choreo-model.mjs';

/**
 * DanceFlow R5: human-readable optional movement instruction.
 *
 * Real footwork is NOT sensed: all "feet" are safe, instructional diagram
 * coordinates, never measured body position or a required physical step.
 */
export const ACADEMY_VERSION='pulse369.dance-academy.v1';
export const ACADEMY_MINUTES=Object.freeze([2,4,6]);
export const ACADEMY_BPMS=Object.freeze([80,96,112]);
const stand={
  left:{x:-.22,z:0},right:{x:.22,z:0}
};
const pose=(leftX,rightX,leftZ=0,rightZ=0)=>({
  left:{x:leftX,z:leftZ},right:{x:rightX,z:rightZ}
});
const COUNT_FIELDS=['label','standing','seated','tip','feet','focus'];
const foot=(focus,feet,label,standing,seated,tip)=>({focus,feet,label,standing,seated,tip});
export const LESSONS=Object.freeze({
  house:{
    name:'HOUSE · STEP TOUCH',
    style:'groove',
    tag:'The first dance-floor groove',
    intro:'An easy, stationary step-touch with relaxed arm rhythm.',
    safety:'Take tiny steps or just shift your weight; no travel, hops, turns, or wide reaches.',
    counts:[
      foot('left', pose(-.30,.22), 'SIDE LEFT', 'Small step left, staying inside your play area.', 'Tap your left toes lightly; sway your forearms left.', 'Keep your knees soft.'),
      foot('right',pose(-.30,.02), 'TOUCH RIGHT', 'Touch right toes beside the left foot; do not transfer weight.', 'Tap right toes beside your chair; bring hands to center.', 'Touch gently instead of crossing your feet.'),
      foot('right',pose(-.22,.30),'SIDE RIGHT','Step right back toward your center.', 'Tap your right toes; sway forearms right.', 'Your movement can be tiny.'),
      foot('left',pose(-.02,.30),'TOUCH LEFT','Tap left toes near your right foot.', 'Tap left toes and let both hands relax.', 'No need to travel sideways.'),
      foot('left',pose(-.30,.22),'SIDE LEFT','Repeat your gentle left step.', 'Left toe tap with a comfortable left arm sway.', 'Move to the music, not past your boundary.'),
      foot('right',pose(-.30,.02),'TOUCH RIGHT','Bring your right toes lightly in.', 'Right toe tap; lower your hands.', 'Keep breathing naturally.'),
      foot('right',pose(-.22,.30),'SIDE RIGHT','Small right step back into center.', 'Right toe tap; sway your hands right.', 'Stay balanced.'),
      foot('both',stand,'GROOVE HOME','Bring both feet underneath you, stay relaxed.', 'Relax both feet; float your forearms home.', 'Finish the eight comfortably.')
    ]
  },
  funk:{
    name:'FUNK · BOUNCE & POP',
    style:'funk',
    tag:'Short accents, relaxed posture',
    intro:'A compact funk groove that separates soft knee pulses from controlled arm pops.',
    safety:'A bounce can be just a tiny soft-knee pulse or an arm motion. No squat or jump is needed.',
    counts:[
      foot('both',stand,'BOUNCE','Soften your knees slightly to the beat.', 'Press hands gently toward your lap.', 'This is not a squat.'),
      foot('left',pose(-.25,.22),'LEFT POP','Shift a little left and extend your left forearm.', 'Left palm reaches softly outward.', 'Avoid locking the elbow.'),
      foot('both',stand,'RESET','Return weight to center and relax.', 'Hands return to a comfortable neutral position.', 'Breathe easily.'),
      foot('right',pose(-.22,.25),'RIGHT POP','Shift slightly right and extend your right forearm.', 'Right palm reaches softly outward.', 'Never force the shoulder.'),
      foot('both',stand,'BOUNCE','Small, optional soft-knee pulse.', 'Gentle double forearm press.', 'Keep the motion comfortable.'),
      foot('left',pose(-.22,.22,-.09,0),'HEEL TAP','Touch the left heel slightly forward; no body travel.', 'Left toe or heel tap under the chair; left hand points.', 'Short and controlled.'),
      foot('right',pose(-.22,.22,0,-.09),'HEEL TAP','Touch the right heel slightly forward.', 'Right toe or heel tap; right hand points.', 'No deep bend.'),
      foot('both',stand,'FREEZE & GROOVE','Return both feet under you and add a relaxed arm accent.', 'Finish with a gentle hand accent.', 'Freeze the arms briefly, not your breath.')
    ]
  },
  disco:{
    name:'DISCO · POINT & STEP',
    style:'disco',
    tag:'Classic pointed arms and easy taps',
    intro:'Diagonal disco pointing with a stationary step rhythm and easy release.',
    safety:'Keep neck neutral; point an arm comfortably instead of leaning or reaching overhead.',
    counts:[
      foot('left',pose(-.27,.22),'LEFT TAP','Tap left toes just outside shoulder width; point left.', 'Left toe tap; point left arm within reach.', 'Keep your head level.'),
      foot('both',stand,'BACK HOME','Bring your left foot back under you.', 'Left toes back to neutral; relax the arm.', 'Stay centered.'),
      foot('right',pose(-.22,.27),'RIGHT TAP','Tap right toes just outside shoulder width; point right.', 'Right toe tap; point right arm comfortably.', 'No twisting required.'),
      foot('both',stand,'BACK HOME','Bring your right foot back under you.', 'Right toes neutral; relax your hand.', 'Avoid shoulder strain.'),
      foot('left',pose(-.22,.22,-.07,0),'FORWARD POINT','Tiny left toe tap forward; lift the left forearm slightly.', 'Tap left toe ahead of you while seated; lift arm gently.', 'Never reach beyond your balance.'),
      foot('right',pose(-.22,.22,0,-.07),'FORWARD POINT','Tiny right toe tap forward; lift right forearm.', 'Tap right toe forward; lift arm gently.', 'Keep the range small.'),
      foot('both',stand,'OPEN & RELEASE','Bring feet under you, gently open both arms.', 'Open both forearms, feet at rest.', 'Exhale naturally.'),
      foot('both',stand,'FINISH POSE','Relax arms into a soft disco finish.', 'Settle into a comfortable seated finish.', 'No forced held pose.')
    ]
  }
});
export const LESSON_IDS=Object.freeze(Object.keys(LESSONS));
const blocks=Object.freeze([
  {id:'warmup',label:'WARM UP',counts:16},
  {id:'first',label:'FIRST FOUR',counts:16},
  {id:'second',label:'SECOND FOUR',counts:16},
  {id:'join',label:'PUT IT TOGETHER',counts:16},
  {id:'practice',label:'DANCE IT',counts:null},
  {id:'cooldown',label:'COOL DOWN',counts:16}
]);
export function academyPlan(id,bpm=96,minutes=2){
  if(!LESSON_IDS.includes(id)||!ACADEMY_BPMS.includes(bpm)||!ACADEMY_MINUTES.includes(minutes))return null;
  const total=Math.round(minutes*bpm/8)*8;
  const fixed=blocks.reduce((n,b)=>n+(b.counts||0),0);
  if(total<=fixed)return null;
  let cursor=0;
  const segments=blocks.map(b=>{
    const count=b.counts??total-fixed;
    const item={id:b.id,label:b.label,start:cursor,end:cursor+count,counts:count};
    cursor+=count;return item;
  });
  return {id,bpm,minutes,total,durationSeconds:total*60/bpm,segments};
}
export function academyCue(plan,index,posture='standing'){
  if(!plan||!Number.isInteger(index)||index<0||index>=plan.total)return null;
  const lesson=LESSONS[plan.id];
  if(!lesson)return null;
  const phase=plan.segments.find(b=>index>=b.start&&index<b.end);
  if(!phase)return null;
  const local=index-phase.start;
  let count=local%8;
  if(phase.id==='first')count=local%4;
  if(phase.id==='second')count=4+local%4;
  const m=lesson.counts[count];
  const seated=posture==='seated';
  const calm=['warmup','cooldown'].includes(phase.id);
  return {
    count:count+1,globalCount:index+1,phase:phase.id,phaseName:phase.label,
    label:calm?(phase.id==='warmup'?'EASY START':'RECOVERY'):m.label,
    instruction:calm?'Move only within a comfortable range. Relax your shoulders and breathe easily.':seated?m.seated:m.standing,
    tip:calm?'You may simply watch and listen.':m.tip,
    focus:calm?'both':m.focus,
    footDiagram:seated||calm?stand:m.feet,
    seated,illustrationOnly:true,progress:(index+1)/plan.total,
    style:lesson.style,lessonName:lesson.name
  };
}
export function academyExportChart(id,bpm=96){
  const lesson=LESSONS[id];
  if(!lesson||!ACADEMY_BPMS.includes(bpm))throw new Error('Unknown lesson or tempo.');
  const phrase=phraseFromStyle(lesson.style,lesson.name,1);
  // R2 chart v1 carries ONLY original arm cue references. Standing/seated
  // foot instructions intentionally live ONLY in the Academy lesson.
  return normalizeChart({
    schema:'pulse369.choreography.v1',
    title:'ACADEMY '+lesson.name,bpm,offsetMs:0,phrases:[phrase]
  });
}
export function academyReceipt(plan,shown,posture){
  const count=Number.isInteger(shown)?Math.max(0,Math.min(plan?.total||0,shown)):0;
  return {
    schema:'pulse369.academy-practice.v1',provenance:'SCREEN_DEMONSTRATION_UNVERIFIED',
    lesson:LESSON_IDS.includes(plan?.id)?plan.id:'unknown',
    manualBpm:plan?.bpm||null,requestedMinutes:plan?.minutes||null,
    posture:posture==='seated'?'seated':'standing',
    displayedCounts:count,
    limits:'Practice was displayed only. No feet, body, movement, calories, heart rate, balance, proficiency or exertion were sensed.'
  };
}
