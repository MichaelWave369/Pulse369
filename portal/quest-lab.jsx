import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import './styles.css';
import './quest-lab.css';
import { computeReachLayout, makeQuestReceipt } from './quest-math.mjs';
import { beatNear, classifyRhythmTouch, summarizeRhythm, RHYTHM_BEATS, RHYTHM_LEAD_IN_MS } from './quest-rhythm.mjs';

// Original test implementation inspired by the debugging approach of MIT-licensed
// Supermedium Moon Rider. No Moon Rider source or assets were copied.
function QuestLab() {
  const host = useRef(null);
  const running = useRef(null);
  const [support, setSupport] = useState('Checking WebXR…');
  const [state, setState] = useState('idle');
  const [notice, setNotice] = useState('Not running.');
  const [posture, setPosture] = useState('standing');
  const [drill, setDrill] = useState('touch');
  const [tempo, setTempo] = useState(120);
  const [receipt, setReceipt] = useState(null);
  const [reading, setReading] = useState({ controllers: 0, left: 0, right: 0, height: '—', recenters: 0, beat: '—' });

  useEffect(() => {
    let mounted = true;
    if (!window.isSecureContext || !navigator.xr) {
      setSupport('HTTPS and a WebXR-capable headset browser are required.');
      return;
    }
    navigator.xr.isSessionSupported('immersive-vr')
      .then(ok => { if (mounted) setSupport(ok ? 'Immersive VR available' : 'Immersive VR not available'); })
      .catch(err => { if (mounted) setSupport('WebXR check failed: ' + err.message); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => () => {
    if (running.current) void running.current.session.end().catch(() => {});
  }, []);

  const enter = async () => {
    if (state !== 'idle' || !navigator.xr) return;
    setReceipt(null);
    setReading({ controllers: 0, left: 0, right: 0, height: '—', recenters: 0, beat: '—' });
    setState('starting');
    setNotice('Requesting immersive-vr / local-floor permission…');
    let session;
    try {
      // Called directly from the button: WebXR requires transient user activation.
      session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor']
      });
    } catch (e) {
      setState('idle');
      setNotice('Could not start VR: ' + (e?.message || 'Permission denied'));
      return;
    }

    let renderer;
    let scene;
    let ended = false;
    const touches = [0, 0];
    let maxControllers = 0;
    let recenterCount = 0;
    const startMillis = Date.now();
    const acceptedBeats = new Set();
    const signedTimingErrors = [];
    let beatAnchor = null; // Set on first immersive animation frame.
    const periodMs = 60000 / tempo;
    const cleanup = () => {
      if (ended) return;
      ended = true;
      renderer?.setAnimationLoop(null);
      scene?.traverse(obj => {
        obj.geometry?.dispose();
        for (const mat of (Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [])) {
          mat.map?.dispose();
          mat.dispose();
        }
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      running.current = null;
      const baseReceipt = makeQuestReceipt({
        posture, touches, controllers: maxControllers, recenters: Math.max(0, recenterCount - 1),
        elapsedMs: Date.now() - startMillis
      });
      // Rhythm results are aggregate-only. Raw contact times never leave memory.
      setReceipt(drill === 'rhythm' ? {
        ...baseReceipt,
        schema: 'pulse369.quest-diagnostic.v2',
        rhythm: summarizeRhythm(signedTimingErrors, tempo)
      } : baseReceipt);
      setState('idle');
      setNotice('Session ended. You can copy the anonymous QA result below.');
    };
    session.addEventListener('end', cleanup, { once: true });

    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(1);
      renderer.setSize(640, 360);
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local-floor');
      host.current.appendChild(renderer.domElement);
      scene = new THREE.Scene();
      scene.background = new THREE.Color('#0a1425');
      const camera = new THREE.PerspectiveCamera(65, 640 / 360, .05, 50);
      camera.position.set(0, 1.55, 0);
      camera.lookAt(0, 1.35, -1);
      scene.add(new THREE.GridHelper(4, 12, 0x82c3dd, 0x344d6b));
      const source = [null, null];
      const grips = [];
      const touching = [false, false];
      let recenterRequested = true;
      const viewForward = new THREE.Vector3();
      // Built once; stays in the scene and is cleaned up on session end.
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot create VR instructions panel.');
      ctx.fillStyle = '#111c32'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#c7f876'; ctx.lineWidth = 6; ctx.strokeRect(4,4,1016,152);
      ctx.fillStyle = '#c7f876'; ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('PULSE 369 · QUEST LAB', 512, 60);
      ctx.fillStyle = '#e6f4ff'; ctx.font = '32px sans-serif';
      ctx.fillText(drill === 'rhythm' ? 'ALTERNATE HANDS ON THE BEAT' : 'GRIP = RECENTER   |   TRIGGER = EXIT', 512, 120);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.75,.28),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, side: THREE.DoubleSide })
      );
      label.visible = false;
      scene.add(label);
      const targets = [-.43, .43].map((x, side) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(.18, .035, 10, 32),
          new THREE.MeshBasicMaterial({ color: side ? 0xc7f876 : 0xc1a4ff })
        );
        ring.position.set(x, 1.35, -.8);
        ring.visible = false; // Visible only after a valid headset-relative calibration.
        scene.add(ring);
        return ring;
      });
      for (let index = 0; index < 2; index++) {
        const grip = renderer.xr.getControllerGrip(index);
        const controller = renderer.xr.getController(index);
        const hand = new THREE.Mesh(
          new THREE.SphereGeometry(.055, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0xf6f7ff })
        );
        grip.add(hand);
        scene.add(grip, controller);
        grips.push(grip);
        controller.addEventListener('connected', event => { source[index] = event.data; hand.visible = true; });
        controller.addEventListener('disconnected', () => { source[index] = null; touching[index] = false; hand.visible = false; });
        hand.visible = false;
        controller.addEventListener('selectstart', () => { void session.end().catch(() => {}); });
        controller.addEventListener('squeezestart', () => { recenterRequested = true; });
      }
      running.current = { session };
      await renderer.xr.setSession(session);
      setState('active');
      setNotice(drill === 'rhythm'
        ? 'Follow 24 alternating highlighted rings at ' + tempo + ' BPM. Touch gently near each visual beat. Grip recenters; trigger exits.'
        : 'Touch a matching-color ring gently with each controller. Press any trigger to exit.');
      const pos = new THREE.Vector3();
      const head = new THREE.Vector3();
      let lastReport = 0;
      renderer.setAnimationLoop(now => {
        if (ended) return;
        if (beatAnchor === null) beatAnchor = now + RHYTHM_LEAD_IN_MS;
        const xrCamera = renderer.xr.getCamera();
        xrCamera.getWorldPosition(head);
        if (recenterRequested) {
          xrCamera.getWorldDirection(viewForward);
          const layout = computeReachLayout(head, viewForward, posture);
          if (layout) {
            targets[0].position.fromArray(layout.left);
            targets[1].position.fromArray(layout.right);
            for (const target of targets) target.visible = true;
            label.position.fromArray(layout.label);
            label.rotation.y = layout.labelYaw;
            label.visible = true;
            touching.fill(false);
            recenterCount++;
            recenterRequested = false;
          }
        }
        maxControllers = Math.max(maxControllers, source.filter(Boolean).length);
        // Anticipation cue only: not a physical reaction-time or audio-latency measure.
        const targetCueScale = [1, 1];
        if (drill === 'rhythm') {
          const nextIndex = Math.ceil((now - beatAnchor) / periodMs);
          if (nextIndex >= 0 && nextIndex < RHYTHM_BEATS) {
            const until = beatAnchor + nextIndex * periodMs - now;
            if (until >= 0 && until <= 300) targetCueScale[nextIndex % 2] = 1.12 + .17 * (1 - until / 300);
          }
          const nearest = beatNear(now, beatAnchor, tempo);
          if (nearest && Math.abs(nearest.errorMs) < 125) {
            targetCueScale[nearest.index % 2] = 1.3;
          }
        }
        for (let i = 0; i < targets.length; i++) {
          targets[i].material.color.setHex(targetCueScale[i] > 1 ? 0xffffff : (i === 0 ? 0xc1a4ff : 0xc7f876));
          targets[i].scale.setScalar(targetCueScale[i]);
        }
        for (let index = 0; index < grips.length; index++) {
          const input = source[index];
          if (!input) continue;
          const side = input.handedness === 'left' ? 0 : input.handedness === 'right' ? 1 : -1;
          if (side < 0) continue;
          grips[index].getWorldPosition(pos);
          const near = targets[side].visible && !recenterRequested && pos.distanceTo(targets[side].position) < .21;
          if (near && !touching[index]) {
            let accepted = true;
            if (drill === 'rhythm') {
              const beat = classifyRhythmTouch(now, beatAnchor, tempo, input.handedness, acceptedBeats);
              accepted = Boolean(beat);
              if (beat) {
                acceptedBeats.add(beat.index);
                signedTimingErrors.push(beat.errorMs);
              }
            }
            if (accepted) {
              touches[side]++;
              try {
              const actuator = input.gamepad?.hapticActuators?.[0];
              if (actuator?.pulse) {
                Promise.resolve(actuator.pulse(.3, 45)).catch(() => {});
              } else if (input.gamepad?.vibrationActuator?.playEffect) {
                Promise.resolve(input.gamepad.vibrationActuator.playEffect('dual-rumble', {
                  duration: 45, strongMagnitude: .3, weakMagnitude: .2
                })).catch(() => {});
              }
              } catch { /* No optional haptic support. */ }
            }
          }
          touching[index] = near;
          targets[side].scale.setScalar(near ? 1.35 : targetCueScale[side]);
        }
        if (now - lastReport > 300) {
          lastReport = now;
          setReading({
            controllers: source.filter(Boolean).length,
            left: touches[0], right: touches[1], height: head.y.toFixed(2) + 'm',
            recenters: Math.max(0, recenterCount - 1),
            beat: drill === 'rhythm'
              ? (Math.max(0, Math.min(RHYTHM_BEATS, Math.floor((now - beatAnchor) / periodMs) + 1)) + ' / ' + RHYTHM_BEATS)
              : '—'
          });
        }
        renderer.render(scene, camera);
      });
    } catch (error) {
      setNotice('VR scene error: ' + (error?.message || 'Unknown error'));
      try { await session.end(); } catch { cleanup(); }
    }
  };
  const exit = () => {
    if (running.current) void running.current.session.end().catch(e => setNotice(e.message));
  };
  const copyReceipt = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
      setNotice('Anonymous Quest QA receipt copied to clipboard.');
    } catch {
      setNotice('Clipboard not available. Select and copy the receipt text below.');
    }
  };

  return <div className="shell quest-shell">
    <header className="quest-header"><a className="logo" href="./"><span className="sigil">ϕ</span>PULSE <b>369</b></a><a href="./">← PUBLIC PORTAL</a></header>
    <main className="quest-main">
      <p className="eyebrow">OPEN WEBXR / QUEST 3 / LOCAL-ONLY QA</p>
      <h1>QUEST <em>LAB.</em></h1>
      <p className="quest-sub">A tiny hardware smoke test inspired by <a href="https://github.com/supermedium/moonrider" rel="noreferrer" target="_blank">Supermedium's open-source Moon Rider ↗</a>. No account required. No music, pose telemetry, or medical information is uploaded.</p>
      <div className="quest-grid">
        <section className="quest-card">
          <h2>01 / START THE TEST</h2>
          <p><strong>{support}</strong></p>
          <p>On your Quest 3, open this page in Quest Browser over HTTPS. Clear a comfortable space, then enter VR.</p>
          <p>The targets will appear in front of your headset after tracking starts, at a comfortable test height for the selected option. Gently touch each ring with its matching controller. Squeeze either grip to recenter. Press either trigger or use the Quest system menu to exit.</p>
          <fieldset className="quest-posture" disabled={state !== 'idle'}><legend>TEST SETUP</legend>
            <label><input type="radio" name="posture" checked={posture==='standing'} onChange={()=>setPosture('standing')}/> Standing reach</label>
            <label><input type="radio" name="posture" checked={posture==='seated'} onChange={()=>setPosture('seated')}/> Seated reach</label>
          </fieldset>
          <fieldset className="quest-posture" disabled={state !== 'idle'}><legend>TEST TYPE</legend>
            <label><input type="radio" name="drill" checked={drill==='touch'} onChange={()=>setDrill('touch')}/> Free touch</label>
            <label><input type="radio" name="drill" checked={drill==='rhythm'} onChange={()=>setDrill('rhythm')}/> Visual rhythm (24 beats)</label>
          </fieldset>
          {drill === 'rhythm' && <label className="quest-tempo">VISUAL TEMPO
            <select disabled={state !== 'idle'} value={tempo} onChange={e=>setTempo(Number(e.target.value))}>
              <option value={90}>90 BPM · gentle</option>
              <option value={120}>120 BPM · moderate</option>
            </select>
            <small>No music plays. Each alternating ring brightens just before its scheduled beat. Step out between touches.</small>
          </label>}
          <div className="quest-actions"><button disabled={state!=='idle'||!navigator.xr} onClick={enter}>ENTER VR ↗</button><button className="secondary" disabled={state!=='active'} onClick={exit}>EXIT VR</button></div>
          <p role="status" className="notice">{notice}</p>
          <div ref={host} className="quest-preview"><span>ISOLATED WEBXR TEST SCENE</span></div>
        </section>
        <section className="quest-card">
          <h2>02 / CONTROLLER READINGS</h2>
          <div className="quest-metrics">
            <div><span>TRACKED CONTROLLERS</span><strong>{reading.controllers} / 2</strong></div>
            <div><span>HEAD HEIGHT</span><strong>{reading.height}</strong></div>
            <div><span>LEFT ORB TOUCHES</span><strong>{reading.left}</strong></div>
            <div><span>RIGHT ORB TOUCHES</span><strong>{reading.right}</strong></div>
            <div><span>MANUAL RECENTERS</span><strong>{reading.recenters}</strong></div>
            <div><span>VISUAL BEAT</span><strong>{reading.beat}</strong></div>
          </div>
          <h2>03 / TEST LIMITS</h2>
          <p>This checks immersive VR permission, local-floor tracking, controller pose, basic target contact, optional vibration and (in rhythm mode) whether target-entry events fall near a scheduled visual beat. <strong>This does not measure display latency, controller latency, audio synchronization, music performance, or fitness accuracy.</strong></p>
          <p>Results exist only in memory. Nothing is saved or sent to a server. For comfort, stay in place and stop immediately if dizzy.</p>
          {receipt && <div className="quest-receipt"><h2>04 / SHARE ANONYMOUS QA</h2>
            <p>The receipt omits raw headset position, individual input timestamps, head height, hardware IDs, health information, identity, and uploaded music. Rhythm figures show only visual-beat timing aggregates.</p>
            <button type="button" onClick={copyReceipt}>COPY QA RECEIPT</button>
            <pre aria-label="Anonymous Quest test report">{JSON.stringify(receipt,null,2)}</pre>
          </div>}
        </section>
      </div>
      <footer className="quest-foot"><a href="https://github.com/MichaelWave369/Pulse369">SOURCE ↗</a><span>OPEN WEBXR · HEADSET DEVICE TESTING REQUIRED</span></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<QuestLab />);
