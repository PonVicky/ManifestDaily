// md-variations2.jsx — full-screen explorations: home layouts, paywall, onboarding style.

function VScreen({ children }) { return <div className="md md-screen">{children}</div>; }

// ── HOME LAYOUT VARIANTS ────────────────────────────────────────────
// B · Hero — affirmation as full focal hero, actions docked at the bottom
function HomeHero() {
  const [fav,setFav]=React.useState(false);
  return <VScreen>
    <StatusBar/>
    <div style={{ position:'relative', height:520, margin:'4px 0 0', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(85% 70% at 50% 36%, var(--md-accent-tint), transparent 62%)' }}/>
      <div style={{ position:'absolute', top:22, left:24, right:24, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div><div style={{ fontSize:14, color:'var(--md-text2)' }}>Good morning</div></div>
        <StreakChip n={12}/>
      </div>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 34px' }}>
        <div style={{ fontSize:11, letterSpacing:2.5, color:'var(--md-text2)', textTransform:'uppercase', marginBottom:22 }}>Today’s affirmation</div>
        <div className="md-serif" style={{ fontStyle:'italic', fontSize:32, lineHeight:1.32, letterSpacing:-.3, color:'var(--md-text)' }}>“I am becoming the person I aspire to be.”</div>
        <div style={{ display:'flex', gap:12, marginTop:30 }}>
          {[['heart',fav],['bookmark',false],['share',false]].map(([ic,on],i)=>(
            <button key={i} onClick={i===0?()=>setFav(v=>!v):undefined} className="md-press" style={{ width:50, height:50, borderRadius:25, border:'1px solid var(--md-border)', background:on?'var(--md-accent)':'var(--md-card)', color:on?'var(--md-on-accent)':'var(--md-text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'var(--md-shadow)' }}><Icon name={ic} size={21} fill={on&&ic==='heart'?'currentColor':'none'}/></button>
          ))}
        </div>
      </div>
    </div>
    <div style={{ position:'absolute', bottom:104, left:0, right:0, padding:'0 24px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, margin:'0 4px 14px' }}><span style={{ width:6, height:6, borderRadius:3, background:'var(--md-accent)' }}/><span style={{ fontSize:13, color:'var(--md-text2)' }}>Focusing on <b style={{ fontWeight:500, color:'var(--md-text)' }}>Confidence</b></span></div>
      <div style={{ display:'flex', gap:12 }}>
        <ActionCard icon="wind" title="Breathe" sub="2 min reset" onClick={()=>{}}/>
        <ActionCard icon="focus" title="Focus" sub="Start session" highlight onClick={()=>{}}/>
      </div>
    </div>
    <TabBar active="home"/><HomeIndicator/>
  </VScreen>;
}

// C · Minimal — airy, single-line affirmation, streak ring, list actions
function HomeMinimal() {
  const R=26,C=2*Math.PI*R, p=.62;
  return <VScreen>
    <StatusBar/>
    <div style={{ padding:'10px 26px 100px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:30 }}>
        <div><div style={{ fontSize:15, color:'var(--md-text2)' }}>Good morning</div><div className="md-serif" style={{ fontSize:26, color:'var(--md-text)' }}>Alex</div></div>
        <div style={{ position:'relative', width:64, height:64 }}>
          <svg width="64" height="64" style={{ transform:'rotate(-90deg)' }}><circle cx="32" cy="32" r={R} fill="none" stroke="var(--md-bg2)" strokeWidth="5"/><circle cx="32" cy="32" r={R} fill="none" stroke="var(--md-accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-p)}/></svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:16, fontWeight:500, color:'var(--md-text)' }}>12</span><span style={{ fontSize:9, color:'var(--md-text2)' }}>days</span></div>
        </div>
      </div>
      <div style={{ borderTop:'1px solid var(--md-border)', borderBottom:'1px solid var(--md-border)', padding:'30px 0', margin:'0 0 30px' }}>
        <div style={{ fontSize:11, letterSpacing:2, color:'var(--md-text2)', textTransform:'uppercase', marginBottom:14 }}>Today</div>
        <div className="md-serif" style={{ fontStyle:'italic', fontSize:27, lineHeight:1.35, color:'var(--md-text)' }}>I trust myself to handle whatever comes.</div>
        <div style={{ display:'flex', gap:20, marginTop:20, color:'var(--md-text2)' }}>
          <Icon name="heart" size={20}/><Icon name="bookmark" size={20}/><Icon name="share" size={20}/>
        </div>
      </div>
      {[['wind','Breathing reset','2 minutes'],['focus','Focus session','15 · 25 · 45 min']].map(([ic,t,s],i)=>(
        <button key={i} className="md-press" style={{ display:'flex', alignItems:'center', gap:16, width:'100%', padding:'18px 4px', border:'none', borderBottom:'1px solid var(--md-border)', background:'none', cursor:'pointer', fontFamily:'DM Sans,sans-serif' }}>
          <div style={{ width:44, height:44, borderRadius:13, background:'var(--md-bg2)', color:'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={ic} size={22}/></div>
          <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:16, fontWeight:500, color:'var(--md-text)' }}>{t}</div><div style={{ fontSize:13, color:'var(--md-text2)' }}>{s}</div></div>
          <Icon name="chevR" size={20} style={{ color:'var(--md-text2)' }}/>
        </button>
      ))}
    </div>
    <TabBar active="home"/><HomeIndicator/>
  </VScreen>;
}

// ── PAYWALL VARIANT B · single-focus annual ─────────────────────────
function PaywallB() {
  const [annual,setAnnual]=React.useState(true);
  const feats=['Unlimited personalized affirmations','Every focus length & ambient sound','Full activity history & insights','Home & lock screen widgets'];
  return <VScreen>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:320, background:'radial-gradient(100% 100% at 50% 0%, var(--md-accent-tint), transparent 72%)', pointerEvents:'none' }}/>
    <StatusBar/>
    <button className="md-press" style={{ position:'absolute', top:58, right:22, zIndex:5, width:34, height:34, borderRadius:17, border:'none', background:'var(--md-bg2)', color:'var(--md-text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="close" size={17}/></button>
    <div style={{ padding:'18px 30px 0', display:'flex', flexDirection:'column', height:'calc(100% - 54px)' }}>
      <div style={{ display:'flex', justifyContent:'center', marginTop:10 }}><LogoMark size={60}/></div>
      <div className="md-serif" style={{ fontSize:33, color:'var(--md-text)', textAlign:'center', marginTop:22, letterSpacing:-.5, lineHeight:1.16 }}>Your practice,<br/><span style={{ fontStyle:'italic' }}>unlocked</span></div>
      <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:30 }}>
        {feats.map(f=><div key={f} style={{ display:'flex', alignItems:'center', gap:13 }}><div style={{ width:24, height:24, borderRadius:12, background:'var(--md-accent)', color:'var(--md-on-accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="check" size={15} stroke={2.4}/></div><span style={{ fontSize:15, color:'var(--md-text)' }}>{f}</span></div>)}
      </div>
      <div style={{ marginTop:'auto' }}>
        <div style={{ display:'flex', background:'var(--md-bg2)', borderRadius:16, padding:4, marginBottom:16 }}>
          {[['annual','Annual','Save 52%'],['monthly','Monthly',null]].map(([id,t,tag])=>{ const on=(id==='annual')===annual;
            return <button key={id} onClick={()=>setAnnual(id==='annual')} style={{ flex:1, padding:'11px 0', borderRadius:12, border:'none', cursor:'pointer', background:on?'var(--md-card)':'transparent', color:'var(--md-text)', fontFamily:'DM Sans,sans-serif', fontSize:14, fontWeight:500, boxShadow:on?'var(--md-shadow)':'none', transition:'all .2s' }}>{t}{tag&&<span style={{ fontSize:10.5, color:'var(--md-accent)', marginLeft:6 }}>{tag}</span>}</button>;
          })}
        </div>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <span className="md-serif" style={{ fontSize:30, color:'var(--md-text)' }}>{annual?'$39.99':'$6.99'}</span>
          <span style={{ fontSize:15, color:'var(--md-text2)' }}>{annual?' / year':' / month'}</span>
          <div style={{ fontSize:13, color:'var(--md-text2)', marginTop:4 }}>{annual?'7-day free trial · cancel anytime':'Billed monthly'}</div>
        </div>
        <PrimaryButton>{annual?'Start free trial':'Subscribe'}</PrimaryButton>
        <div style={{ display:'flex', justifyContent:'center', gap:18, margin:'14px 0 0', fontSize:12, color:'var(--md-text2)' }}><span>Restore</span><span>·</span><span>Terms</span><span>·</span><span>Privacy</span></div>
      </div>
    </div>
    <HomeIndicator/>
  </VScreen>;
}

// ── ONBOARDING STYLE VARIANT B · editorial welcome ──────────────────
function OnbWelcomeEditorial() {
  return <VScreen>
    <StatusBar/>
    <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, var(--md-bg), var(--md-bg2))' }}/>
    <div style={{ position:'relative', height:'calc(100% - 54px)', padding:'24px 30px 40px', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <LogoMark size={46} radius={14}/>
        <span style={{ fontSize:12, letterSpacing:2, color:'var(--md-text2)', textTransform:'uppercase' }}>01 — Welcome</span>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
        <div style={{ width:46, height:1.5, background:'var(--md-accent)', marginBottom:26 }}/>
        <div className="md-serif" style={{ fontSize:50, lineHeight:1.04, letterSpacing:-1, color:'var(--md-text)' }}>Affirm<br/>the life<br/>you <span style={{ fontStyle:'italic', color:'var(--md-accent)' }}>imagine</span></div>
        <div style={{ fontSize:16, lineHeight:1.6, color:'var(--md-text2)', marginTop:24, maxWidth:300 }}>A daily ritual of affirmations, focus, and breath — to become who you’re meant to be.</div>
      </div>
      <div style={{ display:'flex', gap:14, alignItems:'center', marginTop:30 }}>
        <PrimaryButton icon="arrowR" style={{ flex:1 }}>Begin</PrimaryButton>
        <span style={{ fontSize:14, color:'var(--md-text2)' }}>Sign in</span>
      </div>
    </div>
    <HomeIndicator/>
  </VScreen>;
}

Object.assign(window, { HomeHero, HomeMinimal, PaywallB, OnbWelcomeEditorial });
