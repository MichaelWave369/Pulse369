export type AcceptanceChecklistKey='bundleImportedInQuestBrowser'|'authoredPhrasesAligned'|
 'sceneryBehindTargets'|'musicReactionObserved'|'pauseResumeAndReentry'|'comfortAndControlsReviewed';
export type AcceptanceChecklist=Record<AcceptanceChecklistKey,boolean>;
export type AcceptanceSample={timeMs:number;xrPresenting:boolean;calls:number;triangles:number;
 activeStages:number;phraseIndex:number|null;reason:string};
export type AcceptanceMeasurements={recording:boolean;xrObserved:boolean;callbackFrames:number;
 validIntervals:number;elapsedSeconds:number;medianCallbackMs:number|null;p95CallbackMs:number|null;
 estimatedCallbackHz:number|null;longGaps:number;sceneChanges:number;autoCuts:number;
 peakDrawCalls:number;peakTriangles:number;intervalWindowTruncated:boolean;enoughForReview:boolean};
export type AcceptanceReceipt={schema:'pulse369.quest-acceptance-receipt.v1';version:1;
 kind:'USER_INITIATED_WEBXR_CALLBACK_MEASUREMENT';disclaimer:string;
 measurements:AcceptanceMeasurements;manualChecklist:AcceptanceChecklist;
 verification:'USER_ATTESTED_ONLY_NOT_INDEPENDENTLY_VERIFIED'};
export const ACCEPTANCE_SCHEMA:string;
export const CHECKLIST:readonly AcceptanceChecklistKey[];
export function createAcceptanceRecorder():{
 start:()=>void;stop:()=>void;isRecording:()=>boolean;capture:(sample:AcceptanceSample)=>boolean;
 snapshot:()=>AcceptanceMeasurements;receipt:(checks:AcceptanceChecklist)=>AcceptanceReceipt;
};
