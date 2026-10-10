import { classifyRhythmTouch, beatNear, RHYTHM_BEATS } from './quest-rhythm.mjs';

export const MAX_AUDIO_FILE_BYTES = 24 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['mp3', 'wav'];

export function inspectAudioFile(file, header) {
  if (!file || !Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_AUDIO_FILE_BYTES) {
    return { ok: false, reason: 'Choose one audio file under 24 MB.' };
  }
  const ext = (file.name || '').split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, reason: 'Only downloaded MP3 or WAV audio can be used.' };
  }
  if (!(header instanceof Uint8Array) || header.length < 12) {
    return { ok: false, reason: 'Audio header is missing or incomplete.' };
  }
  const id3 = header[0]===73 && header[1]===68 && header[2]===51;
  const frame = header[0]===0xff && (header[1] & 0xe0)===0xe0 && (header[1] & 0x06)!==0;
  const riff = String.fromCharCode(...header.slice(0,4))==='RIFF';
  const wave = String.fromCharCode(...header.slice(8,12))==='WAVE';
  const magicOk = ext === 'wav' ? riff && wave : id3 || frame;
  return magicOk
    ? { ok: true, format: ext }
    : { ok: false, reason: 'The file header does not match its MP3/WAV extension.' };
}

export function checkMusicSettings(bpm, offsetMs, durationSeconds) {
  if (!Number.isInteger(bpm) || bpm < 60 || bpm > 180) return 'Choose a whole-number BPM from 60 to 180.';
  if (!Number.isInteger(offsetMs) || offsetMs < 0 || offsetMs > 1000) return 'Beat offset must be between 0 and 1000 milliseconds.';
  const minimumSeconds = offsetMs / 1000 + ((RHYTHM_BEATS - 1) * 60 / bpm) + .5;
  if (!Number.isFinite(durationSeconds) || durationSeconds < minimumSeconds) {
    return 'This 24-beat drill needs an audio track at least ' + Math.ceil(minimumSeconds) + ' seconds long.';
  }
  return null;
}

/** AudioContext.currentTime is the authoritative timeline for BOTH music and hit checks. */
export function musicBeatAt(contextSeconds, startSeconds, bpm, offsetMs, count = RHYTHM_BEATS) {
  return beatNear((contextSeconds - startSeconds) * 1000, offsetMs, bpm, count);
}

export function classifyMusicTouch(contextSeconds, startSeconds, bpm, offsetMs, handedness, seen, count = RHYTHM_BEATS) {
  return classifyRhythmTouch((contextSeconds - startSeconds) * 1000, offsetMs, bpm, handedness, seen, count);
}

export function nextMusicBeat(contextSeconds, startSeconds, bpm, offsetMs, count = RHYTHM_BEATS) {
  if (![contextSeconds,startSeconds,bpm,offsetMs].every(Number.isFinite) || bpm <= 0) return null;
  const period = 60 / bpm;
  const index = Math.ceil(((contextSeconds - startSeconds) - offsetMs / 1000) / period);
  if (index < 0 || index >= count) return null;
  const untilMs = (startSeconds + offsetMs / 1000 + index * period - contextSeconds) * 1000;
  return { index, hand: index % 2 ? 'right' : 'left', untilMs };
}

export function sanitizedMusicReceipt({ bpm, offsetMs, errors }) {
  // Do not serialize file name, raw bytes, file size, per-hit times, controller poses, or user identity.
  return {
    schema: 'pulse369.local-music-lab.v1',
    source: 'selected-local-audio-not-uploaded',
    manualBpm: bpm,
    manualOffsetMs: offsetMs,
    audioSync: 'Web Audio clock scheduling; output latency not calibrated',
    privacy: 'No audio data, names or identifiers included',
    errors: Array.isArray(errors) ? errors.slice() : []
  };
}
