import type {AcceptanceReceipt} from './world-acceptance.mjs';
export const COMPARISON_SCHEMA:string;
export const MAX_RECEIPT_BYTES:number;
export type AcceptanceComparisonField={key:string;label:string;unit:string;
 direction:'higher'|'lower'|'context';baseline:number|null;candidate:number|null;
 delta:number|null;percent:number|null};
export interface AcceptanceComparison {
 schema:'pulse369.quest-acceptance-comparison.v1';version:1;
 source:'TWO_USER_SUPPLIED_UNVERIFIED_R7_RECEIPTS';
 disclaimer:string;matchedConditions:boolean;comparable:boolean;
 interpretation:'NOT_COMPARABLE'|'POSSIBLE_REGRESSION_REVIEW'|'NO_LARGE_CALLBACK_REGRESSION_DETECTED';
 fields:AcceptanceComparisonField[];flags:string[];warnings:string[];
 summaries:{baseline:{callbackFrames:number;elapsedSeconds:number;selfAttestedItems:number};
 candidate:{callbackFrames:number;elapsedSeconds:number;selfAttestedItems:number}};
}
export function readAcceptanceReceipt(json:string):AcceptanceReceipt;
export function compareAcceptanceReceipts(baseline:AcceptanceReceipt,candidate:AcceptanceReceipt,matchedConditions?:boolean):AcceptanceComparison;
export function writeAcceptanceComparison(report:AcceptanceComparison):string;
