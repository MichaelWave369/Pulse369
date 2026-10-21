import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const REPO = 'https://github.com/MichaelWave369/Pulse369';
const ORIGINAL = 'https://pulse-369.larrina.chatgpt.site/';
const modes = [
  {name:'Rave flow', category:'ENERGY', symbol:'✦', detail:'Dance-style reach patterns and BPM-driven rhythm targets.'},
  {name:'Beat boxing', category:'ENERGY', symbol:'◈', detail:'High and low strikes, movement timing, and combos.'},
  {name:'Krav rhythm', category:'ENERGY', symbol:'⬡', detail:'Controlled defensive guard and reaction drills inspired by Krav Maga.'},
  {name:'Qigong · Eight Brocades', category:'FLOW', symbol:'◎', detail:'Slow, adapted Baduanjin movement cues with optional seated ranges.'},
  {name:'Tai chi flow', category:'FLOW', symbol:'◌', detail:'Mirrored hand guides and unhurried coordination practice.'},
  {name:'Slow flow yoga', category:'FLOW', symbol:'◐', detail:'Guided, gentle motion and visible step-by-step movement cues.'},
  {name:'369 breathing', category:'RECOVER', symbol:'◉', detail:'Comfortable pacing with a no-hold breathing alternative.'},
  {name:'Quiet mind', category:'RECOVER', symbol:'☾', detail:'Quiet sessions in calmer environments with reduced motion options.'},
  {name:'Release & reset', category:'RECOVER', symbol:'◇', detail:'Low-intensity mobility and stretching with seated options.'},
];
const worlds = [
  {name:'Neon Temple',tone:'violet',hint:'Emissive geometry and high-energy rhythm'},
  {name:'Orbital Rave',tone:'blue',hint:'A floating planetary stage'},
  {name:'Aurora Sanctuary',tone:'teal',hint:'Procedural skies, mountains and water'},
  {name:'Lantern Garden',tone:'orange',hint:'A moonlit pavilion and soft light'},
];
const filters = ['ALL','ENERGY','FLOW','RECOVER'];

function App() {
  const [filter,setFilter] = useState('ALL');
  const [selected,setSelected] = useState(0);
  const [menuOpen,setMenuOpen] = useState(false);
  const filtered = modes.map((mode,i) => ({...mode,index:i})).filter(mode => filter==='ALL'||mode.category===filter);
  const featured = modes[selected];
  const chooseFilter = next => {setFilter(next);setSelected(next==='ALL'?0:modes.findIndex(m=>m.category===next));};
  return <div className="shell">
    <header className="header">
      <a href="#home" className="logo"><span className="sigil">ϕ</span>PULSE <b>369</b></a>
      <button type="button" className="mobile-menu" aria-expanded={menuOpen} aria-controls="navigation" onClick={()=>setMenuOpen(!menuOpen)}>MENU {menuOpen?'×':'☰'}</button>
      <nav id="navigation" className={menuOpen?'open':''}>
        <a href="#modes" onClick={()=>setMenuOpen(false)}>THE MODES</a>
        <a href="#worlds" onClick={()=>setMenuOpen(false)}>THE WORLDS</a>
        <a href="quest.html" onClick={()=>setMenuOpen(false)}>QUEST LAB</a>
        <a href="music.html" onClick={()=>setMenuOpen(false)}>MUSIC LAB</a>
        <a href="dance.html" onClick={()=>setMenuOpen(false)}>DANCEFLOW</a>
        <a href="class.html" onClick={()=>setMenuOpen(false)}>CHOREOGRAPHER</a>
        <a href="create.html" onClick={()=>setMenuOpen(false)}>CHOREO CREATOR</a>
        <a href="academy.html" onClick={()=>setMenuOpen(false)}>DANCE ACADEMY</a>
        <a href="workout.html" onClick={()=>setMenuOpen(false)}>WORKOUT BUILDER</a>
        <a href="rehearsal.html" onClick={()=>setMenuOpen(false)}>DESKTOP REHEARSAL</a>
        <a href="compare.html" onClick={()=>setMenuOpen(false)}>QA COMPARE</a>
        <a href="first-run.html" onClick={()=>setMenuOpen(false)}>QUEST FIRST RUN</a>
        <a href="#build" onClick={()=>setMenuOpen(false)}>THE BUILD</a>
        <a href={REPO} target="_blank" rel="noreferrer">GITHUB ↗</a>
      </nav>
    </header>
    <main>
      <section id="home" className="hero">
        <div className="hero-text">
          <p className="eyebrow"><span className="dot"/> VR FITNESS / MUSIC / MINDFULNESS</p>
          <h1>FIND YOUR<br/><em>PULSE<span>.</span></em></h1>
          <h2>MOVE. FOCUS. RECOVER.</h2>
          <p>Train to your own rhythm. Discover new worlds. Recover on your terms. Pulse 369 explores where movement, music and community meet.</p>
          <div className="actions"><a className="btn solid" href="#modes">EXPLORE MODES ↗</a><a className="btn outline" href={REPO} target="_blank" rel="noreferrer">VIEW SOURCE ↗</a><a className="btn outline" href="quest.html">QUEST 3 LAB ↗</a><a className="btn outline" href="music.html">LOCAL MUSIC LAB ↗</a><a className="btn outline" href="dance.html">DANCEFLOW LAB ↗</a><a className="btn outline" href="class.html">DANCE CLASS ↗</a><a className="btn outline" href="create.html">BUILD A DANCE ↗</a><a className="btn outline" href="academy.html">LEARN TO DANCE ↗</a><a className="btn outline" href="workout.html">BUILD A WORKOUT ↗</a></div>
          <p className="note">PUBLIC SHOWCASE · NO ACCOUNT · NO USER TRACKING</p>
        </div>
        <div className="hero-visual" role="img" aria-label="Abstract neon pulse rings surrounding the number 369">
          <div className="ring back"/><div className="ring middle"/><div className="ring front"/><div className="core"><strong>369</strong><small>FIND YOUR FREQUENCY</small></div>
        </div>
      </section>
      <div className="stats"><div><strong>09</strong><span>TRAINING MODES</span></div><div><strong>40</strong><span>SESSION PRESETS</span></div><div><strong>04</strong><span>3D WORLDS</span></div><div><strong>04</strong><span>TRAINING PATHS</span></div></div>
      <section id="modes" className="section">
        <div className="section-head"><div><p className="eyebrow">[ 01 / MOVE ]</p><h2>ONE BODY.<br/><em>MANY RHYTHMS.</em></h2></div><p>Nine ways to move, focus and restore. Select a mode to learn about the v5 training engine.</p></div>
        <div className="filters" role="group" aria-label="Filter workout modes">{filters.map(item=><button type="button" key={item} className={filter===item?'active':''} aria-pressed={filter===item} onClick={()=>chooseFilter(item)}>{item==='ALL'?'ALL NINE':item}</button>)}</div>
        <div className="mode-layout">
          <div className="cards">{filtered.map(mode=><button type="button" className={mode.index===selected?'mode selected':'mode'} aria-pressed={mode.index===selected} key={mode.name} onClick={()=>setSelected(mode.index)}><span className="card-top">{String(mode.index+1).padStart(2,'0')} / {mode.category}<span>↗</span></span><b className="glyph">{mode.symbol}</b><strong>{mode.name}</strong></button>)}</div>
          <aside className="detail" aria-live="polite"><p className="eyebrow">SELECTED FREQUENCY</p><div className="detail-glyph" aria-hidden="true">{featured.symbol}</div><p>{featured.category} / {String(selected+1).padStart(2,'0')}</p><h3>{featured.name}</h3><p>{featured.detail}</p><small>Mode descriptions reference the v5 source. This showcase does not run real workouts or verify physical form.</small></aside>
        </div>
      </section>
      <section id="worlds" className="section world-section">
        <div className="section-head"><div><p className="eyebrow">[ 02 / EXPLORE ]</p><h2>STEP INTO<br/><em>ANOTHER WORLD.</em></h2></div><p>The full source contains four procedural Three.js environments built for browser and supported WebXR headsets.</p></div>
        <div className="worlds">{worlds.map((world,i)=><article className={'world '+world.tone} key={world.name}><span>0{i+1} / 04</span><div className="world-ring" aria-hidden="true"/><div><h3>{world.name}</h3><p>{world.hint}</p></div></article>)}</div>
        <p className="caption">Conceptual illustrations only. These are not screenshots of the 3D worlds.</p>
      </section>
      <section id="build" className="build"><div className="build-inner"><div><p className="eyebrow">[ 03 / THE BUILD ]</p><h2>BUILT TO<br/><em>KEEP MOVING.</em></h2><p>Built with React, Three.js, WebXR, and Cloudflare Worker integrations. The original v5 project includes imported audio, adaptive game coaches, clan and room systems, progression and achievements.</p><div className="tags"><span>REACT 19</span><span>THREE.JS</span><span>WEBXR</span><span>D1 + R2</span></div><a href={REPO} className="btn solid" target="_blank" rel="noreferrer">EXPLORE THE SOURCE ↗</a></div>
        <div className="status"><p className="eyebrow">PUBLIC / PRIVATE BOUNDARY</p><div><i className="ok"/> PUBLIC REACT SHOWCASE <b>THIS SITE</b></div><div><i className="ok"/> SOURCE AND CI <b>GITHUB</b></div><div><i className="pending"/> STANDALONE APP BACKEND <b>NOT DEPLOYED</b></div><div><i className="pending"/> DEVICE VR TESTS <b>NOT VERIFIED</b></div><p>This page has no accounts, music uploads, progress tracking or health data. The hosted prototype uses separate access requirements.</p><a href={ORIGINAL} target="_blank" rel="noreferrer">ORIGINAL HOSTED PROTOTYPE ↗</a></div></div></section>
    </main>
    <footer><strong><span>ϕ</span> PULSE 369</strong><p>TRAIN YOUR RHYTHM. RESPECT YOUR LIMITS.</p><a href="#home">BACK TO TOP ↑</a><small>Created by Michael Hughes · A fitness-inspired software prototype, not medical advice or martial-arts certification. Stop if you feel pain or dizziness.</small></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);