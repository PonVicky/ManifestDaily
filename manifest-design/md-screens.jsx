// md-screens.jsx — Core app screens: Home, Focus, Breathing, Progress.
// Plus reusable AffirmationCard, TabBar, ActivityCalendar, StatTile.

// ── Tab bar ─────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [['home','Home','home'],['focus','Focus','focus'],['progress','Progress','progress']];
  return (
    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:88, paddingBottom:22,
      display:'flex', background:'color-mix(in srgb, var(--md-bg) 80%, transparent)', backdropFilter:'blur(18px)',
      borderTop:'1px solid var(--md-border)', zIndex:15 }}>
      {tabs.map(([id,label,icon]) => {
        const on = active===id;
        return (
          <button key={id} onClick={()=>onChange&&onChange(id)} style={{ flex:1, border:'none', background:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:5, paddingTop:12, color:on?'var(--md-accent)':'var(--md-text2)' }}>
            <div style={{ transition:'transform .3s cubic-bezier(.34,1.56,.64,1)', transform:on?'scale(1.12)':'scale(1)' }}>
              <Icon name={icon} size={25} stroke={on?2.1:1.7} fill={on?'var(--md-accent-tint)':'none'} />
            </div>
            <span style={{ fontSize:11, fontWeight:on?500:400, letterSpacing:.2 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Affirmation card (the emotional centerpiece) ────────────────────
function AffirmationCard({ text, fav, onFav, onShare, onSave, saved, compact, keyTrigger }) {
  const [popped, setPopped] = React.useState(false);
  const fire = () => { setPopped(true); setTimeout(()=>setPopped(false),550); onFav&&onFav(); };
  const words = String(text).split(' ');
  return (
    <div key={keyTrigger} style={{ background:'linear-gradient(168deg, color-mix(in srgb, var(--md-accent-tint) 30%, var(--md-card)), var(--md-card) 46%)',
      borderRadius:30, padding:compact?'26px 24px 20px':'30px 28px 24px', boxShadow:'var(--md-shadow), 0 1px 0 rgba(255,255,255,.6) inset',
      border:'1px solid var(--md-border)', position:'relative', overflow:'hidden' }}>
      {/* living glow */}
      <div style={{ position:'absolute', top:-90, left:'50%', width:300, height:230, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, var(--md-accent-tint), transparent 68%)', animation:'md-aff-glow 7s ease-in-out infinite' }} />
      {/* opening quote */}
      <div className="md-serif" style={{ position:'absolute', top:compact?6:10, right:18, fontSize:120, lineHeight:1,
        color:'var(--md-accent)', opacity:.13, fontStyle:'italic', pointerEvents:'none' }}>”</div>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:compact?15:19, position:'relative', zIndex:1,
        animation:'md-eyebrow-in .7s ease both' }}>
        <span style={{ width:5, height:5, borderRadius:3, background:'var(--md-accent)' }} />
        <span style={{ fontSize:10.5, fontWeight:600, letterSpacing:2.5, color:'var(--md-accent)', textTransform:'uppercase' }}>Today’s Affirmation</span>
      </div>

      <div className="md-serif" style={{ fontStyle:'italic', fontSize:compact?23:28, lineHeight:1.38, color:'var(--md-text)',
        letterSpacing:-.3, position:'relative', zIndex:1, textWrap:'pretty' }}>
        {words.map((w,i)=>(
          <span key={i} style={{ display:'inline-block', whiteSpace:'pre', animation:`md-word-in .62s cubic-bezier(.22,.7,.3,1) both`,
            animationDelay:`${0.13 + i*0.055}s` }}>{w}{i<words.length-1?'\u00A0':''}</span>
        ))}
      </div>

      <div style={{ height:1, background:'linear-gradient(90deg, var(--md-accent), transparent)', margin:compact?'20px 0 0':'24px 0 0',
        transformOrigin:'left', animation:'md-rule-in .9s .5s cubic-bezier(.22,.7,.3,1) both', opacity:.4, position:'relative', zIndex:1 }} />

      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:16, position:'relative', zIndex:1 }}>
        <ActionPill icon="heart" active={fav} pop={popped} onClick={fire} accent />
        <ActionPill icon="bookmark" active={saved} onClick={onSave} />
        <ActionPill icon="share" onClick={onShare} />
        <div style={{ flex:1 }} />
        <span style={{ fontSize:12, color:'var(--md-text2)', display:'flex', alignItems:'center', gap:6, opacity:.85 }}>
          <Icon name="sparkle" size={14} stroke={1.7} /> Tap for another
        </span>
      </div>
    </div>
  );
}
function ActionPill({ icon, active, pop, onClick, accent }) {
  return (
    <button className="md-press" onClick={onClick} style={{ width:44, height:44, borderRadius:14, cursor:'pointer',
      border:'1px solid var(--md-border)', background:active?'var(--md-accent-tint)':'color-mix(in srgb, var(--md-card) 70%, transparent)',
      color:active?'var(--md-accent)':'var(--md-text2)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>
      <div style={{ animation:pop?'md-heart-pop .55s cubic-bezier(.2,.7,.3,1)':'none' }}>
        <Icon name={icon} size={20} fill={active?'var(--md-accent)':'none'} />
      </div>
    </button>
  );
}

// ── Streak chip with flickering flame ───────────────────────────────
function StreakChip({ n }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6, background:'var(--md-card)', border:'1px solid var(--md-border)',
      padding:'8px 13px 8px 11px', borderRadius:20, boxShadow:'var(--md-shadow)' }}>
      <div style={{ color:'#E08A3C', animation:'md-flame 2.4s ease-in-out infinite', transformOrigin:'center bottom' }}>
        <Icon name="flame" size={20} fill="#F2A65A" stroke={0} />
      </div>
      <span style={{ fontSize:16, fontWeight:500, color:'var(--md-text)', fontVariantNumeric:'tabular-nums' }}>{n}</span>
    </div>
  );
}

// ── HOME ─────────────────────────────────────────────────────────────
function HomeScreen({ goal, affirmation, onBreathe, onFocus, onNewAffirmation, streak=12 }) {
  const [fav,setFav] = React.useState(false);
  const [saved,setSaved] = React.useState(false);
  const g = MD_GOALS.find(x=>x.id===goal) || MD_GOALS[2];
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <StatusBar />
      <div style={{ flex:1, overflow:'hidden', padding:'2px 24px 100px', position:'relative' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', marginBottom:18 }}>
          <Mascot name="meditate" size={126} halo float />
          <div style={{ fontSize:12, fontWeight:500, letterSpacing:2.4, textTransform:'uppercase', color:'var(--md-text2)', marginTop:4 }}>Good morning</div>
          <div className="md-serif" style={{ fontSize:27, color:'var(--md-text)', letterSpacing:-.3, marginTop:5 }}>Saturday, May 31</div>
          <div style={{ marginTop:13 }}><StreakChip n={streak} /></div>
        </div>

        <div onClick={onNewAffirmation} style={{ cursor:'pointer' }}>
          <AffirmationCard keyTrigger={affirmation} text={affirmation} fav={fav} saved={saved}
            onFav={()=>setFav(v=>!v)} onSave={()=>setSaved(v=>!v)} onShare={()=>{}} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, margin:'20px 4px 14px' }}>
          <span style={{ width:6, height:6, borderRadius:3, background:'var(--md-accent)' }} />
          <span style={{ fontSize:13, color:'var(--md-text2)' }}>Focusing on <span style={{ color:'var(--md-text)', fontWeight:500 }}>{g.label}</span></span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
          <ActionCard icon="wind" title="Breathing" sub="2 min reset" onClick={onBreathe} />
          <ActionCard icon="focus" title="Focus" sub="Start a session" onClick={onFocus} highlight />
        </div>
      </div>
    </div>
  );
}
function ActionCard({ icon, title, sub, onClick, highlight }) {
  return (
    <button className="md-press" onClick={onClick} style={{ textAlign:'left', cursor:'pointer', borderRadius:24, padding:'20px 18px',
      border:'1px solid var(--md-border)', background:highlight?'var(--md-accent-tint)':'var(--md-card)', boxShadow:'var(--md-shadow)',
      display:'flex', flexDirection:'column', gap:14, minHeight:128, fontFamily:'DM Sans,sans-serif' }}>
      <div style={{ width:46, height:46, borderRadius:14, background:highlight?'var(--md-accent)':'var(--md-bg2)',
        color:highlight?'var(--md-on-accent)':'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Icon name={icon} size={24} stroke={1.9} />
      </div>
      <div>
        <div style={{ fontSize:18, fontWeight:500, color:'var(--md-text)' }}>{title}</div>
        <div style={{ fontSize:13, color:'var(--md-text2)', marginTop:2 }}>{sub}</div>
      </div>
    </button>
  );
}

// ── FOCUS ────────────────────────────────────────────────────────────
function FocusScreen({ onStartRun }) {
  const [dur,setDur] = React.useState(25);
  const [sound,setSound] = React.useState('rain');
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <StatusBar />
      <div style={{ flex:1, overflow:'hidden', padding:'8px 24px 100px', position:'relative' }}>
        <CornerMascot name="side" size={104} opacity={.85} style={{ top:2, right:8 }} />
        <div className="md-serif" style={{ fontSize:34, color:'var(--md-text)', letterSpacing:-.5, marginBottom:4 }}>Focus</div>
        <div style={{ fontSize:15, color:'var(--md-text2)', marginBottom:26 }}>Choose a length, settle in.</div>

        <div style={{ display:'flex', gap:10, marginBottom:28 }}>
          {[15,25,45].map(d=>(
            <button key={d} className="md-press" onClick={()=>setDur(d)} style={{ flex:1, cursor:'pointer', borderRadius:20, padding:'22px 0',
              border:'1px solid '+(dur===d?'var(--md-accent)':'var(--md-border)'), background:dur===d?'var(--md-accent-tint)':'var(--md-card)',
              fontFamily:'DM Sans,sans-serif', boxShadow:dur===d?'none':'var(--md-shadow)', transition:'all .2s' }}>
              <div className="md-serif" style={{ fontSize:30, color:'var(--md-text)' }}>{d}</div>
              <div style={{ fontSize:12, color:'var(--md-text2)', marginTop:2 }}>minutes</div>
            </button>
          ))}
        </div>

        <div style={{ fontSize:12, fontWeight:500, letterSpacing:1.5, color:'var(--md-text2)', textTransform:'uppercase', marginBottom:13 }}>Ambient Sound</div>
        <div style={{ display:'flex', gap:10, marginBottom:30 }}>
          <SoundChip label="Off" icon="mute" on={sound===null} onClick={()=>setSound(null)} />
          {MD_SOUNDS.map(s=> <SoundChip key={s.id} label={s.label} icon={s.icon} on={sound===s.id} onClick={()=>setSound(s.id)} />)}
        </div>

        <PrimaryButton icon="play" onClick={()=>onStartRun&&onStartRun(dur,sound)}>Begin {dur}-minute session</PrimaryButton>

        <div style={{ marginTop:30, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:12, fontWeight:500, letterSpacing:1.5, color:'var(--md-text2)', textTransform:'uppercase' }}>Recent</span>
        </div>
        {[['25 min · Rain','Today, 8:20 AM'],['45 min · Forest','Yesterday'],['15 min · Ocean','Thu']].map(([t,d],i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:13, padding:'12px 0', borderBottom:i<2?'1px solid var(--md-border)':'none' }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'var(--md-bg2)', color:'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="check" size={19} /></div>
            <div style={{ flex:1 }}><div style={{ fontSize:15, color:'var(--md-text)', fontWeight:500 }}>{t}</div><div style={{ fontSize:12.5, color:'var(--md-text2)' }}>{d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
function SoundChip({ label, icon, on, onClick }) {
  return (
    <button className="md-press" onClick={onClick} style={{ flex:1, cursor:'pointer', borderRadius:16, padding:'14px 4px',
      display:'flex', flexDirection:'column', alignItems:'center', gap:7, fontFamily:'DM Sans,sans-serif',
      border:'1px solid '+(on?'var(--md-accent)':'var(--md-border)'), background:on?'var(--md-accent-tint)':'var(--md-card)',
      color:on?'var(--md-accent)':'var(--md-text2)', transition:'all .2s' }}>
      <Icon name={icon} size={22} stroke={1.8} />
      <span style={{ fontSize:12.5, color:'var(--md-text)' }}>{label}</span>
    </button>
  );
}

// ── PROGRESS ─────────────────────────────────────────────────────────
function ProgressScreen() {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <StatusBar />
      <div style={{ flex:1, overflow:'hidden', padding:'8px 24px 100px', position:'relative' }}>
        <CornerMascot name="zen" size={92} opacity={.82} style={{ top:6, right:6 }} />
        <div className="md-serif" style={{ fontSize:34, color:'var(--md-text)', letterSpacing:-.5, marginBottom:20 }}>Progress</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <StatTile big value="12" label="Day streak" icon="flame" tint="#F2A65A" />
          <StatTile big value="28" label="Best streak" icon="star" />
          <StatTile value="146" label="Sessions" icon="check" />
          <StatTile value="61.5" label="Focus hours" icon="clock" />
        </div>
        <div style={{ background:'var(--md-card)', border:'1px solid var(--md-border)', borderRadius:24, padding:'20px 18px', boxShadow:'var(--md-shadow)', marginTop:6 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:16 }}>
            <span style={{ fontSize:15, fontWeight:500, color:'var(--md-text)' }}>Activity</span>
            <span style={{ fontSize:12.5, color:'var(--md-text2)' }}>Last 18 weeks</span>
          </div>
          <ActivityCalendar />
        </div>
        <div style={{ background:'var(--md-accent-tint)', borderRadius:20, padding:'17px 18px', marginTop:14, display:'flex', gap:13, alignItems:'center' }}>
          <Icon name="sparkle" size={22} style={{ color:'var(--md-accent)' }} />
          <div style={{ fontSize:14, color:'var(--md-text)', lineHeight:1.45 }}>You’re most consistent on <b style={{ fontWeight:500 }}>mornings</b> — 9 of your last 10 sessions.</div>
        </div>
      </div>
    </div>
  );
}
function StatTile({ value, label, icon, big, tint }) {
  return (
    <div style={{ background:'var(--md-card)', border:'1px solid var(--md-border)', borderRadius:20, padding:'17px 17px', boxShadow:'var(--md-shadow)' }}>
      <Icon name={icon} size={21} style={{ color:tint||'var(--md-accent)', marginBottom:10 }} fill={tint?tint:'none'} stroke={tint?0:1.8} />
      <div className="md-serif" style={{ fontSize:big?34:28, color:'var(--md-text)', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12.5, color:'var(--md-text2)', marginTop:5 }}>{label}</div>
    </div>
  );
}

// ── Activity calendar (GitHub-style heatmap) ────────────────────────
function ActivityCalendar({ interactive=true, weeks=18 }) {
  // deterministic pseudo-random fill
  const seed = (i)=>{ const x=Math.sin(i*12.9898)*43758.5453; return x-Math.floor(x); };
  const [cells,setCells] = React.useState(()=>Array.from({length:weeks*7},(_,i)=>{
    const r=seed(i); return r>0.62 ? Math.min(4,1+Math.floor(seed(i+99)*4)) : (r>0.5?1:0);
  }));
  const lvl = (v)=> v===0 ? 'var(--md-bg2)' : `color-mix(in srgb, var(--md-accent) ${22+v*22}%, var(--md-bg2))`;
  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${weeks},1fr)`, gridAutoRows:'1fr', gap:4, gridAutoFlow:'column', gridTemplateRows:'repeat(7,1fr)' }}>
        {cells.map((v,i)=>(
          <div key={i} onClick={()=>interactive&&setCells(c=>{const n=[...c];n[i]=n[i]?0:3;return n;})}
            style={{ aspectRatio:'1', borderRadius:3.5, background:lvl(v), cursor:interactive?'pointer':'default',
              transition:'background .3s, transform .15s' }}
            onMouseDown={e=>e.currentTarget.style.transform='scale(.8)'} onMouseUp={e=>e.currentTarget.style.transform=''} onMouseLeave={e=>e.currentTarget.style.transform=''} />
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:5, marginTop:11, fontSize:11, color:'var(--md-text2)' }}>
        Less {[0,1,2,3,4].map(v=> <span key={v} style={{ width:11, height:11, borderRadius:3, background:lvl(v) }} />)} More
      </div>
    </div>
  );
}

Object.assign(window, { TabBar, AffirmationCard, ActionPill, StreakChip, HomeScreen, ActionCard, FocusScreen, SoundChip, ProgressScreen, StatTile, ActivityCalendar });
