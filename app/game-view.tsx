'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { PulseGame, type GameStatus } from '@/lib/game-engine';
import type { SessionResult } from '@/lib/pulse';

export default function GameView({onReady,onStatus,onFinish,onError}:{onReady:(g:PulseGame|null)=>void;onStatus:(s:GameStatus)=>void;onFinish:(r:SessionResult)=>void;onError:(e:string)=>void}){
 const container=useRef<HTMLDivElement>(null),callbacks=useRef({onReady,onStatus,onFinish,onError});useLayoutEffect(()=>{callbacks.current={onReady,onStatus,onFinish,onError};},[onReady,onStatus,onFinish,onError]);
 useEffect(()=>{let game:PulseGame|null=null;try{game=new PulseGame(container.current!,s=>callbacks.current.onStatus(s),r=>callbacks.current.onFinish(r),e=>callbacks.current.onError(e));callbacks.current.onReady(game);}catch(e){callbacks.current.onError(e instanceof Error?e.message:'The 3D stage could not start. Try a browser with WebGL support.');}return()=>{game?.dispose();callbacks.current.onReady(null);};},[]);
 return <div ref={container} style={{position:'absolute',inset:0}} aria-label="Interactive 3D workout stage" role="img" />;
}
