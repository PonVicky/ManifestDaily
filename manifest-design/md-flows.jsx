// md-flows.jsx — Breathing Reset + running Focus session (timer ring) + complete glow.

// ── BREATHING RESET ─────────────────────────────────────────────────
const MD_BREATH = [['Breathe in',4],['Hold',4],['Breathe out',4]];
function BreathingScreen({ onClose, demo }) {
  const [phase,setPhase] = React.useState(0);
  const [left,setLeft] = React.useState(120);
  const [count,setCount] = React.useState(4);
  React.useEffect(()=>{
    if (demo) return;
    const total = setInterval(()=>setLeft(l=>l<=1?(clearInterval(total),onClose&&onClose(),0):l-1),1000);
    return ()=>clearInterval(total);
  },[]);
  React.useEffect(()=>{
    if (demo) return;
    let p=0,c=4;
    const t=setInterval(()=>{ c-=1; if(c<=0){ p=(p+1)%3; c=MD_BREATH[p][1]; setPhase(p);} setCount(c); },1000);
    return ()=>clearInterval(t);
  },[]);
  // breathing circle scale driven by phase
  const scale = phase===0?1 : phase===1?1 : .62;
  const mm = String(Math.floor(left/60)), ss = String(left%60).padStart(2,'0');
  return (
    <div style={{ position:'absolute', inset:0, zIndex:40, background:'var(--md-bg)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 90% at 50% 32%, var(--md-accent-tint), transparent 60%)', pointerEvents:'none' }} />
      <StatusBar />
      <button onClick={onClose} className="md-press" style={{ position:'absolute', top:58, right:22, zIndex:5, width:38, height:38, borderRadius:19, border:'1px solid var(--md-border)', background:'var(--md-card)', color:'var(--md-text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="close" size={18} /></button>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0, position:'relative', zIndex:2 }}>
        <div style={{ position:'relative', width:280, height:280, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {[1,.78,.56].map((s,i)=>(
            <div key={i} style={{ position:'absolute', width:280*s, height:280*s, borderRadius:'50%', border:'1px solid var(--md-accent)', opacity:.25-i*.05,
              transform:`scale(${scale})`, transition:'transform 4s cubic-bezier(.45,0,.55,1)' }} />
          ))}
          <div style={{ width:200, height:200, borderRadius:'50%', background:'var(--md-accent)', opacity:.9,
            transform:`scale(${scale})`, transition:'transform 4s cubic-bezier(.45,0,.55,1)',
            display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 20px 60px var(--md-accent-tint)' }}>
            <span style={{ fontFamily:'DM Serif Display,serif', fontSize:52, color:'var(--md-on-accent)', fontVariantNumeric:'tabular-nums' }}>{count}</span>
          </div>
        </div>
        <div className="md-serif" style={{ fontStyle:'italic', fontSize:30, color:'var(--md-text)', marginTop:48, letterSpacing:-.3 }}>{MD_BREATH[phase][0]}</div>
        <div style={{ fontSize:15, color:'var(--md-text2)', marginTop:10, fontVariantNumeric:'tabular-nums' }}>{mm}:{ss} remaining</div>
      </div>
      <HomeIndicator />
      <CornerMascot name="sleep" size={96} opacity={.7} style={{ bottom:30, left:14 }} />
    </div>
  );
}

// ── FOCUS RUNNING (timer ring) ──────────────────────────────────────
function FocusRunScreen({ minutes=25, sound='rain', onEnd, onComplete, demo, demoProgress=0.34 }) {
  const totalRef = React.useRef(minutes*60);
  const [left,setLeft] = React.useState(demo? Math.round(minutes*60*(1-demoProgress)) : minutes*60);
  const [paused,setPaused] = React.useState(false);
  const [done,setDone] = React.useState(false);
  React.useEffect(()=>{
    if (demo) return;
    if (paused||done) return;
    const t=setInterval(()=>setLeft(l=>{ if(l<=1){clearInterval(t);setDone(true);return 0;} return l-1; }),1000);
    return ()=>clearInterval(t);
  },[paused,done]);
  const total = totalRef.current;
  const prog = 1-left/total;
  const mm=String(Math.floor(left/60)).padStart(2,'0'), ss=String(left%60).padStart(2,'0');
  const R=130, C=2*Math.PI*R;
  const snd = MD_SOUNDS.find(s=>s.id===sound);
  return (
    <div style={{ position:'absolute', inset:0, zIndex:40, background:'var(--md-bg)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {done && <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 45%, var(--md-accent-tint), transparent 65%)', animation:'md-glow 2.4s ease forwards', pointerEvents:'none', zIndex:1 }} />}
      <StatusBar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2 }}>
        {!done ? <>
          <div style={{ position:'relative', width:300, height:300 }}>
            <svg width="300" height="300" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="150" cy="150" r={R} fill="none" stroke="var(--md-bg2)" strokeWidth="10" />
              <circle cx="150" cy="150" r={R} fill="none" stroke="var(--md-accent)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C*(1-prog)} style={{ transition:'stroke-dashoffset 1s linear' }} />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <div className="md-serif" style={{ fontSize:66, color:'var(--md-text)', fontVariantNumeric:'tabular-nums', letterSpacing:-1 }}>{mm}:{ss}</div>
              {snd && <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6, color:'var(--md-text2)', fontSize:14 }}><Icon name={snd.icon} size={17} /> {snd.label}</div>}
            </div>
          </div>
          <div style={{ display:'flex', gap:14, marginTop:46 }}>
            <button onClick={()=>setPaused(p=>!p)} className="md-press" style={{ width:64, height:64, borderRadius:32, border:'none', cursor:'pointer', background:'var(--md-accent)', color:'var(--md-on-accent)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 22px var(--md-accent-tint)' }}><Icon name={paused?'play':'pause'} size={26} /></button>
            <button onClick={onEnd} className="md-press" style={{ width:64, height:64, borderRadius:32, border:'1px solid var(--md-border)', cursor:'pointer', background:'var(--md-card)', color:'var(--md-text2)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="close" size={24} /></button>
          </div>
          <div style={{ fontSize:14, color:'var(--md-text2)', marginTop:26 }}>{paused?'Paused':'Stay with it.'}</div>
        </> : <>
          <Mascot name="celebrate" size={140} halo float={false} />
          <div className="md-serif" style={{ fontStyle:'italic', fontSize:30, color:'var(--md-text)', marginTop:22 }}>Session complete</div>
          <div style={{ fontSize:15, color:'var(--md-text2)', marginTop:8 }}>{minutes} focused minutes. Well done.</div>
          <div style={{ width:220, marginTop:34 }}><PrimaryButton onClick={onComplete||onEnd}>Done</PrimaryButton></div>
        </>}
      </div>
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { BreathingScreen, FocusRunScreen });
