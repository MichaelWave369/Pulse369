/**
 * DanceFlow R4: choreographic visual direction, not body tracking.
 *
 * The renderer samples authored gesture cues and synthesizes different
 * performance silhouettes. Feet are planted for every style. Nothing here
 * is scored, used as movement telemetry, or sent outside the browser.
 */
import {authoredPose,blendCoachPoses,transitionAmount} from './motion-coach.mjs';

export const DIRECTOR_VERSION='pulse369.dance-director.v1';
export const EXPRESSIONS=Object.freeze(['subtle','showtime']);
export const STAGE_STYLES=Object.freeze({
  groove:{name:'HOUSE GROOVE',headline:'FLOW WITH THE BEAT',caption:'Loose shoulders · lateral rhythm',accent:'#b9fb7a'},
  funk:{name:'FUNK POPS',headline:'HIT THE ACCENTS',caption:'Snappy elbows · grounded stance',accent:'#ffa875'},
  disco:{name:'DISCO SHAPES',headline:'REACH & RELEASE',caption:'Diagonal reach · lifted shoulders',accent:'#7dd7ff'},
  gentle:{name:'EASY FLOW',headline:'TAKE IT EASY',caption:'Comfortable range · stationary feet',accent:'#b6bbff'}
});
const available=Object.keys(STAGE_STYLES);
const bounded=(n,a,b)=>Math.min(b,Math.max(a,Number.isFinite(n)?n:a));
const clone=p=>structuredClone(p);
const add=(p,x=0,y=0)=>{p.x+=x;p.y+=y;};
const clampPoint=p=>{p.x=bounded(p.x,-.6,.6);p.y=bounded(p.y,-.9,.7);};
export function cueStyle(cue){
  const style=cue?.style;
  return typeof style==='string'&&Object.hasOwn(STAGE_STYLES,style)?style:'gentle';
}
/** Applied only to displayed skeleton, never actual controller target rings. */
export function directPose(pose,style='gentle',position=0,{expression='showtime',reducedMotion=false}={}){
  if(!pose)return null;
  const p=clone(pose);
  const profile=available.includes(style)?style:'gentle';
  const emphasis=expression==='subtle'?.42:1;
  const energy=reducedMotion?0:emphasis;
  const count=Number.isFinite(position)?position:0;
  const swing=Math.sin(count*Math.PI);
  const pulse=.5-.5*Math.cos(count*2*Math.PI);
  const offbeat=Math.sin(count*2*Math.PI);
  if(profile==='groove'){
    const shift=(.027+energy*.038)*swing;
    add(p.hips,shift*.8,0);add(p.spine,shift,energy*.009*pulse);
    add(p.neck,shift*.86,0);add(p.head,shift*.84,energy*.013*pulse);
    for(const side of ['left','right']){
      add(p.shoulder[side],shift*.84,energy*.008*pulse);
      add(p.elbow[side],shift*.6,energy*.008*pulse);
      add(p.wrist[side],shift*.5,energy*.008*pulse);
      add(p.hip[side],shift*.75,0);
      add(p.knee[side],shift*.22,energy*.008*pulse);
    }
  }else if(profile==='funk'){
    const pop=energy*.028*pulse;
    add(p.hips,0,-.025-pop);
    add(p.spine,0,-.025-pop);
    add(p.neck,0,-.023-pop);add(p.head,0,-.018-pop);
    for(const side of ['left','right']){
      const sign=side==='left'?-1:1;
      add(p.shoulder[side],sign*.025,-.02-pop);
      add(p.elbow[side],sign*(.036+energy*.013*Math.abs(offbeat)),-.025-pop);
      add(p.wrist[side],sign*.012,-.01-pop);
      add(p.hip[side],0,-.026-pop);
      add(p.knee[side],0,-.014-pop*.6);
    }
  }else if(profile==='disco'){
    const tilt=.025+energy*.028*offbeat;
    add(p.hips,-tilt*.52,0);
    add(p.spine,tilt*.7,0);add(p.neck,tilt*.82,0);add(p.head,tilt,.014);
    add(p.shoulder.left,-.024+tilt*.65,-.012);
    add(p.shoulder.right,.021+tilt*.65,.025);
    add(p.elbow.left,-.018+tilt*.6,-.008);
    add(p.elbow.right,.024+tilt*.6,.024);
    add(p.wrist.left,-.014,0);
    add(p.wrist.right,.014,.02);
    add(p.hip.left,-tilt*.5,0);add(p.hip.right,-tilt*.5,0);
  }
  // Keep both illustrated feet fixed and bound other positions to an
  // intentionally narrow diagram range independent of input chart content.
  for(const key of ['head','neck','spine','hips'])clampPoint(p[key]);
  for(const key of ['shoulder','elbow','wrist','hip','knee']){
    for(const side of ['left','right'])clampPoint(p[key][side]);
  }
  return p;
}

export function sampleDirectedPose(cueAt,beats,opts={}){
  if(typeof cueAt!=='function')throw new TypeError('Choreography reader required.');
  const time=Math.max(0,Number.isFinite(beats)?beats:0);
  const index=Math.floor(time);
  const current=cueAt(index);
  if(!current)return null;
  const following=cueAt(index+1)||current;
  if(opts.reducedMotion){
    return directPose(authoredPose(current,0),cueStyle(current),0,{...opts,reducedMotion:true});
  }
  const a=directPose(authoredPose(current,time),cueStyle(current),time,opts);
  const b=directPose(authoredPose(following,time),cueStyle(following),time,opts);
  // Crossfades both gesture and style. By the next count, b equals the new
  // count's starting pose, avoiding a boundary pop or forced-foot jump.
  return blendCoachPoses(a,b,transitionAmount(time-index));
}

function phraseIdentity(cue){
  if(!cue)return null;
  if(Number.isInteger(cue.phraseIndex))return 'chart:'+cue.phraseIndex+':'+(cue.phraseRepeat||1);
  if(typeof cue.phase==='string')return 'class:'+cue.phase+':'+(cue.phrase||1);
  return 'cue:'+((cue.phraseName||'')+':'+(cue.phraseRepeat||1));
}
export function directionAt(cueAt,index){
  if(typeof cueAt!=='function'||!Number.isInteger(index)||index<0)return null;
  const cue=cueAt(index);
  if(!cue)return null;
  const style=cueStyle(cue);
  let upcoming=null;
  for(let ahead=1;ahead<=2;ahead++){
    const next=cueAt(index+ahead);
    if(next && phraseIdentity(next)!==phraseIdentity(cue)){
      upcoming={
        inCounts:ahead,
        label:next.phraseName||next.chartPhrase||next.phaseName||'NEXT PHRASE',
        style:cueStyle(next),
        name:STAGE_STYLES[cueStyle(next)].name
      };
      break;
    }
  }
  return {
    style,styleName:STAGE_STYLES[style].name,
    headline:STAGE_STYLES[style].headline,
    caption:STAGE_STYLES[style].caption,
    accent:STAGE_STYLES[style].accent,
    upcoming
  };
}
