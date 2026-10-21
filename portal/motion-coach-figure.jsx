import React from 'react';
import { projectCoachPose } from './motion-coach.mjs';

const d=(...pts)=>pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
const circle=(p,r=5)=>({cx:p.x,cy:p.y,r});
function Limb({points,color,weight=12}){
  return <>
    <path d={d(...points)} stroke="#071427" strokeWidth={weight+8} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".9"/>
    <path d={d(...points)} stroke={color} strokeWidth={weight} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </>;
}

/**
 * Animated procedural upper-body demonstration with decorative lower body.
 * All positions come from authored counts. It never reads device/camera pose.
 */
export default function MotionCoachFigure({pose,reducedMotion=false,label='Procedural choreography instructor illustration'}){
  const p=projectCoachPose(pose);
  if(!p)return <div className="motion-coach-empty" role="img" aria-label="No choreography cue yet">INSTRUCTOR READY</div>;
  const torso=[p.shoulder.left,p.shoulder.right,p.hips,p.shoulder.left];
  return <svg className="motion-coach-svg" viewBox="0 0 400 340" role="img"
    aria-label={label} xmlns="http://www.w3.org/2000/svg">
    <title>{label}</title>
    <defs>
      <radialGradient id="motionCoachGlow"><stop offset="0" stopColor="#9d78ff" stopOpacity=".32"/><stop offset="1" stopColor="#1b2746" stopOpacity="0"/></radialGradient>
      <linearGradient id="motionCoachTorso" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ab90ff"/><stop offset=".55" stopColor="#636ab4"/><stop offset="1" stopColor="#45d6de"/></linearGradient>
      <filter id="motionCoachSoft"><feGaussianBlur stdDeviation="6"/></filter>
    </defs>
    <ellipse cx="200" cy="156" rx="155" ry="160" fill="url(#motionCoachGlow)"/>
    <ellipse cx="200" cy="317" rx="95" ry="13" fill="#6bdfff" opacity=".12"/>
    <ellipse cx="200" cy="315" rx="88" ry="9" fill="none" stroke="#55cdd9" opacity=".35" strokeWidth="2"/>
    <Limb points={[p.hip.left,p.knee.left,p.foot.left]} color="#657fae" weight={13}/>
    <Limb points={[p.hip.right,p.knee.right,p.foot.right]} color="#657fae" weight={13}/>
    <path d={d(...torso)} fill="url(#motionCoachTorso)" stroke="#bed5ff" strokeWidth="3" opacity=".94"/>
    <path d={d(p.neck,p.spine,p.hips)} stroke="#d9e4ff" strokeWidth="3" strokeLinecap="round" opacity=".67"/>
    <Limb points={[p.shoulder.left,p.elbow.left,p.wrist.left]} color="#c7f876" weight={11}/>
    <Limb points={[p.shoulder.right,p.elbow.right,p.wrist.right]} color="#76d9ff" weight={11}/>
    <circle {...circle(p.head,25)} fill="#121f41" stroke="#abacff" strokeWidth="5"/>
    <path d={d({x:p.head.x-10,y:p.head.y+3},{x:p.head.x+10,y:p.head.y+3})} stroke="#a7e4ff" strokeWidth="4" strokeLinecap="round" opacity=".7"/>
    {['left','right'].map(side=><g key={side}>
      <circle {...circle(p.wrist[side],19)} fill={side==='left'?'#c7f876':'#79d4ff'} opacity=".24" filter="url(#motionCoachSoft)"/>
      <circle {...circle(p.wrist[side],10)} fill={side==='left'?'#c7f876':'#79d4ff'} stroke="#071427" strokeWidth="3"/>
      <circle {...circle(p.elbow[side],5)} fill="#ebf2ff"/>
      <circle {...circle(p.knee[side],6)} fill="#98aad7"/>
      <circle {...circle(p.foot[side],8)} fill="#73a7c0"/>
    </g>)}
    <text x="13" y="21" fill="#9bc7de" fontSize="10" fontWeight="800" letterSpacing="1.8">PULSE 369 · MOTION COACH</text>
    <text x="13" y="330" fill="#97b3cb" fontSize="9" letterSpacing="1.3">{reducedMotion?'REDUCED MOTION / STATIC CUES':'AUTHORED POSES / SMOOTH TRANSITIONS'}</text>
  </svg>;
}
