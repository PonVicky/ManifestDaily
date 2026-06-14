// md-onboarding.jsx — Logo mark + 7-screen onboarding flow + Paywall.

// ── Logo mark: abstract geometric sunrise (gold tile) ───────────────
function LogoMark({ size=84, radius }) {
  const r = radius ?? size*0.26;
  return (
    <div style={{ width:size, height:size, borderRadius:r, background:'linear-gradient(150deg, #E7C7A0, var(--md-gold))',
      boxShadow:'0 12px 34px var(--md-accent-tint)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
      <svg width={size*0.62} height={size*0.62} viewBox="0 0 100 100">
        <circle cx="50" cy="54" r="22" fill="#FFFDF9" fillOpacity=".95" />
        <path d="M14 70 Q50 30 86 70" fill="none" stroke="#FFFDF9" strokeOpacity=".95" strokeWidth="7" strokeLinecap="round" />
        <path d="M20 82 H80" stroke="#FFFDF9" strokeOpacity=".55" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Dots({ n, i }) {
  return <div style={{ display:'flex', gap:7, justifyContent:'center' }}>{Array.from({length:n}).map((_,k)=>(
    <span key={k} style={{ height:7, borderRadius:4, width:k===i?22:7, background:k===i?'var(--md-accent)':'var(--md-border)', transition:'all .3s' }} />
  ))}</div>;
}

// ── Full onboarding flow ────────────────────────────────────────────
function OnboardingFlow({ onDone, startStep=0 }) {
  const [step,setStep] = React.useState(startStep);
  const [goal,setGoal] = React.useState('confidence');
  const [reminder,setReminder] = React.useState('morning');
  const N = 7;
  const next = ()=>setStep(s=>Math.min(N-1,s+1));
  const affirmation = MD_AFFIRMATIONS[goal][0];

  const shell = (content, footer, opts={}) => (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:opts.bg||'var(--md-bg)' }}>
      <StatusBar />
      {step>0 && step<5 && (
        <div style={{ padding:'2px 24px 0', display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={()=>setStep(s=>Math.max(0,s-1))} className="md-press" style={{ width:36, height:36, borderRadius:18, border:'none', background:'transparent', color:'var(--md-text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="chevL" size={22} /></button>
          <div style={{ flex:1 }}><Dots n={5} i={step} /></div>
          <div style={{ width:36 }} />
        </div>
      )}
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', padding:'0 28px' }}>{content}</div>
      <div style={{ padding:'0 28px 40px' }}>{footer}</div>
      <HomeIndicator />
    </div>
  );

  // 1 — Welcome
  if (step===0) return shell(
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
      <div style={{ position:'absolute', top:120, left:'50%', transform:'translateX(-50%)', width:340, height:340, borderRadius:'50%', background:'radial-gradient(circle, var(--md-accent-tint), transparent 65%)', pointerEvents:'none' }} />
      <Mascot name="meditate" size={158} halo float />
      <div className="md-serif" style={{ fontSize:42, color:'var(--md-text)', marginTop:22, letterSpacing:-.8 }}>ManifestDaily</div>
      <div className="md-serif" style={{ fontStyle:'italic', fontSize:21, color:'var(--md-text2)', marginTop:10, lineHeight:1.4, maxWidth:260 }}>Affirm the life you imagine</div>
    </div>,
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <PrimaryButton icon="arrowR" onClick={next}>Get started</PrimaryButton>
      <button onClick={next} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--md-text2)', fontSize:15, fontFamily:'DM Sans,sans-serif', padding:8 }}>I already have an account</button>
    </div>
  );

  // 2 — Goals
  if (step===1) return shell(
    <div style={{ flex:1, display:'flex', flexDirection:'column', paddingTop:18 }}>
      <div className="md-serif" style={{ fontSize:32, color:'var(--md-text)', letterSpacing:-.5, lineHeight:1.15 }}>What are you<br/>manifesting?</div>
      <div style={{ fontSize:15, color:'var(--md-text2)', marginTop:10, marginBottom:22 }}>We’ll tailor your affirmations to this.</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
        {MD_GOALS.map(g=>{
          const on=goal===g.id;
          return <button key={g.id} className="md-press" onClick={()=>setGoal(g.id)} style={{ textAlign:'left', cursor:'pointer', borderRadius:18, padding:'16px 15px',
            border:'1.5px solid '+(on?'var(--md-accent)':'var(--md-border)'), background:on?'var(--md-accent-tint)':'var(--md-card)', fontFamily:'DM Sans,sans-serif', transition:'all .2s' }}>
            <div style={{ width:38, height:38, borderRadius:11, background:on?'var(--md-accent)':'var(--md-bg2)', color:on?'var(--md-on-accent)':'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}><Icon name={g.icon} size={20} stroke={1.9} /></div>
            <div style={{ fontSize:14.5, fontWeight:500, color:'var(--md-text)', lineHeight:1.25 }}>{g.label}</div>
          </button>;
        })}
      </div>
    </div>,
    <PrimaryButton icon="arrowR" onClick={next}>Continue</PrimaryButton>
  );

  // 3 — Reminders
  if (step===2) {
    const opts=[['morning','Morning','7:00 – 9:00 AM','sun'],['afternoon','Afternoon','12:00 – 2:00 PM','target'],['evening','Evening','7:00 – 9:00 PM','moon']];
    return shell(
      <div style={{ flex:1, display:'flex', flexDirection:'column', paddingTop:18 }}>
        <div className="md-serif" style={{ fontSize:32, color:'var(--md-text)', letterSpacing:-.5, lineHeight:1.15 }}>When should we<br/>remind you?</div>
        <div style={{ fontSize:15, color:'var(--md-text2)', marginTop:10, marginBottom:24 }}>A daily nudge to affirm and focus.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {opts.map(([id,t,sub,ic])=>{
            const on=reminder===id;
            return <button key={id} className="md-press" onClick={()=>setReminder(id)} style={{ display:'flex', alignItems:'center', gap:15, cursor:'pointer', borderRadius:20, padding:'18px 18px',
              border:'1.5px solid '+(on?'var(--md-accent)':'var(--md-border)'), background:on?'var(--md-accent-tint)':'var(--md-card)', fontFamily:'DM Sans,sans-serif', transition:'all .2s' }}>
              <div style={{ width:46, height:46, borderRadius:14, background:on?'var(--md-accent)':'var(--md-bg2)', color:on?'var(--md-on-accent)':'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={ic} size={23} /></div>
              <div style={{ flex:1, textAlign:'left' }}><div style={{ fontSize:17, fontWeight:500, color:'var(--md-text)' }}>{t}</div><div style={{ fontSize:13, color:'var(--md-text2)', marginTop:2 }}>{sub}</div></div>
              <div style={{ width:24, height:24, borderRadius:12, border:'1.5px solid '+(on?'var(--md-accent)':'var(--md-border)'), background:on?'var(--md-accent)':'transparent', color:'var(--md-on-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>{on&&<Icon name="check" size={15} stroke={2.4}/>}</div>
            </button>;
          })}
        </div>
      </div>,
      <PrimaryButton icon="arrowR" onClick={next}>Continue</PrimaryButton>
    );
  }

  // 4 — Notification permission (custom pre-prompt)
  if (step===3) return shell(
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
      <div style={{ width:104, height:104, borderRadius:32, background:'var(--md-accent-tint)', color:'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
        <Icon name="bell" size={48} stroke={1.6} />
        <span style={{ position:'absolute', top:22, right:26, width:13, height:13, borderRadius:7, background:'#E08A3C', border:'2px solid var(--md-bg)' }} />
      </div>
      <div className="md-serif" style={{ fontSize:30, color:'var(--md-text)', marginTop:30, letterSpacing:-.4, lineHeight:1.2 }}>Stay on track,<br/>gently</div>
      <div style={{ fontSize:15.5, color:'var(--md-text2)', marginTop:14, lineHeight:1.6, maxWidth:280 }}>One calm reminder a day — never noisy. You can change this anytime.</div>
    </div>,
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <PrimaryButton onClick={next}>Enable reminders</PrimaryButton>
      <button onClick={next} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--md-text2)', fontSize:15, fontFamily:'DM Sans,sans-serif', padding:8 }}>Not now</button>
    </div>
  );

  // 5 — First affirmation reveal
  if (step===4) return shell(
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', position:'relative' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(90% 60% at 50% 42%, var(--md-accent-tint), transparent 60%)', pointerEvents:'none' }} />
      <div style={{ fontSize:12, fontWeight:500, letterSpacing:2.5, color:'var(--md-text2)', textTransform:'uppercase' }}>Your first affirmation</div>
      <div className="md-serif" style={{ fontStyle:'italic', fontSize:33, color:'var(--md-text)', marginTop:24, lineHeight:1.34, letterSpacing:-.3, position:'relative', zIndex:1 }}>“{affirmation}”</div>
      <div style={{ marginTop:30, display:'flex', gap:7 }}><span style={{ width:6, height:6, borderRadius:3, background:'var(--md-accent)' }} /><span style={{ fontSize:13, color:'var(--md-text2)' }}>Read it slowly. Believe it.</span></div>
    </div>,
    <PrimaryButton icon="arrowR" onClick={next}>This feels right</PrimaryButton>
  );

  // 6 — Paywall
  if (step===5) return (
    <Paywall onContinue={next} onClose={next} />
  );

  // 7 — Enter app
  return shell(
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', position:'relative' }}>
      <Confetti />
      <Mascot name="celebrate" size={150} halo float={false} />
      <div className="md-serif" style={{ fontSize:32, color:'var(--md-text)', marginTop:22, letterSpacing:-.4 }}>You’re all set</div>
      <div style={{ fontSize:15.5, color:'var(--md-text2)', marginTop:12, lineHeight:1.6, maxWidth:270 }}>Your daily practice begins now. Let’s manifest the life you imagine.</div>
    </div>,
    <PrimaryButton icon="arrowR" onClick={()=>onDone&&onDone(goal)}>Enter ManifestDaily</PrimaryButton>
  );
}

// ── Confetti burst ──────────────────────────────────────────────────
function Confetti() {
  const cols=['var(--md-gold)','#EAD3B4','#E8B07A','#E08A3C'];
  return <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
    {Array.from({length:26}).map((_,i)=>{ const x=8+ (i*3.4)%90; const d=(i%5)*.12; const sz=6+(i%3)*3;
      return <span key={i} style={{ position:'absolute', top:120, left:x+'%', width:sz, height:sz, borderRadius:i%2?'50%':2, background:cols[i%4], opacity:.9, animation:`md-confetti-fall ${1.6+(i%4)*.3}s ${d}s ease-in forwards` }} />; })}
  </div>;
}

// ── Paywall ─────────────────────────────────────────────────────────
function Paywall({ onContinue, onClose, variant='default' }) {
  const [plan,setPlan] = React.useState('annual');
  const plans=[
    { id:'annual', name:'Annual', price:'$39.99', per:'/year', note:'7-day free trial · $3.33/mo', badge:'Most Popular' },
    { id:'monthly', name:'Monthly', price:'$6.99', per:'/month', note:'Billed monthly' },
    { id:'lifetime', name:'Lifetime', price:'$99.99', per:'once', note:'Pay once, yours forever' },
  ];
  const feats=[['sparkle','Unlimited affirmations, personalized to you'],['focus','Every focus length & ambient soundscape'],['progress','Full history, streaks & insights']];
  const Stars = ({s=14}) => <div style={{ display:'flex', gap:2 }}>{[0,1,2,3,4].map(i=><Icon key={i} name="star" size={s} fill="var(--md-accent)" stroke={0} />)}</div>;
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--md-bg)', position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:300, background:'radial-gradient(100% 100% at 50% 0%, var(--md-accent-tint), transparent 70%)', pointerEvents:'none' }} />
      <StatusBar />
      <button onClick={onClose} className="md-press" style={{ position:'absolute', top:58, right:22, zIndex:5, width:34, height:34, borderRadius:17, border:'none', background:'var(--md-bg2)', color:'var(--md-text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name="close" size={17} /></button>
      <div style={{ flex:1, overflow:'hidden', padding:'2px 26px 0', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', justifyContent:'center', marginTop:0 }}><Mascot name="zen" size={84} halo float /></div>

        {/* ONE emotional promise */}
        <div className="md-serif" style={{ fontSize:30, color:'var(--md-text)', textAlign:'center', marginTop:14, letterSpacing:-.5, lineHeight:1.16 }}>Become who you<br/><span style={{ fontStyle:'italic' }}>keep affirming.</span></div>
        <div style={{ fontSize:14.5, color:'var(--md-text2)', textAlign:'center', marginTop:11, lineHeight:1.5, maxWidth:300, alignSelf:'center' }}>The calm, certain version of you is built one quiet morning at a time. ManifestDaily keeps you showing up.</div>

        {/* restrained social proof */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, marginTop:16 }}>
          <Stars />
          <span style={{ fontSize:13, color:'var(--md-text)', fontWeight:500 }}>4.9</span>
          <span style={{ width:3, height:3, borderRadius:2, background:'var(--md-border)' }} />
          <span style={{ fontSize:13, color:'var(--md-text2)' }}>50,000+ practicing daily</span>
        </div>
        <div style={{ background:'var(--md-card)', border:'1px solid var(--md-border)', borderRadius:18, padding:'14px 16px', marginTop:14, boxShadow:'var(--md-shadow)' }}>
          <div className="md-serif" style={{ fontStyle:'italic', fontSize:15.5, color:'var(--md-text)', lineHeight:1.45 }}>“Three months in and I finally believe the things I tell myself.”</div>
          <div style={{ fontSize:12, color:'var(--md-text2)', marginTop:7 }}>Maya R. · member since 2024</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:9, marginTop:16 }}>
          {feats.map(([ic,t])=>(
            <div key={t} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:28, height:28, borderRadius:9, background:'var(--md-accent-tint)', color:'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon name="check" size={15} stroke={2.2} /></div>
              <span style={{ fontSize:14, color:'var(--md-text)' }}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:9, marginTop:'auto', marginBottom:4, paddingTop:18 }}>
          {plans.map(p=>{
            const on=plan===p.id;
            return <button key={p.id} className="md-press" onClick={()=>setPlan(p.id)} style={{ flex:1, position:'relative', cursor:'pointer', borderRadius:18, padding:'15px 8px 13px', textAlign:'center',
              border:'1.5px solid '+(on?'var(--md-accent)':'var(--md-border)'), background:on?'var(--md-accent-tint)':'var(--md-card)', fontFamily:'DM Sans,sans-serif', transition:'all .2s' }}>
              {p.badge && <span style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', background:'var(--md-accent)', color:'var(--md-on-accent)', fontSize:9.5, fontWeight:500, padding:'3px 8px', borderRadius:8, whiteSpace:'nowrap', letterSpacing:.3 }}>{p.badge}</span>}
              <div style={{ fontSize:13, color:'var(--md-text2)', fontWeight:500 }}>{p.name}</div>
              <div className="md-serif" style={{ fontSize:21, color:'var(--md-text)', marginTop:5 }}>{p.price}</div>
              <div style={{ fontSize:11, color:'var(--md-text2)' }}>{p.per}</div>
            </button>;
          })}
        </div>
      </div>
      <div style={{ padding:'12px 26px 28px' }}>
        <PrimaryButton onClick={onContinue}>{plan==='annual'?'Start 7-day free trial':'Continue'}</PrimaryButton>
        <div style={{ textAlign:'center', fontSize:12, color:'var(--md-text2)', marginTop:10 }}>{plan==='annual'?'Free for 7 days, then $39.99/yr · Cancel anytime':plans.find(p=>p.id===plan).note}</div>
        <div style={{ display:'flex', justifyContent:'center', gap:18, marginTop:10, fontSize:12, color:'var(--md-text2)' }}>
          <span>Restore</span><span>·</span><span>Terms</span><span>·</span><span>Privacy</span>
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { LogoMark, Dots, OnboardingFlow, Confetti, Paywall });
