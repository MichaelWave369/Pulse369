import test from 'node:test';import assert from 'node:assert/strict';
import {spectrumBands,createTransientGate,normalizedWorldAudio,ZERO_WORLD_AUDIO} from './world-audio-frame.mjs';
const signal=(hz,sampleRate=48000,fftSize=2048)=>{const a=new Uint8Array(fftSize/2);a[Math.round(hz*fftSize/sampleRate)]=230;return a;};
test('FFT bands isolate bass, mid and high from real bin inputs',()=>{
 const b=spectrumBands(signal(95),48000,2048),m=spectrumBands(signal(1000),48000,2048),h=spectrumBands(signal(3900),48000,2048);
 assert.ok(b.bass>0&&b.mid===0&&b.high===0);
 assert.ok(m.mid>0&&m.bass===0&&m.high===0);
 assert.ok(h.high>0&&h.bass===0&&h.mid===0);
 assert.deepEqual(spectrumBands(new Uint8Array(1024),48000,2048),ZERO_WORLD_AUDIO);
});
test('hard bounded and fail-closed on untrusted spectrum inputs',()=>{
 assert.throws(()=>spectrumBands(new Uint8Array(20),48000,2048));
 assert.throws(()=>spectrumBands(signal(100),Infinity,2048));
 assert.throws(()=>spectrumBands(signal(100),48000,2048,3));
 assert.throws(()=>normalizedWorldAudio({...ZERO_WORLD_AUDIO,bass:NaN}));
 assert.throws(()=>normalizedWorldAudio({...ZERO_WORLD_AUDIO,beat:3}));
 assert.deepEqual(normalizedWorldAudio(null),ZERO_WORLD_AUDIO);
});
test('transient onset gate has refractory, decay, rewind and reset',()=>{
 const gate=createTransientGate();
 assert.equal(gate.next(.03,0),0);
 assert.equal(gate.next(.68,.04),1);
 assert.ok(gate.next(.68,.12)<1);
 assert.equal(gate.next(.72,.15)<1);
 gate.next(.03,.38);
 assert.equal(gate.next(.7,.42),1);
 gate.reset();
 assert.equal(gate.next(.65,.02),1);
});
