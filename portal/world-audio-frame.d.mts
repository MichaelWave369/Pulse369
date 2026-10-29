export type WorldAudioFrame={energy:number;bass:number;mid:number;high:number;beat:number};
export const ZERO_WORLD_AUDIO:Readonly<WorldAudioFrame>;
export function spectrumBands(bins:Uint8Array,sampleRate:number,fftSize:number,sensitivity?:number):WorldAudioFrame;
export function createTransientGate():{next:(bass:number,seconds:number)=>number;reset:()=>void};
export function normalizedWorldAudio(frame:WorldAudioFrame|null|undefined):WorldAudioFrame;
