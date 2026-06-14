// md-tokens.jsx — ManifestDaily design tokens, theme system, icons, primitives, data.
// Injects CSS variables for Cream Serenity (light) + dark, keyframes, and font setup.
// Exports primitives + data to window.

(function injectTokens() {
  if (document.getElementById('md-tokens')) return;
  const s = document.createElement('style');
  s.id = 'md-tokens';
  s.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&display=swap');

  :root{
    --md-bg:#FBF3E7; --md-bg2:#F4EADb; --md-card:#FFFDF9;
    --md-gold:#D6A87A; --md-gold-soft:#EAD3B4;
    --md-text:#3A3028; --md-text2:#7A6B5D; --md-border:#ECDFCE;
    --md-shadow:0 1px 2px rgba(58,48,40,.04), 0 8px 24px rgba(58,48,40,.07);
    --md-shadow-lg:0 2px 6px rgba(58,48,40,.05), 0 20px 50px rgba(58,48,40,.12);
    --md-accent:var(--md-gold);
    --md-accent-tint:rgba(214,168,122,.16);
    --md-on-accent:#3A3028;
  }
  html.md-dark{
    --md-bg:#171210; --md-bg2:#211913; --md-card:#29201A;
    --md-gold:#E0BB8C; --md-gold-soft:#5A4A36;
    --md-text:#F5EDE0; --md-text2:#9A8B7D; --md-border:#382C22;
    --md-shadow:0 1px 2px rgba(0,0,0,.3), 0 10px 28px rgba(0,0,0,.35);
    --md-shadow-lg:0 2px 6px rgba(0,0,0,.35), 0 24px 60px rgba(0,0,0,.5);
    --md-accent-tint:rgba(224,187,140,.16);
  }
  html.md-accent-gold { --md-accent:var(--md-gold); --md-accent-tint:rgba(214,168,122,.16); --md-on-accent:#3A3028; }

  /* ── Forest theme — light ──────────────────────────────────────── */
  /* bg: cool sage-tinted (not creamy); card: pure white (clear separation)  */
  /* primary: rich deep forest green — confident, not muted                  */
  html.md-forest{
    --md-bg:#EBF1E6; --md-bg2:#F2F7EE; --md-card:#FFFFFF;
    --md-gold:#17683F; --md-gold-soft:#C4DBC8;
    --md-text:#0E1B13; --md-text2:#4C6456; --md-border:#C8DECA;
    --md-shadow:0 1px 2px rgba(12,24,16,.06), 0 8px 24px rgba(12,24,16,.10);
    --md-shadow-lg:0 2px 6px rgba(12,24,16,.07), 0 20px 50px rgba(12,24,16,.15);
    --md-accent:#17683F; --md-accent-tint:rgba(23,104,63,.14); --md-on-accent:#FFFFFF;
  }
  /* ── Forest theme — dark ───────────────────────────────────────── */
  /* calm, grounded, premium — original successful values restored           */
  html.md-forest.md-dark{
    --md-bg:#0E1B16; --md-bg2:#15231D; --md-card:#1A2B24;
    --md-gold:#69C278; --md-gold-soft:#23362E;
    --md-text:#F3F6F2; --md-text2:#A5B0A7; --md-border:#2D4339;
    --md-shadow:0 1px 2px rgba(0,0,0,.3), 0 10px 28px rgba(0,0,0,.35);
    --md-shadow-lg:0 2px 6px rgba(0,0,0,.35), 0 24px 60px rgba(0,0,0,.5);
    --md-accent:#69C278; --md-accent-tint:rgba(105,194,120,.20); --md-on-accent:#0E1B16;
  }
  /* ── Forest canvas + body backgrounds ─────────────────────────── */
  html.md-forest body{ background:#E0EBD9; }
  html.md-forest.md-dark body{ background:#0a1410; }
  html.md-forest .design-canvas{ background:#E0EBD9 !important; }
  html.md-forest.md-dark .design-canvas{ background:#0a1410 !important; }

  /* ── Midnight Clarity theme — light ──────────────────────────── */
  /* warm parchment + deep gold; pairs with the full dark variant   */
  html.md-midnight{
    --md-bg:#FDFAF4; --md-bg2:#F6F1E8; --md-card:#FFFFFF;
    --md-gold:#C9A84C; --md-gold-soft:#F0E5CC;
    --md-text:#1C1710; --md-text2:#6B5C48; --md-border:rgba(201,168,76,.22);
    --md-shadow:0 1px 2px rgba(28,23,16,.05), 0 8px 24px rgba(28,23,16,.10);
    --md-shadow-lg:0 2px 6px rgba(28,23,16,.07), 0 20px 50px rgba(28,23,16,.14);
    --md-accent:#C9A84C; --md-accent-tint:rgba(201,168,76,.14); --md-on-accent:#1C1710;
  }
  /* ── Midnight Clarity theme — dark ───────────────────────────── */
  /* ink-black + warm gold; premium, focused, zero pastels          */
  html.md-midnight.md-dark{
    --md-bg:#0D1117; --md-bg2:#161B22; --md-card:#1E2530;
    --md-gold:#E8C97A; --md-gold-soft:#252D3A;
    --md-text:#F0EBE0; --md-text2:#A09890; --md-border:rgba(255,255,255,.06);
    --md-shadow:0 1px 2px rgba(0,0,0,.40), 0 10px 28px rgba(0,0,0,.45);
    --md-shadow-lg:0 2px 6px rgba(0,0,0,.45), 0 24px 60px rgba(0,0,0,.60);
    --md-accent:#E8C97A; --md-accent-tint:rgba(232,201,122,.12); --md-on-accent:#0D1117;
  }
  /* ── Midnight canvas + body backgrounds ──────────────────────── */
  html.md-midnight body{ background:#EDE8DE; }
  html.md-midnight.md-dark body{ background:#0A0E14; }
  html.md-midnight .design-canvas{ background:#EDE8DE !important; }
  html.md-midnight.md-dark .design-canvas{ background:#0A0E14 !important; }

  /* ── Morning Sky theme — light ─────────────────────────────── */
  /* crisp white + saturated sky-blue; fresh, energized, premium    */
  html.md-sky{
    --md-bg:#F5F9FF; --md-bg2:#EEF5FC; --md-card:#FFFFFF;
    --md-gold:#4A90D9; --md-gold-soft:#E8F3FD;
    --md-text:#1E3A52; --md-text2:#4A7A9B; --md-border:#D6E8F7;
    --md-shadow:0 1px 2px rgba(30,58,82,.04), 0 8px 24px rgba(30,58,82,.08);
    --md-shadow-lg:0 2px 6px rgba(30,58,82,.06), 0 20px 50px rgba(30,58,82,.12);
    --md-accent:#4A90D9; --md-accent-tint:rgba(74,144,217,.12); --md-on-accent:#FFFFFF;
  }
  /* ── Morning Sky theme — dark ──────────────────────────────── */
  /* deep navy night sky; blue-tinted dark complement               */
  html.md-sky.md-dark{
    --md-bg:#0D1826; --md-bg2:#131F30; --md-card:#1A2A3C;
    --md-gold:#5BAEE6; --md-gold-soft:#1E3350;
    --md-text:#E8F4FF; --md-text2:#7AADC8; --md-border:rgba(74,144,217,.15);
    --md-shadow:0 1px 2px rgba(0,0,0,.35), 0 10px 28px rgba(0,0,0,.40);
    --md-shadow-lg:0 2px 6px rgba(0,0,0,.40), 0 24px 60px rgba(0,0,0,.55);
    --md-accent:#5BAEE6; --md-accent-tint:rgba(91,174,230,.15); --md-on-accent:#FFFFFF;
  }
  /* ── Morning Sky canvas + body backgrounds ────────────────────── */
  html.md-sky body{ background:#DDEEF8; }
  html.md-sky.md-dark body{ background:#080F1C; }
  html.md-sky .design-canvas{ background:#DDEEF8 !important; }
  html.md-sky.md-dark .design-canvas{ background:#080F1C !important; }

  .md, .md *{ box-sizing:border-box; font-family:'DM Sans',-apple-system,system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
  .md-serif{ font-family:'DM Serif Display',Georgia,serif; }
  .md-screen{ background:var(--md-bg); color:var(--md-text); width:393px; height:852px; position:relative; overflow:hidden; transition:background .4s ease, color .4s ease; }

  /* keyframes */
  @keyframes md-breathe{ 0%,100%{transform:scale(.62);} 40%{transform:scale(1);} 60%{transform:scale(1);} }
  @keyframes md-flame{ 0%,100%{transform:scale(1) rotate(-1deg);opacity:1;} 50%{transform:scale(1.12) rotate(2deg);opacity:.88;} }
  @keyframes md-heart-pop{ 0%{transform:scale(1);} 35%{transform:scale(1.4);} 70%{transform:scale(.9);} 100%{transform:scale(1);} }
  @keyframes md-card-in{ from{opacity:0;transform:translateY(14px) scale(.985);} to{opacity:1;transform:none;} }
  @keyframes md-fade-up{ from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:none;} }
  @keyframes md-glow{ 0%{opacity:0;} 30%{opacity:1;} 100%{opacity:0;} }
  @keyframes md-spin{ to{transform:rotate(360deg);} }
  @keyframes md-breathe-loop{ 0%{transform:scale(.5);} 33%{transform:scale(1);} 66%{transform:scale(1);} 100%{transform:scale(.5);} }
  @keyframes md-fill-loop{ 0%{height:16%;} 33%{height:100%;} 66%{height:100%;} 100%{height:16%;} }
  @keyframes md-ring-rot{ 0%{transform:rotate(0) scale(.6);} 33%{transform:rotate(120deg) scale(1);} 66%{transform:rotate(180deg) scale(1);} 100%{transform:rotate(360deg) scale(.6);} }
  @keyframes md-blob-morph{ 0%,100%{border-radius:46% 54% 52% 48%/52% 46% 54% 48%; transform:scale(.62) rotate(0);} 33%{border-radius:54% 46% 48% 52%/46% 54% 48% 52%; transform:scale(1) rotate(40deg);} 66%{border-radius:50%; transform:scale(1) rotate(80deg);} }
  @keyframes md-confetti-fall{ to{transform:translateY(420px) rotate(620deg);opacity:0;} }
  @keyframes md-float{ 0%,100%{transform:translateY(0);} 50%{transform:translateY(-7px);} }
  @keyframes md-float-soft{ 0%,100%{transform:translateY(0) rotate(-1.2deg);} 50%{transform:translateY(-9px) rotate(1.2deg);} }
  @keyframes md-halo{ 0%,100%{opacity:.55; transform:scale(1);} 50%{opacity:.9; transform:scale(1.06);} }
  @keyframes md-word-in{ from{opacity:0; transform:translateY(10px); filter:blur(7px);} to{opacity:1; transform:translateY(0); filter:blur(0);} }
  @keyframes md-aff-glow{ 0%,100%{opacity:.4; transform:translate(-50%,0) scale(1);} 50%{opacity:.75; transform:translate(-50%,0) scale(1.12);} }
  @keyframes md-eyebrow-in{ from{opacity:0; letter-spacing:5px;} to{opacity:1; letter-spacing:2.5px;} }
  @keyframes md-rule-in{ from{transform:scaleX(0);} to{transform:scaleX(1);} }
  @keyframes md-drop-in{ from{opacity:0; transform:translateY(-26px) scale(.6);} 60%{opacity:1;} to{opacity:1; transform:translateY(0) scale(1);} }
  @keyframes md-lift-off{ from{opacity:1; transform:translateY(0) scale(1);} to{opacity:0; transform:translateY(-30px) scale(.7);} }
  @keyframes md-paper-open{ from{opacity:0; transform:scaleY(.55) translateY(-10px);} to{opacity:1; transform:scaleY(1) translateY(0);} }
  @keyframes md-seal-glow{ 0%,100%{opacity:.35; transform:translate(-50%,-50%) scale(1);} 50%{opacity:.8; transform:translate(-50%,-50%) scale(1.14);} }
  @keyframes md-flap-close{ from{transform:rotateX(180deg);} to{transform:rotateX(0deg);} }
  @keyframes md-flap-open{ from{transform:rotateX(0deg);} to{transform:rotateX(176deg);} }
  @keyframes md-fold-in{ from{opacity:1; transform:scale(1);} to{opacity:0; transform:scale(.82) translateY(8px);} }
  .md-press{ transition:transform .1s cubic-bezier(.2,.7,.3,1); }
  .md-press:active{ transform:scale(.97); }
  `;
  document.head.appendChild(s);
})();

// One-shot entrance animations inside the pan/zoom canvas leave the element
// promoted to a composite layer that Chrome fails to re-raster when the
// world transform changes (pan/zoom) — the content goes blank. Clearing the
// `animation` once it ends de-promotes the layer; the keyframe `to` state
// equals the element's natural state, so it stays visually correct.
if (typeof document !== 'undefined' && !window.__mdAnimCleanup) {
  window.__mdAnimCleanup = true;
  const oneShots = new Set(['md-card-in','md-fade-up']);
  document.addEventListener('animationend', (e) => {
    if (oneShots.has(e.animationName) && e.target && e.target.style) {
      e.target.style.animation = 'none';
    }
  }, true);
}

// ── Theme controller (global, persisted) ───────────────────────────
const MDTheme = {
  get dark(){ return document.documentElement.classList.contains('md-dark'); },
  setDark(v){ document.documentElement.classList.toggle('md-dark', v); localStorage.setItem('md-dark', v?'1':'0'); window.dispatchEvent(new Event('md-theme')); },
  toggle(){ this.setDark(!this.dark); },
  // 'cream' | 'forest' | 'midnight' | 'sky'
  get theme(){ return localStorage.getItem('md-theme') || 'cream'; },
  setTheme(t){
    document.documentElement.classList.toggle('md-forest',   t === 'forest');
    document.documentElement.classList.toggle('md-midnight', t === 'midnight');
    document.documentElement.classList.toggle('md-sky',      t === 'sky');
    localStorage.setItem('md-theme', t);
    window.dispatchEvent(new Event('md-theme'));
  },
  get accent(){ return localStorage.getItem('md-accent') || 'gold'; },
  setAccent(a){ document.documentElement.classList.add('md-accent-gold'); localStorage.setItem('md-accent','gold'); window.dispatchEvent(new Event('md-theme')); },
};
(function initTheme(){
  if (localStorage.getItem('md-dark')==='1') document.documentElement.classList.add('md-dark');
  // Restore theme — must run before setAccent so forest/midnight/sky vars are in place
  const t = localStorage.getItem('md-theme') || 'cream';
  document.documentElement.classList.toggle('md-forest',   t === 'forest');
  document.documentElement.classList.toggle('md-midnight', t === 'midnight');
  document.documentElement.classList.toggle('md-sky',      t === 'sky');
  MDTheme.setAccent(MDTheme.accent);
})();
function useTheme(){
  const [,f] = React.useState(0);
  React.useEffect(()=>{ const h=()=>f(x=>x+1); window.addEventListener('md-theme',h); return ()=>window.removeEventListener('md-theme',h); },[]);
  return { dark: MDTheme.dark, accent: MDTheme.accent, theme: MDTheme.theme };
}

// ── Icons (1.7 stroke, rounded, currentColor) ───────────────────────
function Icon({ name, size = 24, stroke = 1.7, fill = 'none', style }) {
  const p = { fill, stroke:'currentColor', strokeWidth:stroke, strokeLinecap:'round', strokeLinejoin:'round' };
  const paths = {
    home:    <><path {...p} d="M4 11l8-6.5L20 11"/><path {...p} d="M6 9.6V19h12V9.6"/></>,
    focus:   <><circle cx="12" cy="12" r="8" {...p}/><circle cx="12" cy="12" r="2.6" {...p} fill="currentColor" stroke="none"/></>,
    progress:<><path {...p} d="M5 19V10M12 19V5M19 19v-6"/></>,
    heart:   <path {...p} d="M12 20s-7-4.4-7-9.3C5 7.6 7 6 9 6c1.6 0 2.6.9 3 1.6C12.4 6.9 13.4 6 15 6c2 0 4 1.6 4 4.7C19 15.6 12 20 12 20z"/>,
    share:   <><path {...p} d="M12 15V4"/><path {...p} d="M8.5 7.5L12 4l3.5 3.5"/><path {...p} d="M6 12v6.5a1 1 0 001 1h10a1 1 0 001-1V12"/></>,
    bookmark:<path {...p} d="M7 4h10v16l-5-3.4L7 20z"/>,
    flame:   <path {...p} d="M12 3s4 3.2 4 7.5c0 1.3-.6 2.2-1.4 2.8.2-.8.1-2-1-3.1-.2 1.7-1.4 2.4-2.4 3.4C10 16 9 17.2 9 14.8c-1 .7-1.4 1.7-1.4 2.9C6.6 16.5 6 14.9 6 13 6 8 12 3 12 3z M12 21a4 4 0 004-4c0-2-2-3.6-4-5-2 1.4-4 3-4 5a4 4 0 004 4z"/>,
    wind:    <><path {...p} d="M3 9h11a2.5 2.5 0 10-2.5-2.5"/><path {...p} d="M3 14h15a2.5 2.5 0 11-2.5 2.5"/></>,
    play:    <path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor"/>,
    pause:   <><rect x="7" y="6" width="3.4" height="12" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.6" y="6" width="3.4" height="12" rx="1.2" fill="currentColor" stroke="none"/></>,
    check:   <path {...p} d="M5 12.5l4.5 4.5L19 7"/>,
    chevR:   <path {...p} d="M9 5l7 7-7 7"/>,
    chevL:   <path {...p} d="M15 5l-7 7 7 7"/>,
    chevD:   <path {...p} d="M5 9l7 7 7-7"/>,
    close:   <path {...p} d="M6 6l12 12M18 6L6 18"/>,
    plus:    <path {...p} d="M12 5v14M5 12h14"/>,
    sun:     <><circle cx="12" cy="12" r="4" {...p}/><path {...p} d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/></>,
    moon:    <path {...p} d="M20 14.5A8 8 0 019.5 4 7 7 0 1020 14.5z"/>,
    rain:    <><path {...p} d="M7 14a4 4 0 01-.5-7.97A5 5 0 0116.9 8.5 3.5 3.5 0 0117 14"/><path {...p} d="M8 17l-1 2.5M12 17l-1 2.5M16 17l-1 2.5"/></>,
    ocean:   <><path {...p} d="M3 9c2 0 2 1.5 4 1.5S9 9 11 9s2 1.5 4 1.5S17 9 19 9"/><path {...p} d="M3 14c2 0 2 1.5 4 1.5S9 14 11 14s2 1.5 4 1.5S17 14 19 14"/></>,
    forest:  <><path {...p} d="M12 3l4 6h-3l3 5h-8l3-5H8z"/><path {...p} d="M12 14v6"/></>,
    mute:    <><path {...p} d="M5 9v6h3l4 3V6L8 9z"/><path {...p} d="M16 9l4 6M20 9l-4 6"/></>,
    bell:    <><path {...p} d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path {...p} d="M10 19a2 2 0 004 0"/></>,
    star:    <path {...p} d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.6 1-5.8L3.5 9.7l5.9-.9z"/>,
    clock:   <><circle cx="12" cy="12" r="8.5" {...p}/><path {...p} d="M12 7.5V12l3 2"/></>,
    sparkle: <path {...p} d="M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2z"/>,
    arrowR:  <><path {...p} d="M4 12h15"/><path {...p} d="M14 7l5 5-5 5"/></>,
    settings:<><circle cx="12" cy="12" r="3" {...p}/><path {...p} d="M12 2.5l1.3 2.2 2.5-.4.9 2.4 2.2 1.3-.9 2.4.9 2.4-2.2 1.3-.9 2.4-2.5-.4L12 21.5l-1.3-2.2-2.5.4-.9-2.4L5.1 16l.9-2.4-.9-2.4 2.2-1.3.9-2.4 2.5.4z"/></>,
    target:  <><circle cx="12" cy="12" r="8.5" {...p}/><circle cx="12" cy="12" r="4.5" {...p}/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    lock:    <><rect x="5" y="10.5" width="14" height="9.5" rx="2.6" {...p}/><path {...p} d="M8 10.5V8a4 4 0 018 0v2.5"/><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none"/></>,
    unlock:  <><rect x="5" y="10.5" width="14" height="9.5" rx="2.6" {...p}/><path {...p} d="M8 10.5V8a4 4 0 017.6-1.7"/><circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none"/></>,
    mail:    <><rect x="3.5" y="5.5" width="17" height="13" rx="2.6" {...p}/><path {...p} d="M4 7.5l8 5.5 8-5.5"/></>,
    calendar:<><rect x="4" y="5.5" width="16" height="15" rx="2.6" {...p}/><path {...p} d="M4 9.8h16M8 3.5v4M16 3.5v4"/></>,
    feather: <><path {...p} d="M19 5c-3 0-9 1.5-11 8l-3 5 5-3c6.5-2 8-8 9-10z"/><path {...p} d="M9 14l5-5"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display:'block', flexShrink:0, ...style }}>{paths[name]}</svg>
  );
}

// ── iOS chrome ──────────────────────────────────────────────────────
function StatusBar({ time = '9:41', dark }) {
  const c = 'currentColor';
  return (
    <div style={{ height:54, display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'0 30px 9px', color:'var(--md-text)', position:'relative', zIndex:5, flexShrink:0 }}>
      <div style={{ fontSize:16, fontWeight:500, letterSpacing:.2, fontVariantNumeric:'tabular-nums' }}>{time}</div>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        <svg width="18" height="12" viewBox="0 0 18 12"><g fill={c}><rect x="0" y="7" width="3" height="5" rx="1"/><rect x="5" y="4.5" width="3" height="7.5" rx="1"/><rect x="10" y="2" width="3" height="10" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></g></svg>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke={c} strokeWidth="1.3"><path d="M8.5 3.5C10.6 3.5 12.5 4.4 14 5.8" strokeLinecap="round"/><path d="M3 5.8C4.5 4.4 6.4 3.5 8.5 3.5" strokeLinecap="round" opacity=".9"/><circle cx="8.5" cy="9" r="1.1" fill={c} stroke="none"/></svg>
        <svg width="27" height="13" viewBox="0 0 27 13"><rect x="1" y="1" width="22" height="11" rx="3" fill="none" stroke={c} strokeOpacity=".4" strokeWidth="1"/><rect x="2.5" y="2.5" width="17" height="8" rx="1.8" fill={c}/><rect x="24" y="4" width="1.6" height="5" rx="1" fill={c} fillOpacity=".5"/></svg>
      </div>
    </div>
  );
}
function HomeIndicator() {
  return <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', width:134, height:5, borderRadius:3, background:'var(--md-text)', opacity:.32, zIndex:20 }} />;
}

// ── Small primitives ────────────────────────────────────────────────
function PrimaryButton({ children, onClick, style, icon }) {
  return (
    <button className="md-press" onClick={onClick} style={{
      width:'100%', border:'none', cursor:'pointer', borderRadius:18, padding:'17px 22px',
      background:'var(--md-accent)', color:'var(--md-on-accent)', fontFamily:'DM Sans,sans-serif',
      fontSize:17, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:9,
      boxShadow:'0 8px 22px var(--md-accent-tint)', ...style }}>
      {children}{icon && <Icon name={icon} size={19} stroke={2} />}
    </button>
  );
}
function GhostButton({ children, onClick, style }) {
  return (
    <button className="md-press" onClick={onClick} style={{
      width:'100%', cursor:'pointer', borderRadius:18, padding:'16px 22px',
      background:'transparent', color:'var(--md-text)', border:'1px solid var(--md-border)',
      fontFamily:'DM Sans,sans-serif', fontSize:16, fontWeight:500, ...style }}>{children}</button>
  );
}

// ── Mascot (Nimbus, the meditation cloud) ───────────────────────────
const MD_MASCOTS = ['meditate','celebrate','sleep','content','zen','rest','side','back'];
function Mascot({ name='meditate', size=120, glow=true, float=true, halo, style, flip }) {
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', ...style }}>
      {glow && <div style={{ position:'absolute', width:'128%', height:'128%', borderRadius:'50%',
        background:'radial-gradient(circle, var(--md-accent-tint) 0%, transparent 66%)',
        animation: halo?'md-halo 6s ease-in-out infinite':'none' }} />}
      <img src={`assets/mascot-${name}.png`} alt="" draggable="false" style={{ position:'relative', width:'100%', height:'100%',
        objectFit:'contain', transform:flip?'scaleX(-1)':'none',
        animation: float?'md-float-soft 6s ease-in-out infinite':'none',
        filter:'drop-shadow(0 10px 18px rgba(58,48,40,.14))' }} />
    </div>
  );
}
// Ambient corner mascot — quiet, decorative, behind content.
function CornerMascot({ name='zen', size=140, opacity=.92, flip, style }) {
  return (
    <img src={`assets/mascot-${name}.png`} alt="" draggable="false" style={{ position:'absolute', width:size, height:size,
      objectFit:'contain', pointerEvents:'none', zIndex:1, opacity,
      transform:flip?'scaleX(-1)':'none', filter:'drop-shadow(0 6px 14px rgba(58,48,40,.10))', ...style }} />
  );
}

// ── Data ────────────────────────────────────────────────────────────
const MD_GOALS = [
  { id:'career',     label:'Career Success',       icon:'target',  hue:'gold' },
  { id:'finance',    label:'Financial Freedom',     icon:'star',    hue:'gold' },
  { id:'confidence', label:'Confidence',            icon:'sparkle', hue:'gold' },
  { id:'health',     label:'Better Health',         icon:'wind',    hue:'gold' },
  { id:'love',       label:'Better Relationships',  icon:'heart',   hue:'gold' },
  { id:'growth',     label:'Personal Growth',       icon:'sun',     hue:'gold' },
];
const MD_AFFIRMATIONS = {
  confidence:['I am becoming the person I aspire to be.','I trust myself to handle whatever comes.','My confidence grows with every quiet step I take.'],
  career:    ['I am building work that gives my days meaning.','Opportunity moves toward my steady, focused effort.','I lead with clarity and a calm, certain mind.'],
  finance:   ['I am creating lasting abundance through patience.','I give money direction, and it follows my intention.','My future self is grateful for the choices I make today.'],
  health:    ['My body grows stronger and calmer each day.','Every breath restores the energy I need.','I honor my body with rest, movement, and care.'],
  love:      ['I give and receive love with an open heart.','I attract people who value exactly who I am.','I am fully present for the ones I love.'],
  growth:    ['Each day I move a little closer to my best self.','I welcome change as the path to who I am becoming.','I am patient and kind with my own becoming.'],
};
const MD_SOUNDS = [
  { id:'rain', label:'Rain', icon:'rain' },
  { id:'ocean', label:'Ocean', icon:'ocean' },
  { id:'forest', label:'Forest', icon:'forest' },
];

Object.assign(window, { Icon, StatusBar, HomeIndicator, PrimaryButton, GhostButton, MDTheme, useTheme, MD_GOALS, MD_AFFIRMATIONS, MD_SOUNDS, Mascot, CornerMascot, MD_MASCOTS });
