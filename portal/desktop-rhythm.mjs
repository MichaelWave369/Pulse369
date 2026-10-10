import { classifyMusicTouch, nextMusicBeat } from './quest-local-music.mjs';
import { RHYTHM_BEATS, summarizeRhythm } from './quest-rhythm.mjs';

export const DESKTOP_KEYS = Object.freeze({ a: 'left', l: 'right' });
export const DESKTOP_LEAD_IN_SECONDS = 2.4;

export function handForKey(key) {
  return typeof key === 'string' ? (DESKTOP_KEYS[key.toLowerCase()] || null) : null;
}

/** Key/button activation, not physical controller motion. */
export function gradeDesktopHit(clockSeconds, startSeconds, bpm, offsetMs, hand, previouslyScored) {
  if (!previouslyScored || typeof previouslyScored.has !== 'function') return null;
  return classifyMusicTouch(clockSeconds, startSeconds, bpm, offsetMs, hand, previouslyScored);
}

export function desktopBeatProgress(clockSeconds, startSeconds, bpm, offsetMs) {
  if (![clockSeconds, startSeconds, bpm, offsetMs].every(Number.isFinite) || bpm <= 0) return 0;
  const offsetSeconds = offsetMs / 1000;
  const position = (clockSeconds - startSeconds - offsetSeconds) * bpm / 60;
  if (position < 0) return 0;
  return Math.min(RHYTHM_BEATS, Math.max(0, Math.floor(position) + 1));
}

export function desktopNextCue(clockSeconds, startSeconds, bpm, offsetMs) {
  return nextMusicBeat(clockSeconds, startSeconds, bpm, offsetMs);
}

const whole = value => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

/**
 * Strict receipt allowlist. Filename, audio bytes, file size, user names,
 * keyboard history and individual press times are deliberately not emitted.
 */
export function makeDesktopReceipt(input = {}) {
  const { bpm, offsetMs, errors, elapsedMs, reason } = input;
  return {
    schema: 'pulse369.desktop-rehearsal.v1',
    runtime: 'desktop-browser',
    input: 'keyboard-or-screen-button',
    exit: reason === 'completed' ? 'completed' : 'stopped',
    durationSeconds: whole(elapsedMs / 1000),
    localMusic: {
      source: 'local-file-not-uploaded',
      manualBpm: Number.isInteger(bpm) && bpm >= 60 && bpm <= 180 ? bpm : null,
      manualBeatOffsetMs: Number.isInteger(offsetMs) && offsetMs >= 0 && offsetMs <= 1000 ? offsetMs : null
    },
    rhythm: summarizeRhythm(errors, bpm),
    limitation: 'Keyboard/screen hit timing relative to authored Web Audio clock; not human reaction time, system latency, or physical VR controller accuracy.'
  };
}
