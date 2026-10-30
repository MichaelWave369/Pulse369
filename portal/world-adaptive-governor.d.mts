export type VisualGovernorLevel=0|1|2;
export type VisualGovernorStatus={enabled:boolean;immersive:boolean;level:VisualGovernorLevel;
 profile:string;xrCallbacks:number;processedWindows:number;downgrades:number;
 recoveries:number;ignoredLongGaps:number;lastSlowPercent:number|null;
 lastP90Ms:number|null;lastEvent:string;disclaimer:string};
export const GOVERNOR_LEVELS:readonly Readonly<{
 label:string;motion:number;glow:number;gain:number;allowCrossfade:boolean
}>[];
export const GOVERNOR_WINDOW:number;
export function createVisualGovernor():{
 status:()=>VisualGovernorStatus;
 setEnabled:(value:boolean)=>VisualGovernorStatus;
 setImmersive:(value:boolean)=>VisualGovernorStatus;
 observe:(timeMs:number,xrPresenting:boolean)=>number;
};
