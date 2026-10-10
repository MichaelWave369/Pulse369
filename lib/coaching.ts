import { COACHES, PRESETS } from './training';
import { clock, isActive, type SessionResult } from './pulse';

// Feedback describes game timing and recorded session time, not physical form or effort.
export function coachDebrief(result:SessionResult,history:SessionResult[]){
 const active=isActive(result.mode),coach=result.coach==='none'?'Session notes':COACHES.find(c=>c.id===result.coach)?.name??(active?'Nova':'Lumen');
 const rate=result.total?Math.round(result.hits/result.total*100):0;
 const prior=history.filter(s=>s.id!==result.id&&s.mode===result.mode&&s.total>=20).slice(0,3),priorTotal=prior.reduce((n,s)=>n+s.total,0),priorHits=prior.reduce((n,s)=>n+s.hits,0);
 const change=priorTotal&&result.total>=20?rate-Math.round(priorHits/priorTotal*100):null;
 let title='A little progress, saved.',detail=`You made space for ${clock(result.seconds)} of movement.`,next='stretch-five';
 if(!result.completed){title='Every minute counts.';detail='You finished early. Your recorded time still counts toward your goals. A shorter set is ready when you want it.';next=active?(result.mode==='krav'?'krav-three':result.mode==='box'?'box-three':'first-flow'):'breath-one';}
 else if(active&&result.seconds>=900){title='Make room for recovery.';detail='You completed a longer movement set. A gentle stretch can be your next session, whenever you are ready.';next='stretch-five';}
 else if(active&&result.total>=20&&rate<60){title='Try a gentler rhythm.';detail='Fewer than six in ten game targets connected. Try an easy set with more space between targets; keep every reach comfortable.';next=result.mode==='krav'?'krav-three':result.mode==='box'?'box-three':'first-flow';}
 else if(active){title=change!==null&&change>=5?'Your timing is finding its groove.':'You found your rhythm.';detail=change!==null&&change>=5?`Your target timing rose ${change} percentage points compared with your last ${prior.length} ${result.mode==='krav'?'martial':result.mode==='box'?'boxing':'rave'} sets. This measures game timing.`:'Keep your own pace. A brief mindful reset makes a different kind of next step.';next='tai-three';}
 else{title='Carry a little calm with you.';detail=`You completed ${clock(result.seconds)} of ${result.mode==='qigong'?'Eight Brocades':result.mode==='tai-chi'?'tai chi':'mindful practice'}. Explore another gentle movement when you want to return.`;next=result.mode==='tai-chi'?'qigong-six':result.mode==='qigong'?'tai-three':result.mode==='yoga'?'tai-three':'yoga-three';}
 const evidence=active?`${result.hits} / ${result.total} game targets · ${result.combo} best combo${result.device==='desktop'?' · desktop timing':''}`:`${clock(result.seconds)} recorded · ${result.seated?'seated':'upright'} session`;
 return {coach,title,detail,evidence,next:PRESETS.find(p=>p.id===next)!};
}
