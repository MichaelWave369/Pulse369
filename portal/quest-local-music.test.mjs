import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectAudioFile, checkMusicSettings, musicBeatAt, classifyMusicTouch, nextMusicBeat, MAX_AUDIO_FILE_BYTES } from './quest-local-music.mjs';

const mp3 = new Uint8Array([73,68,51,4,0,0,0,0,0,0,0,0]);
const wav = new Uint8Array([82,73,70,70,12,0,0,0,87,65,86,69]);
const file = (name,size=1024)=>({name,size});

test('accepts valid MP3 and WAV header signatures',()=>{
  assert.equal(inspectAudioFile(file('session.mp3'),mp3).ok,true);
  assert.equal(inspectAudioFile(file('session.wav'),wav).ok,true);
  assert.equal(inspectAudioFile(file('SESSION.WAV'),wav).format,'wav');
});
test('rejects mismatch, empty, oversize, and unsupported extensions',()=>{
  assert.equal(inspectAudioFile(file('track.wav'),mp3).ok,false);
  assert.equal(inspectAudioFile(file('track.exe'),mp3).ok,false);
  assert.equal(inspectAudioFile(file('track.mp3',0),mp3).ok,false);
  assert.equal(inspectAudioFile(file('track.wav',MAX_AUDIO_FILE_BYTES+1),wav).ok,false);
});
test('validates authored tempo, offset and sufficient track length',()=>{
  assert.equal(checkMusicSettings(120,0,15),null);
  assert.match(checkMusicSettings(200,0,30),/BPM/);
  assert.match(checkMusicSettings(120,2000,30),/offset/);
  assert.match(checkMusicSettings(60,1000,3),/at least/);
});
test('uses the SAME audio clock for authored beats and scoring',()=>{
  const time = 12.5;
  const b = musicBeatAt(time,12,120,0);
  assert.equal(b?.index,1);
  assert.equal(b?.errorMs,0);
  assert.equal(classifyMusicTouch(time,12,120,0,'right',new Set())?.index,1);
  assert.equal(classifyMusicTouch(time,12,120,0,'left',new Set()),null);
});
test('manual song offset moves the first beat without altering song start',()=>{
  assert.equal(musicBeatAt(20.25,20,120,250)?.index,0);
  assert.equal(classifyMusicTouch(20.25,20,120,250,'left',new Set())?.index,0);
  assert.equal(nextMusicBeat(20.10,20,120,250)?.index,0);
  assert.equal(nextMusicBeat(20.10,20,120,250)?.untilMs.toFixed(1),'150.0');
});
test('no beat after 24 authored prompts',()=>{
  assert.equal(musicBeatAt(40,10,120,0),null);
  assert.equal(nextMusicBeat(40,10,120,0),null);
});
