import type {WorldPerformance} from './world-performance.mjs';
export type BundleLicense='personal'|'CC0-1.0'|'CC-BY-4.0';
export type BundleMetadata={creator:string;description:string;license:BundleLicense;tags:string[]};
export interface BundlePreview {title:string;phrases:number;counts:number;bpm:number;scenes:{title:string;objects:number}[];questMaxTriangles:number;questAutoCuts:number}
export interface WorldLibraryBundle {schema:'pulse369.world-library-bundle.v1';version:1;sha256:string;metadata:BundleMetadata;preview:BundlePreview;performance:WorldPerformance}
export const BUNDLE_SCHEMA:string;export const MAX_BUNDLE_BYTES:number;export const LICENSES:readonly BundleLicense[];
export function sha256(value:string):Promise<string>;
export function previewManifest(show:WorldPerformance):BundlePreview;
export function createBundle(show:WorldPerformance,options?:BundleMetadata):Promise<WorldLibraryBundle>;
export function readBundle(json:string):Promise<WorldLibraryBundle>;
export function writeBundle(bundle:WorldLibraryBundle):string;
