/**
 * Pulse 369 Quest First-Run Acceptance.
 * Manual observations, never device attestation. Browser-memory only.
 * No persistent logs, free text, coordinates, audio, IPs or device IDs.
 */
export const MANUAL_CHECKS = Object.freeze([
  {id:'https_xr', phase:'Setup', label:'Quest Browser on HTTPS reports immersive VR available', critical:true, link:'quest.html'},
  {id:'xr_enter', phase:'Headset', label:'VR starts only after explicitly pressing Enter VR', critical:true, link:'quest.html'},
  {id:'floor_targets', phase:'Headset', label:'Two ring targets appear comfortably ahead after tracking', critical:true, link:'quest.html'},
  {id:'controllers', phase:'Headset', label:'Both left and right controllers register target contacts', critical:true, link:'quest.html'},
  {id:'grip_recenter', phase:'Headset', label:'Grip squeeze recenters rings in front of new facing', critical:true, link:'quest.html'},
  {id:'trigger_exit', phase:'Headset', label:'Trigger or system menu safely exits VR; re-entry works', critical:true, link:'quest.html'},
  {id:'seated', phase:'Comfort', label:'Seated target setting is reachable without leaning or strain', critical:false, link:'quest.html'},
  {id:'rhythm', phase:'Rhythm', label:'24-beat visual drill alternates sides and respects correct hand', critical:false, link:'quest.html'},
  {id:'music_preflight', phase:'Local music', label:'Valid MP3/WAV decodes; corrupt and short tracks fail before VR', critical:false, link:'music.html'},
  {id:'preview', phase:'Local music', label:'8-second local music preview starts and stops in browser', critical:false, link:'music.html'},
  {id:'music_vr', phase:'Local music', label:'Local audio, beat cues, grip recenter and exit work in headset', critical:false, link:'music.html'},
  {id:'anonymous_receipt', phase:'Evidence', label:'Copied rhythm receipt has no song name, pose or hardware ID', critical:false, link:'music.html'},
  {id:'compare', phase:'Evidence', label:'QA Compare accepts a receipt without claiming hardware proof', critical:false, link:'compare.html'},
]);
export const MANUAL_STATES=Object.freeze(['not_run','pass','fail','blocked']);
export const MANUAL_DEVICES=Object.freeze(['unrecorded','quest3','other_headset','desktop_only']);
const validObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

export function normalizeManualResults(input={}) {
  const src=validObject(input)?input:{};
  return Object.fromEntries(MANUAL_CHECKS.map(check=>[
    check.id,MANUAL_STATES.includes(src[check.id])?src[check.id]:'not_run'
  ]));
}

export function manualGate(results, device='unrecorded') {
  const values=normalizeManualResults(results);
  const checks=MANUAL_CHECKS.map(check=>({...check,status:values[check.id]}));
  const counts=Object.fromEntries(MANUAL_STATES.map(state=>[
    state,checks.filter(x=>x.status===state).length
  ]));
  const core=checks.filter(x=>x.critical);
  let gate,description;
  if (checks.some(x=>x.status==='fail')) {
    gate='FAILURE_REPORTED';
    description='At least one manual failure was reported. Investigate before calling the Quest experience ready.';
  } else if(device!=='quest3' && device!=='other_headset') {
    gate='HEADSET_NOT_ATTESTED';
    description='Headset testing has not been self-declared. A desktop run cannot qualify as a headset check.';
  } else if(core.some(x=>x.status!=='pass')) {
    gate='CORE_HARDWARE_INCOMPLETE';
    description='A critical immersive-session, tracking, recenter or safe-exit check is missing or blocked.';
  } else if(checks.some(x=>x.status==='blocked')) {
    gate='BLOCKED_OBSERVATIONS';
    description='Critical checks are reported passing but optional checks remain blocked.';
  } else if(checks.some(x=>x.status==='not_run')) {
    gate='CORE_PASS_REPORTED_MORE_TO_TEST';
    description='Core headset steps are self-reported passing, but not every planned check was run.';
  } else {
    gate='MANUAL_REVIEW_CANDIDATE';
    description='All checklist steps are self-reported passing. Independent device/feature verification is still absent.';
  }
  return {
    gate,description,counts,
    coreComplete:core.every(x=>x.status==='pass'),
    selfReportedHeadset:device==='quest3'||device==='other_headset'
  };
}

export function createManualAcceptanceReceipt({device,results}={}) {
  const safeDevice=MANUAL_DEVICES.includes(device)?device:'unrecorded';
  const observations=normalizeManualResults(results);
  const summary=manualGate(observations,safeDevice);
  return {
    schema:'pulse369.quest-first-run-manual.v1',
    evidenceOrigin:'MANUAL_SELF_REPORTED_UNVERIFIED',
    hardwareVerified:false,
    deviceCategory:safeDevice,
    releaseGate:summary.gate,
    explanation:summary.description,
    counts:summary.counts,
    checks:MANUAL_CHECKS.map(check=>({
      id:check.id,
      state:observations[check.id],
      critical:check.critical
    })),
    warning:'Manual self-report only. Passing CI or completing this checklist does not prove Quest hardware correctness.'
  };
}
