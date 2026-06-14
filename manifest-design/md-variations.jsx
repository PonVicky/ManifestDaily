// md-variations.jsx — element-level explorations: affirmation cards, breathing styles, activity calendars.

// Tinted stage so element variants read in context.
function Stage({ children, h=420, pad=24, center }) {
  return <div className="md" style={{ width:393, height:h, background:'var(--md-bg)', color:'var(--md-text)', padding:pad,
    display:'flex', flexDirection:'column', justifyContent:center?'center':'flex-start', gap:0, overflow:'hidden' }}>{children}</div>;
}

// ── AFFIRMATION CARD VARIANTS ───────────────────────────────────────
// A · Classic (reuses AffirmationCard)
function AffCardA() {
  const [fav,setFav]=React.useState(true);
  return <Stage center><AffirmationCard text="I am becoming the person I aspire to be." fav={fav} onFav={()=>setFav(v=>!v)} /></Stage>;
}
// B · Editorial — full-bleed, type-forward, text actions
function AffCardB() {
  const [fav,setFav]=React.useState(false);
  return (
    <Stage center>
      <div style={{ padding:'4px 6px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:22 }}>
          <span style={{ width:30, height:1.5, background:'var(--md-accent)' }} />
          <span style={{ fontSize:11, letterSpacing:2.5, color:'var(--md-text2)', textTransform:'uppercase' }}>Affirmation · 31 May</span>
        </div>
        <div className="md-serif" style={{ fontStyle:'italic', fontSize:34, lineHeight:1.28, letterSpacing:-.4, color:'var(--md-text)' }}>I trust myself to handle whatever comes.</div>
        <div style={{ display:'flex', gap:24, marginTop:30, fontSize:14, color:'var(--md-text2)' }}>
          <button onClick={()=>setFav(v=>!v)} style={{ display:'flex', alignItems:'center', gap:7, border:'none', background:'none', cursor:'pointer', color:fav?'var(--md-accent)':'var(--md-text2)', fontFamily:'DM Sans,sans-serif', fontSize:14, padding:0 }}><Icon name="heart" size={18} fill={fav?'var(--md-accent)':'none'}/> Favorite</button>
          <button style={{ display:'flex', alignItems:'center', gap:7, border:'none', background:'none', cursor:'pointer', color:'var(--md-text2)', fontFamily:'DM Sans,sans-serif', fontSize:14, padding:0 }}><Icon name="share" size={18}/> Share</button>
          <button style={{ display:'flex', alignItems:'center', gap:7, border:'none', background:'none', cursor:'pointer', color:'var(--md-text2)', fontFamily:'DM Sans,sans-serif', fontSize:14, padding:0 }}><Icon name="bookmark" size={18}/> Save</button>
        </div>
      </div>
    </Stage>
  );
}
// C · Halo + deck — stacked cards behind, soft radial halo, circular buttons
function AffCardC() {
  const [fav,setFav]=React.useState(true);
  return (
    <Stage center>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', inset:'-30px -10px', background:'radial-gradient(60% 60% at 50% 42%, var(--md-accent-tint), transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-14, left:18, right:18, height:60, background:'var(--md-card)', borderRadius:26, border:'1px solid var(--md-border)', opacity:.6 }} />
        <div style={{ position:'absolute', top:-7, left:10, right:10, height:60, background:'var(--md-card)', borderRadius:28, border:'1px solid var(--md-border)', opacity:.8 }} />
        <div style={{ position:'relative', background:'var(--md-card)', borderRadius:30, border:'1px solid var(--md-border)', padding:'30px 26px', boxShadow:'var(--md-shadow-lg)', textAlign:'center' }}>
          <Icon name="sparkle" size={22} style={{ color:'var(--md-accent)', margin:'0 auto 16px' }} />
          <div className="md-serif" style={{ fontStyle:'italic', fontSize:25, lineHeight:1.34, color:'var(--md-text)' }}>My confidence grows with every quiet step I take.</div>
          <div style={{ display:'flex', justifyContent:'center', gap:14, marginTop:24 }}>
            {[['heart',fav],['bookmark',false],['share',false]].map(([ic,on],i)=>(
              <button key={i} onClick={i===0?()=>setFav(v=>!v):undefined} style={{ width:48, height:48, borderRadius:24, border:'1px solid var(--md-border)', background:on?'var(--md-accent)':'var(--md-bg)', color:on?'var(--md-on-accent)':'var(--md-text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={ic} size={20} fill={on&&ic==='heart'?'currentColor':'none'}/></button>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:20 }}>{[0,1,2].map(i=><span key={i} style={{ width:6, height:6, borderRadius:3, background:i===0?'var(--md-accent)':'var(--md-border)' }}/>)}</div>
        </div>
      </div>
    </Stage>
  );
}

// ── BREATHING ANIMATION VARIANTS ────────────────────────────────────
function BreathLabel({ children }) { return <div className="md-serif" style={{ fontStyle:'italic', fontSize:22, color:'var(--md-text)', marginTop:34, textAlign:'center' }}>{children}</div>; }
// A · Concentric rings
function BreatheA() {
  return <Stage h={460} center pad={0}>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ position:'relative', width:220, height:220, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {[1,.74,.5].map((s,i)=><div key={i} style={{ position:'absolute', width:220*s, height:220*s, borderRadius:'50%', border:'1.5px solid var(--md-accent)', opacity:.3-i*.06, animation:'md-breathe-loop 12s ease-in-out infinite' }}/>)}
        <div style={{ width:150, height:150, borderRadius:'50%', background:'var(--md-accent)', opacity:.9, animation:'md-breathe-loop 12s ease-in-out infinite', boxShadow:'0 16px 50px var(--md-accent-tint)' }}/>
      </div>
      <BreathLabel>Breathe in</BreathLabel>
    </div>
  </Stage>;
}
// B · Filling orb
function BreatheB() {
  return <Stage h={460} center pad={0}>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ width:190, height:190, borderRadius:'50%', border:'1.5px solid var(--md-accent)', position:'relative', overflow:'hidden', display:'flex', alignItems:'flex-end', justifyContent:'center', background:'var(--md-bg2)' }}>
        <div style={{ width:'100%', background:'linear-gradient(var(--md-accent), color-mix(in srgb,var(--md-accent) 70%, var(--md-bg)))', animation:'md-fill-loop 12s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="wind" size={34} style={{ color:'var(--md-text)', opacity:.5 }}/></div>
      </div>
      <BreathLabel>Fill, and hold</BreathLabel>
    </div>
  </Stage>;
}
// C · Morphing blob
function BreatheC() {
  return <Stage h={460} center pad={0}>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ position:'relative', width:220, height:220, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ position:'absolute', width:180, height:180, background:'var(--md-accent-tint)', animation:'md-blob-morph 12s ease-in-out infinite' }}/>
        <div style={{ width:150, height:150, background:'var(--md-accent)', opacity:.92, animation:'md-blob-morph 12s ease-in-out infinite', boxShadow:'0 16px 50px var(--md-accent-tint)' }}/>
      </div>
      <BreathLabel>Soften, release</BreathLabel>
    </div>
  </Stage>;
}

// ── ACTIVITY CALENDAR VARIANTS ──────────────────────────────────────
// A · GitHub heatmap (reuse)
function CalA() { return <Stage h={300}><Card><ActivityCalendar weeks={16}/></Card></Stage>; }
function Card({ children, title='Activity' }) {
  return <div style={{ background:'var(--md-card)', border:'1px solid var(--md-border)', borderRadius:24, padding:'20px 18px', boxShadow:'var(--md-shadow)' }}>
    <div style={{ fontSize:15, fontWeight:500, color:'var(--md-text)', marginBottom:16 }}>{title}</div>{children}</div>;
}
// B · Month dot grid with streak ring
function CalB() {
  const seed=(i)=>{const x=Math.sin(i*7.3)*9999;return x-Math.floor(x);};
  return <Stage h={360}><Card title="May">
    <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:9, marginBottom:8 }}>
      {['S','M','T','W','T','F','S'].map((d,i)=><div key={i} style={{ textAlign:'center', fontSize:11, color:'var(--md-text2)' }}>{d}</div>)}
      {Array.from({length:31}).map((_,i)=>{ const done=seed(i)>.42; const today=i===30;
        return <div key={i} style={{ aspectRatio:'1', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12,
          background:done?'var(--md-accent)':'var(--md-bg2)', color:done?'var(--md-on-accent)':'var(--md-text2)', border:today?'2px solid var(--md-text)':'none', fontVariantNumeric:'tabular-nums' }}>{i+1}</div>; })}
    </div>
  </Card></Stage>;
}
// C · Weekly bars
function CalC() {
  const seed=(i)=>{const x=Math.sin(i*3.1)*9999;return Math.abs(x-Math.floor(x));};
  return <Stage h={300}><Card title="Weekly focus · hours">
    <div style={{ display:'flex', alignItems:'flex-end', gap:7, height:120 }}>
      {Array.from({length:12}).map((_,i)=>{ const h=20+seed(i)*100; const on=i===11;
        return <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, height:'100%', justifyContent:'flex-end' }}>
          <div style={{ width:'100%', height:h, borderRadius:6, background:on?'var(--md-accent)':'color-mix(in srgb,var(--md-accent) 40%, var(--md-bg2))' }}/>
        </div>; })}
    </div>
    <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, fontSize:11, color:'var(--md-text2)' }}><span>12 wks ago</span><span>This week</span></div>
  </Card></Stage>;
}

Object.assign(window, { Stage, AffCardA, AffCardB, AffCardC, BreatheA, BreatheB, BreatheC, CalA, CalB, CalC });
