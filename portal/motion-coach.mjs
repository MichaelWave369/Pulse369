/**
 * DanceFlow R3: deterministic, frame-rate-independent instructor animation.
 *
 * These are ARTISTICALLY AUTHORED 2D/3D display poses, not pose-estimation,
 * mocap, foot tracking, calibrated biomechanics, or exercise measurements.
 * All coordinates remain bounded and are driven exclusively by choreography.
 */

export const COACH_VERSION = 'pulse369.motion-coach.v1';
const SIDES = Object.freeze(['left','right']);
const NEUTRAL = Object.freeze({
  left:{side:'left',x:-.29,y:-.19,z:-.52},
  right:{side:'right',x:.29,y:-.19,z:-.52}
});
const safe = (n,fallback=0) => Number.isFinite(n) ? n : fallback;
const clamp = (n,min,max) => Math.min(max,Math.max(min,safe(n,min)));
const point = (x,y) => ({x,y});
const lerp = (a,b,t) => a+(b-a)*t;
const ease = t => { const s=clamp(t,0,1);return s*s*(3-2*s); };

export function transitionAmount(fraction) {
  // Hold the displayed cue for the beginning of the count. Then transition
  // early enough for the instructor to REACH the upcoming cue by its beat.
  return ease((clamp(fraction,0,1)-.18)/.82);
}

export function authoredPose(cue, beatPosition=0) {
  const hands = Array.isArray(cue?.hands) ? cue.hands : [];
  const handFor=side=>{
    const raw=hands.find(h=>h?.side===side) || NEUTRAL[side];
    return {
      x:clamp(raw.x,-.53,.53),
      y:clamp(raw.y,-.32,.32),
      z:clamp(raw.z,-.65,-.38)
    };
  };
  // Foot placement stays fixed. Torso sway is an illustration of a rhythm,
  // never a command to step or lean beyond the play boundary.
  const sway=.032*Math.sin(safe(beatPosition)*Math.PI);
  const bounce=.013*(1-Math.cos(safe(beatPosition)*Math.PI*2))*.5;
  const hips=point(sway*.6,-.39+bounce);
  const spine=point(sway*.8,.15+bounce);
  const head=point(sway*.95,.51+bounce);
  const neck=point(sway,.32+bounce);
  const shoulder={
    left:point(-.17+sway,.21+bounce),
    right:point(.17+sway,.21+bounce)
  };
  const wrist={};
  const elbow={};
  for(const [i,side] of SIDES.entries()){
    const target=handFor(side);
    const sign=i===0?-1:1;
    wrist[side]=point(target.x+sway*.5,.04+target.y+bounce);
    const origin=shoulder[side],dest=wrist[side];
    elbow[side]=point(
      (origin.x+dest.x)/2 +sign*.067,
      (origin.y+dest.y)/2-.045
    );
  }
  const hip={
    left:point(hips.x-.095,hips.y),
    right:point(hips.x+.095,hips.y)
  };
  const knee={
    left:point(-.14+sway*.2,-.61),
    right:point(.14+sway*.2,-.61)
  };
  const foot={
    left:point(-.15,-.84),
    right:point(.15,-.84)
  };
  return {head,neck,spine,hips,shoulder,elbow,wrist,hip,knee,foot};
}

export function blendCoachPoses(a,b,amount) {
  if(!a||!b)return a||b||null;
  const t=ease(amount);
  const mixPoint=(x,y)=>point(lerp(x.x,y.x,t),lerp(x.y,y.y,t));
  const result={};
  for(const key of ['head','neck','spine','hips'])result[key]=mixPoint(a[key],b[key]);
  for(const key of ['shoulder','elbow','wrist','hip','knee','foot']){
    result[key]={};
    for(const side of SIDES)result[key][side]=mixPoint(a[key][side],b[key][side],t);
  }
  return result;
}

export function sampleCoachPose(cueAt,beats,{reducedMotion=false}={}) {
  if(typeof cueAt!=='function')throw new TypeError('A choreography cue reader is required.');
  const position=Math.max(0,safe(beats));
  const index=Math.floor(position);
  const current=cueAt(index);
  if(!current)return null;
  const next=cueAt(index+1)||current;
  const fraction=position-index;
  const currentPose=authoredPose(current,reducedMotion?0:position);
  if(reducedMotion)return currentPose;
  const nextPose=authoredPose(next,position);
  return blendCoachPoses(currentPose,nextPose,transitionAmount(fraction));
}

// 2D coordinate projection shared by the SVG instructor and generated tests.
// No inputs are measured positions of a real human.
export function projectCoachPose(pose,width=400,height=340) {
  if(!pose)return null;
  const cx=width/2, base=height*.94, scale=Math.min(width,height)*.286;
  const project=p=>point(cx+p.x*scale,base-(p.y+.84)*scale);
  const result={};
  for(const key of ['head','neck','spine','hips'])result[key]=project(pose[key]);
  for(const key of ['shoulder','elbow','wrist','hip','knee','foot']){
    result[key]={};
    for(const side of SIDES)result[key][side]=project(pose[key][side]);
  }
  return result;
}
