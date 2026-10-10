/**
 * Local-only Quest diagnostic geometry and shareable test summary.
 * Pure functions to keep the headset layout testable without WebXR hardware.
 */
export function computeReachLayout(head, forward, posture = 'standing') {
  if (!head || !forward || !['standing','seated'].includes(posture)) {
    throw new TypeError('Expected head position, direction, and posture');
  }
  for (const value of [head.x,head.y,head.z,forward.x,forward.z]) {
    if (!Number.isFinite(value)) throw new TypeError('Tracking coordinates must be finite');
  }
  const magnitude = Math.hypot(forward.x, forward.z);
  if (magnitude < 0.05 || head.y < 0.45 || head.y > 2.8) {
    return null; // Wait for a usable tracked frame.
  }
  const fx = forward.x / magnitude;
  const fz = forward.z / magnitude;
  const rightX = -fz;
  const rightZ = fx;
  const reachY = posture === 'seated'
    ? clamp(head.y - 0.27, 0.69, 1.22)
    : clamp(head.y - 0.3, 0.97, 1.76);
  const centerX = head.x + fx * 0.76;
  const centerZ = head.z + fz * 0.76;
  const spread = posture === 'seated' ? 0.28 : 0.33;
  return {
    left: [centerX - rightX * spread, reachY, centerZ - rightZ * spread],
    right: [centerX + rightX * spread, reachY, centerZ + rightZ * spread],
    label: [centerX, reachY + 0.49, centerZ],
    labelYaw: Math.atan2(-fx, -fz) || 0,
  };
}
function clamp(value, lo, hi) { return Math.min(hi, Math.max(lo, value)); }
const whole = value => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

/** No device ID, head/body measurements, pose data, account info or user music. */
export function makeQuestReceipt({ posture, touches, controllers, recenters, elapsedMs }) {
  return {
    schema: 'pulse369.quest-diagnostic.v1',
    mode: posture === 'seated' ? 'seated' : 'standing',
    vrSession: 'ended',
    maxControllers: Math.min(2, whole(controllers)),
    touchCounts: { left: whole(touches?.[0]), right: whole(touches?.[1]) },
    recenterCount: whole(recenters),
    durationSeconds: whole(elapsedMs / 1000),
    disclosure: 'Local headset smoke test only; not an exercise or medical assessment.',
  };
}
