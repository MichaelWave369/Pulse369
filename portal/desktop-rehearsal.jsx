import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  checkMusicSettings, preflightLocalAudio
} from './quest-local-music.mjs';
import {
  DESKTOP_LEAD_IN_SECONDS, handForKey, gradeDesktopHit,
  desktopBeatProgress, desktopNextCue, makeDesktopReceipt
} from './desktop-rhythm.mjs';
import { beatNear, RHYTHM_BEATS } from './quest-rhythm.mjs';
import './styles.css';
import './quest-lab.css';
import './music-lab.css';
import './desktop-rehearsal.css';

// This page never sends, stores, or fetches the selected local audio.
function DesktopRehearsal() {
  const decoded = useRef(null);
  const choiceVersion = useRef(0);
  const active = useRef(null);
  const [phase, setPhase] = useState('idle');
  const [fileStatus, setFileStatus] = useState('Choose a downloaded MP3 or WAV under 24 MB.');
  const [fileReady, setFileReady] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [offsetMs, setOffsetMs] = useState(0);
  const [notice, setNotice] = useState('Load a track, then test the beat using A and L.');
  const [display, setDisplay] = useState({beat:0, lit:null, left:0, right:0, next: '—'});
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const handleKey = event => {
      const hand = handForKey(event.key);
      if (!hand || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target?.closest?.('input,textarea,select,[contenteditable]')) return;
      if (!active.current?.press) return;
      event.preventDefault();
      active.current.press(hand);
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      choiceVersion.current++;
      active.current?.end('stopped', false);
      decoded.current = null;
    };
  }, []);

  async function chooseFile(event) {
    const version = ++choiceVersion.current;
    const file = event.target.files?.[0];
    decoded.current = null;
    setFileReady(false);
    setReceipt(null);
    if (!file) { setFileStatus('Choose a downloaded MP3 or WAV under 24 MB.'); return; }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) { setFileStatus('This browser cannot decode audio using Web Audio.'); return; }
    setFileStatus('Checking the audio locally…');
    let context;
    try {
      context = new AudioCtor();
      const buffer = await preflightLocalAudio(file, bytes => context.decodeAudioData(bytes));
      if (version !== choiceVersion.current) return;
      decoded.current = buffer;
      setFileReady(true);
      setFileStatus('Decoded locally: ' + file.name + ' · ' + buffer.duration.toFixed(1) + ' sec. No upload.');
    } catch (error) {
      if (version === choiceVersion.current) setFileStatus('Audio preflight failed: ' + error.message);
    } finally {
      if (context && context.state !== 'closed') await context.close().catch(() => {});
    }
  }

  function finish(reason = 'stopped') {
    active.current?.end(reason, true);
  }

  async function start() {
    if (active.current || phase !== 'idle' || !fileReady || !decoded.current) return;
    const problem = checkMusicSettings(bpm, offsetMs, decoded.current.duration);
    if (problem) { setNotice(problem); return; }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) { setNotice('Web Audio is unavailable.'); return; }
    let context;
    try {
      context = new AudioCtor({latencyHint: 'interactive'});
      const source = context.createBufferSource();
      source.buffer = decoded.current;
      const gain = context.createGain();
      gain.gain.value = .5;
      source.connect(gain);
      gain.connect(context.destination);
      const run = {
        context, source, gain, raf: 0, started: false, ended: false,
        startAt: 0, beganMs: Date.now(), seen: new Set(), errors: [],
        touches: [0, 0], press: null, end: null
      };
      run.end = (reason, publish = true) => {
        if (run.ended) return;
        run.ended = true;
        cancelAnimationFrame(run.raf);
        try { run.source.onended = null; run.source.stop(); } catch {}
        try { run.source.disconnect(); run.gain.disconnect(); } catch {}
        if (run.context.state !== 'closed') void run.context.close().catch(() => {});
        if (active.current === run) active.current = null;
        if (publish) {
          if (run.started) {
            setReceipt(makeDesktopReceipt({
              bpm, offsetMs, errors: run.errors,
              elapsedMs: Date.now() - run.beganMs, reason
            }));
          }
          setPhase('idle');
          setNotice(reason === 'completed'
            ? 'Completed the 24-beat rehearsal. Review your anonymous summary.'
            : 'Rehearsal stopped. No audio was saved or uploaded.');
        }
      };
      run.press = hand => {
        if (!run.started || run.ended) return;
        const hit = gradeDesktopHit(run.context.currentTime, run.startAt, bpm, offsetMs, hand, run.seen);
        if (hit) {
          run.seen.add(hit.index);
          run.errors.push(hit.errorMs);
          run.touches[hand === 'left' ? 0 : 1]++;
          setDisplay(old => ({
            ...old, left: run.touches[0], right: run.touches[1]
          }));
        }
      };
      source.onended = () => {
        if (active.current === run && !run.ended) run.end('stopped', true);
      };
      active.current = run; // Guards against a second click during AudioContext.resume().
      setPhase('starting');
      setReceipt(null);
      setDisplay({beat:0,lit:null,left:0,right:0,next:'—'});
      setNotice('Preparing an audio-clock scheduled rehearsal…');
      await context.resume();
      if (run.ended) return;
      run.startAt = context.currentTime + DESKTOP_LEAD_IN_SECONDS;
      run.started = true;
      source.start(run.startAt);
      setPhase('playing');
      setNotice('Playing locally. Press A for the left ring or L for the right ring near each visual beat.');
      let lastUI = -Infinity;
      const tick = time => {
        if (run.ended) return;
        const clock = context.currentTime;
        const next = desktopNextCue(clock, run.startAt, bpm, offsetMs);
        const nearest = beatNear((clock - run.startAt) * 1000, offsetMs, bpm);
        const lit = nearest && Math.abs(nearest.errorMs) <= 125
          ? nearest.hand
          : next && next.untilMs >= 0 && next.untilMs <= 190 ? next.hand : null;
        if (time - lastUI > 30) {
          lastUI = time;
          setDisplay({
            beat: desktopBeatProgress(clock,run.startAt,bpm,offsetMs),
            lit, left: run.touches[0], right: run.touches[1],
            next: clock < run.startAt ? 'COUNT-IN' : next ? (next.index+1)+' / '+RHYTHM_BEATS : 'FINISH'
          });
        }
        const afterLast = offsetMs / 1000 + (RHYTHM_BEATS - 1) * 60 / bpm + .7;
        if (clock - run.startAt > afterLast) {
          run.end('completed',true);
          return;
        }
        run.raf = requestAnimationFrame(tick);
      };
      run.raf = requestAnimationFrame(tick);
    } catch (error) {
      if (active.current?.end) active.current.end('stopped',true);
      else if (context && context.state !== 'closed') void context.close().catch(() => {});
      setPhase('idle');
      setNotice('Could not start rehearsal: '+ (error?.message || 'Unknown audio error'));
    }
  }

  const settingsError = fileReady && decoded.current
    ? checkMusicSettings(bpm,offsetMs,decoded.current.duration) : null;
  const copy = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(receipt,null,2));
      setNotice('Anonymous desktop rehearsal result copied.');
    } catch {
      setNotice('Clipboard unavailable. Select and copy the visible JSON below.');
    }
  };

  return <div className="shell quest-shell">
    <header className="quest-header">
      <a className="logo" href="./"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <a href="compare.html">QA COMPARE ↗</a>
      <a href="music.html">← MUSIC LAB</a>
    </header>
    <main className="quest-main">
      <p className="eyebrow">PULSE 369 / DESKTOP RHYTHM / LOCAL AUDIO</p>
      <h1>REHEARSAL <em>LAB.</em></h1>
      <p className="quest-sub">Test your own music and authored beat timings on the desktop before entering VR. Same local Web Audio timing logic, using A / L keys instead of VR controllers. No upload or headset required.</p>
      <div className="quest-grid">
        <section className="quest-card">
          <h2>01 / PREPARE</h2>
          <label className="music-picker">LOCAL MP3 OR WAV
            <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" aria-label="Choose local MP3 or WAV file"
              disabled={phase!=='idle'} onChange={chooseFile}/>
          </label>
          <p role="status">{fileStatus}</p>
          <div className="music-fields">
            <label>BPM
              <input type="number" min="60" max="180" step="1" value={bpm} disabled={phase!=='idle'}
                onChange={e=>setBpm(Number(e.target.value))}/>
            </label>
            <label>BEAT OFFSET (MS)
              <input type="number" min="0" max="1000" step="25" value={offsetMs} disabled={phase!=='idle'}
                onChange={e=>setOffsetMs(Number(e.target.value))}/>
            </label>
          </div>
          {settingsError && <p className="music-validation" role="alert">{settingsError}</p>}
          <div className="quest-actions">
            <button type="button" disabled={phase!=='idle'||!fileReady||Boolean(settingsError)} onClick={start}>START 24-BEAT REHEARSAL ↗</button>
            <button type="button" className="secondary" disabled={phase!=='starting'&&phase!=='playing'} onClick={()=>finish('stopped')}>STOP</button>
          </div>
          <p role="status" className="notice">{notice}</p>
          <div className="rehearsal-stage">
            <p className="rehearsal-count">BEAT {display.beat} / {RHYTHM_BEATS} <span>UP NEXT: {display.next}</span></p>
            <div className="rehearsal-targets">
              <button type="button" className={'rehearsal-hit left '+(display.lit==='left'?'lit':'')}
                disabled={phase!=='playing'} onClick={()=>active.current?.press('left')} aria-label="Left hand rhythm hit, keyboard A">
                <span>A</span><strong>LEFT</strong><small>{display.left} HITS</small>
              </button>
              <button type="button" className={'rehearsal-hit right '+(display.lit==='right'?'lit':'')}
                disabled={phase!=='playing'} onClick={()=>active.current?.press('right')} aria-label="Right hand rhythm hit, keyboard L">
                <span>L</span><strong>RIGHT</strong><small>{display.right} HITS</small>
              </button>
            </div>
            <p className="rehearsal-hint">Tap the highlighted side on the beat, alternating A / L. Use keyboard or click/tap. One successful hit per authored beat.</p>
          </div>
        </section>
        <section className="quest-card">
          <h2>02 / WHAT THIS TESTS</h2>
          <p>This helps catch wrong BPM, beat offset, file decode, and scoring problems using the same music clock as our headset Music Lab. An input only counts when it matches the intended side within the authored timing window.</p>
          <p>It does <strong>not</strong> measure input, display or speaker output latency, exercise form, human reaction time, or Quest tracking. Keyboard, mouse and touchscreen input have different delays than VR controllers.</p>
          <p>Private files stay in this browser tab. No account, backend request, song upload, localStorage or analytics are involved. Use downloaded music you have the right to play.</p>
          {receipt && <div className="quest-receipt">
            <h2>03 / ANONYMOUS RESULTS</h2>
            <p>Aggregate timing only. No song names, file bytes, keypress event history, or individual timestamps.</p>
            <button type="button" onClick={copy}>COPY QA RECEIPT</button>
            <pre aria-label="Anonymous rehearsal report">{JSON.stringify(receipt,null,2)}</pre>
          </div>}
        </section>
      </div>
      <footer className="quest-foot">
        <a href="https://github.com/MichaelWave369/Pulse369">SOURCE ↗</a>
        <span>DESKTOP MUSIC TEST · NO QUEST REQUIRED · NO AUDIO UPLOAD</span>
      </footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<DesktopRehearsal/>);
