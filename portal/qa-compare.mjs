/**
 * Pulse 369 Local QA Compare.
 * Treat all pasted diagnostic receipts as UNTRUSTED self-reported JSON.
 * Structural checks do NOT authenticate hardware, provenance, or real events.
 * Parsed output is allowlisted and intentionally omits unknown input fields.
 */
export const MAX_RECEIPT_CHARS = 16384;
export const MAX_BEATS = 24;
export const MAX_HIT_WINDOW_MS = 220;

const SCHEMAS = Object.freeze({
  'pulse369.desktop-rehearsal.v1': { family: 'desktop', label: 'Desktop keyboard / tap' },
  'pulse369.local-music-lab.v1': { family: 'quest-audio', label: 'Quest local audio + controllers' },
  'pulse369.quest-diagnostic.v2': { family: 'quest-visual', label: 'Quest visual rhythm + controllers' },
  'pulse369.quest-diagnostic.v1': { family: 'quest-tracking', label: 'Quest controller tracking only' },
});

const object = item => item !== null && typeof item === 'object' && !Array.isArray(item);
const integer = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
const decimal = (n, lo, hi) => typeof n === 'number' && Number.isFinite(n) && n >= lo && n <= hi;
const invalid = reason => ({ ok: false, reason });

function validateRhythm(rhythm) {
  if (!object(rhythm) || rhythm.kind !== 'visual-beat-touch-drill') return 'Missing supported rhythm measurement.';
  if (rhythm.offeredBeats !== MAX_BEATS) return 'Only the 24-beat drill schema is supported.';
  if (!integer(rhythm.acceptedTouches, 0, MAX_BEATS)) return 'Invalid count of accepted touches.';
  if (!integer(rhythm.earlyTouches,0,MAX_BEATS) ||
      !integer(rhythm.lateTouches,0,MAX_BEATS) ||
      !integer(rhythm.onBeatTouches,0,MAX_BEATS) ||
      rhythm.earlyTouches + rhythm.lateTouches + rhythm.onBeatTouches !== rhythm.acceptedTouches) {
    return 'Early, late and on-beat counts do not match the accepted touches.';
  }
  if (!integer(rhythm.bpm,40,200)) return 'Invalid authored BPM.';
  if (rhythm.acceptedTouches === 0) {
    if (rhythm.meanAbsoluteErrorMs !== null || rhythm.medianSignedErrorMs !== null) {
      return 'Empty samples must not claim measured error.';
    }
  } else if (!decimal(rhythm.meanAbsoluteErrorMs,0,MAX_HIT_WINDOW_MS) ||
    !decimal(rhythm.medianSignedErrorMs,-MAX_HIT_WINDOW_MS,MAX_HIT_WINDOW_MS) ||
    Math.abs(rhythm.medianSignedErrorMs) > MAX_HIT_WINDOW_MS) {
    return 'Timing aggregates fall outside the supported window.';
  }
  return null;
}

function validateQuestFields(src) {
  if (src.vrSession !== 'ended') return 'Quest receipt must describe an ended session.';
  if (!['standing','seated'].includes(src.mode)) return 'Invalid Quest posture.';
  if (!integer(src.maxControllers,0,2)) return 'Invalid controller count.';
  if (!integer(src.recenterCount,0,10000)) return 'Invalid recenter count.';
  if (!object(src.touchCounts) ||
      !integer(src.touchCounts.left,0,100000) ||
      !integer(src.touchCounts.right,0,100000)) return 'Invalid controller contact counts.';
  if (!integer(src.durationSeconds,0,86400)) return 'Invalid session duration.';
  return null;
}

function validateAudioSettings(src, bpm) {
  if (!object(src.localMusic) || src.localMusic.source !== 'local-file-not-uploaded') return 'Missing local-only music declaration.';
  if (!integer(src.localMusic.manualBpm,60,180) || src.localMusic.manualBpm !== bpm) return 'Authored BPM does not match the receipt.';
  if (!integer(src.localMusic.manualBeatOffsetMs,0,1000)) return 'Invalid authored beat offset.';
  return null;
}

export function parsePulseReceipt(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return invalid('Paste one Pulse 369 QA receipt as JSON.');
  if (raw.length > MAX_RECEIPT_CHARS) return invalid('Receipt is too large for safe local inspection.');
  let src;
  try { src = JSON.parse(raw); }
  catch { return invalid('Could not parse JSON. Paste the complete receipt.'); }
  if (!object(src)) return invalid('Receipt must be a JSON object.');
  const kind = SCHEMAS[src.schema];
  if (!kind) return invalid('Unrecognized Pulse 369 receipt schema.');

  if (kind.family === 'desktop') {
    if (src.runtime !== 'desktop-browser' || src.input !== 'keyboard-or-screen-button') {
      return invalid('Desktop input identity does not match its schema.');
    }
    if (!['stopped','completed'].includes(src.exit) || !integer(src.durationSeconds,0,86400)) {
      return invalid('Invalid desktop run state or duration.');
    }
  } else {
    const error = validateQuestFields(src);
    if (error) return invalid(error);
  }

  if (kind.family !== 'quest-tracking') {
    const error = validateRhythm(src.rhythm);
    if (error) return invalid(error);
    if (kind.family !== 'quest-visual') {
      const musicError = validateAudioSettings(src,src.rhythm.bpm);
      if (musicError) return invalid(musicError);
    }
    if (kind.family !== 'desktop' &&
        src.touchCounts.left + src.touchCounts.right !== src.rhythm.acceptedTouches) {
      return invalid('Controller touch counts do not match the rhythm summary.');
    }
  }

  const settings = kind.family === 'desktop' || kind.family === 'quest-audio'
    ? { bpm: src.localMusic.manualBpm, offsetMs: src.localMusic.manualBeatOffsetMs, audioMode: 'local-audio' }
    : kind.family === 'quest-visual'
      ? { bpm: src.rhythm.bpm, offsetMs: null, audioMode: 'visual-only' }
      : { bpm: null, offsetMs: null, audioMode: 'no-rhythm' };

  const rhythm = kind.family === 'quest-tracking' ? null : {
    offered: src.rhythm.offeredBeats,
    accepted: src.rhythm.acceptedTouches,
    meanAbsMs: src.rhythm.meanAbsoluteErrorMs,
    medianSignedMs: src.rhythm.medianSignedErrorMs,
    early: src.rhythm.earlyTouches,
    late: src.rhythm.lateTouches,
    exactlyOn: src.rhythm.onBeatTouches,
  };
  return {
    ok: true,
    value: {
      schema: src.schema,
      family: kind.family,
      label: kind.label,
      source: 'USER_PASTED_UNVERIFIED',
      durationSeconds: src.durationSeconds,
      sessionResult: kind.family === 'desktop' ? src.exit : 'ended',
      inputMode: kind.family === 'desktop' ? 'keyboard-or-tap' : 'tracked-controller',
      controllerCount: kind.family === 'desktop' ? null : src.maxControllers,
      recenterCount: kind.family === 'desktop' ? null : src.recenterCount,
      settings, rhythm,
    },
  };
}

export function assessPair(left, right) {
  if (!left || !right) return {
    ready: false, level: 'INCOMPLETE',
    message: 'Paste two structurally valid receipts to inspect their protocols side by side.'
  };
  if (!left.rhythm || !right.rhythm) return {
    ready: true, level: 'DIFFERENT_PROTOCOLS',
    message: 'At least one receipt records tracking only. Rhythm timing cannot be compared.'
  };
  if (left.settings.audioMode !== right.settings.audioMode) return {
    ready: true, level: 'DIFFERENT_PROTOCOLS',
    message: 'One test uses local audio and the other a visual-only beat. Timing figures come from different protocols.'
  };
  if (left.settings.bpm !== right.settings.bpm ||
      left.settings.offsetMs !== right.settings.offsetMs) return {
    ready: true, level: 'DIFFERENT_SETTINGS',
    message: 'Authored tempo and/or offset differ. Treat the results as separate experiments.'
  };
  if (left.inputMode !== right.inputMode) return {
    ready: true, level: 'MATCHED_SETTINGS_NOT_COMPARABLE',
    message: 'Authored BPM and offset match, but keyboard/tap and tracked-controller inputs are different. This does not measure relative latency, skill, or device performance.'
  };
  return {
    ready: true, level: 'SAME_SETTINGS_NOT_CALIBRATED',
    message: 'Authored settings and input category match, but receipts do not identify audio, hardware, session conditions, or true latency. Results remain independent observations.'
  };
}

function minimal(value) {
  if (!value) return null;
  return {
    schema: value.schema,
    family: value.family,
    source: 'USER_PASTED_UNVERIFIED',
    durationSeconds: value.durationSeconds,
    settings: {...value.settings},
    rhythm: value.rhythm ? {...value.rhythm} : null,
  };
}
export function createInspectionReceipt(left, right) {
  const assessment = assessPair(left,right);
  return {
    schema: 'pulse369.local-qa-inspection.v1',
    status: assessment.level,
    verification: 'STRUCTURE_ONLY_NO_HARDWARE_ATTESTATION',
    question: 'Do these two user-pasted records have matching protocols and authored settings?',
    comparison: assessment.message,
    slotA: minimal(left),
    slotB: minimal(right),
    warning: 'No performance winner, clinical inference, hardware latency claim, file identity or device certification.',
  };
}
