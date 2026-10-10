/**
 * Pure rhythm-training helpers for a local-only WebXR timing exercise.
 * Error measures how close a controller entered a target to an authored
 * visual beat. It is NOT a measurement of sensor, display, or audio latency.
 */
export const RHYTHM_BEATS = 24;
export const RHYTHM_WINDOW_MS = 220;
export const RHYTHM_LEAD_IN_MS = 2400;

export function beatNear(timeMs, startMs, bpm, count = RHYTHM_BEATS) {
  if (![timeMs, startMs, bpm].every(Number.isFinite) || bpm < 40 || bpm > 200
      || !Number.isInteger(count) || count < 1 || count > 10000) return null;
  const period = 60000 / bpm;
  const index = Math.round((timeMs - startMs) / period);
  if (index < 0 || index >= count) return null;
  return {
    index,
    hand: index % 2 === 0 ? 'left' : 'right',
    errorMs: timeMs - (startMs + index * period),
    periodMs: period
  };
}

export function classifyRhythmTouch(timeMs, startMs, bpm, handedness, acceptedBeats, count = RHYTHM_BEATS) {
  const beat = beatNear(timeMs, startMs, bpm, count);
  if (!beat || !['left', 'right'].includes(handedness) || beat.hand !== handedness) return null;
  if (Math.abs(beat.errorMs) > RHYTHM_WINDOW_MS) return null;
  if (acceptedBeats.has(beat.index)) return null;
  return beat;
}

const rounded = x => Math.round(x * 10) / 10;

/**
 * Public-safe aggregate. Do not include raw controller pose, individual input
 * timestamps, headset tracking identifiers, or per-hit event data.
 */
export function summarizeRhythm(errorsMs, bpm, count = RHYTHM_BEATS) {
  const validBpm = Number.isFinite(bpm) && bpm >= 40 && bpm <= 200 ? bpm : null;
  const validCount = Number.isInteger(count) && count >= 1 && count <= 10000 ? count : RHYTHM_BEATS;
  const sanitized = (Array.isArray(errorsMs) ? errorsMs : [])
    .filter(x => Number.isFinite(x) && Math.abs(x) <= RHYTHM_WINDOW_MS)
    .slice(0, validCount);
  const ordered = sanitized.slice().sort((a, b) => a - b);
  const median = ordered.length
    ? (ordered[Math.floor((ordered.length - 1) / 2)] + ordered[Math.floor(ordered.length / 2)]) / 2
    : null;
  const averageAbs = ordered.length
    ? sanitized.reduce((sum, value) => sum + Math.abs(value), 0) / sanitized.length
    : null;
  return {
    kind: 'visual-beat-touch-drill',
    bpm: validBpm,
    offeredBeats: validCount,
    acceptedTouches: sanitized.length,
    meanAbsoluteErrorMs: averageAbs === null ? null : rounded(averageAbs),
    medianSignedErrorMs: median === null ? null : rounded(median),
    earlyTouches: sanitized.filter(x => x < 0).length,
    lateTouches: sanitized.filter(x => x > 0).length,
    onBeatTouches: sanitized.filter(x => x === 0).length,
    limits: 'Visual target entry timing only. Not system latency, music sync, reaction-time diagnosis, or body-motion accuracy.'
  };
}
