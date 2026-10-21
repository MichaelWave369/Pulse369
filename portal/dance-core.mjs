/**
 * Pulse369 DanceFlow R0: authored eight-count movement phrases.
 * Only the controller proximity/cue timing can be checked by WebXR.
 * Hips, feet, balance, exertion and dance quality cannot be inferred.
 */
export const DANCE_BEATS = 64;
export const DANCE_LEAD_MS = 3000;
export const DANCE_WINDOW_MS = 260;
export const DANCE_RADIUS_M = 0.28;
export const DANCE_TEMPOS = [96, 112, 128];

const hand = (side, x, y, z = -0.52) => ({ side, x, y, z });
const L = (x, y, z) => hand('left', x, y, z);
const R = (x, y, z) => hand('right', x, y, z);
const both = (x, y) => [L(-x, y), R(x, y)];

export const DANCE_STYLES = Object.freeze({
  groove: {
    name: 'NEON GROOVE', tag: 'House / side-to-side', color: '#adfa78',
    moves: [
      { name: 'LEFT GROOVE', coach: 'Gentle weight shift left', hands: [L(-.48, -.16)] },
      { name: 'RIGHT GROOVE', coach: 'Gentle weight shift right', hands: [R(.48, -.16)] },
      { name: 'CROSS', coach: 'Cross left arm, keep feet comfortable', hands: [L(.06, -.12)] },
      { name: 'CROSS', coach: 'Cross right arm, shoulders relaxed', hands: [R(-.06, -.12)] },
      { name: 'OPEN', coach: 'Open arms and breathe', hands: both(.46, .04) },
      { name: 'DIP', coach: 'Small soft-knee groove or seated dip', hands: both(.30, -.25) },
      { name: 'LIFT', coach: 'Raise hands comfortably, no forced stretch', hands: both(.34, .24) },
      { name: 'RESET', coach: 'Back to an easy groove', hands: both(.36, -.12) }
    ]
  },
  funk: {
    name: 'FUNK CIRCUIT', tag: 'Funk / controlled pops', color: '#ffa872',
    moves: [
      { name: 'LEFT POP', coach: 'Left palm reaches out, gently', hands: [L(-.46, -.08)] },
      { name: 'RIGHT POP', coach: 'Right palm reaches out, gently', hands: [R(.46, -.08)] },
      { name: 'CROSS POP', coach: 'Left hand across center', hands: [L(.04, -.02)] },
      { name: 'CROSS POP', coach: 'Right hand across center', hands: [R(-.04, -.02)] },
      { name: 'LOW SWEEP', coach: 'Sweep both hands low, not your torso', hands: both(.38, -.23) },
      { name: 'HIGH POP', coach: 'Raise both forearms, stay comfortable', hands: both(.31, .22) },
      { name: 'WIDE FUNK', coach: 'Open both hands to the sides', hands: both(.48, .02) },
      { name: 'GROOVE HOME', coach: 'Return to a relaxed stance', hands: both(.34, -.12) }
    ]
  },
  disco: {
    name: 'COSMIC DISCO', tag: 'Disco / reach and release', color: '#81dbff',
    moves: [
      { name: 'LEFT POINT', coach: 'Point left, keep neck neutral', hands: [L(-.39, .23)] },
      { name: 'RIGHT POINT', coach: 'Point right, keep neck neutral', hands: [R(.39, .23)] },
      { name: 'LEFT LOW', coach: 'Bring left hand low', hands: [L(-.36, -.23)] },
      { name: 'RIGHT LOW', coach: 'Bring right hand low', hands: [R(.36, -.23)] },
      { name: 'DOUBLE LIFT', coach: 'Lift both arms within easy reach', hands: both(.33, .25) },
      { name: 'DOUBLE SWEEP', coach: 'Bring both hands down smoothly', hands: both(.37, -.23) },
      { name: 'OPEN FLOOR', coach: 'Spread your arms and groove', hands: both(.48, .01) },
      { name: 'FINISH POSE', coach: 'Relax into your own finish pose', hands: both(.32, -.13) }
    ]
  }
});

export function danceMove(style, index) {
  if (!Object.hasOwn(DANCE_STYLES, style) || !Number.isInteger(index) || index < 0) return null;
  return DANCE_STYLES[style].moves[index % 8];
}
export function danceBeatAt(timeMs, startMs, bpm, beats = DANCE_BEATS) {
  if (![timeMs, startMs, bpm].every(Number.isFinite) || bpm < 60 || bpm > 180 || !Number.isInteger(beats) || beats < 1 || beats > 1000) return null;
  const interval = 60000 / bpm;
  const index = Math.round((timeMs - startMs) / interval);
  if (index < 0 || index >= beats) return null;
  const errorMs = timeMs - startMs - index * interval;
  if (Math.abs(errorMs) > DANCE_WINDOW_MS) return null;
  return { index, errorMs };
}
export function poseMatches(controllers, targets, tolerance = DANCE_RADIUS_M) {
  if (!controllers || !Array.isArray(targets) || !targets.length || !Number.isFinite(tolerance) || tolerance <= 0 || tolerance > .5) return false;
  return targets.every(t => {
    const p = controllers[t.side];
    if (!p || ![p.x, p.y, p.z, t.x, t.y, t.z].every(Number.isFinite)) return false;
    return Math.hypot(p.x - t.x, p.y - t.y, p.z - t.z) <= tolerance;
  });
}
export function danceReceipt({ style, bpm, posture, hits, completedBeats }) {
  const validBeats = Number.isInteger(completedBeats) ? Math.max(0, Math.min(DANCE_BEATS, completedBeats)) : 0;
  const validHits = Number.isInteger(hits) ? Math.max(0, Math.min(validBeats, hits)) : 0;
  return {
    schema: 'pulse369.danceflow-r0.v1', provenance: 'LOCAL_UNVERIFIED',
    style: Object.hasOwn(DANCE_STYLES, style) ? style : 'unknown',
    bpm: DANCE_TEMPOS.includes(bpm) ? bpm : null,
    posture: posture === 'seated' ? 'seated' : 'standing',
    offeredCounts: validBeats, matchedControllerCues: validHits,
    limits: 'Controller proximity to authored cues only; not footwork, full-body dance accuracy, calories, heart rate, or validated fitness performance.'
  };
}
