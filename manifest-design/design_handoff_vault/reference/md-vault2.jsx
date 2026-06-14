// md-vault2.jsx — Vault: Create · Sealing animation · Locked detail · Unlock celebration.

// ── Envelope illustration (3D folding flap) ─────────────────────────
function EnvelopeArt({ w=210, open=false, lock=false, lockOpen=false }) {
  const h = Math.round(w*0.66);
  return (
    <div style={{ position:'relative', width:w, height:h, perspective:700 }}>
      {/* body */}
      <div style={{ position:'absolute', inset:0, borderRadius:16, background:'var(--md-card)',
        border:'1.6px solid var(--md-accent)', boxShadow:'var(--md-shadow-lg)', overflow:'hidden' }}>
        <svg viewBox="0 0 100 66" preserveAspectRatio="none" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
          <path d="M2 64 L50 34 L98 64" fill="none" stroke="var(--md-accent)" strokeWidth="1.1" opacity=".4" />
        </svg>
      </div>
      {/* flap */}
      <div style={{ position:'absolute', left:0, top:0, width:'100%', height:'60%',
        clipPath:'polygon(0 0, 100% 0, 50% 100%)',
        background:'linear-gradient(180deg, color-mix(in srgb, var(--md-accent-tint) 70%, var(--md-card)), var(--md-accent-tint))',
        borderTop:'1.6px solid var(--md-accent)',
        transformOrigin:'top center', transformStyle:'preserve-3d',
        transform: open?'rotateX(178deg)':'rotateX(0deg)', transition:'transform .9s cubic-bezier(.45,0,.2,1)',
        boxShadow: open?'none':'0 2px 6px rgba(58,48,40,.06)' }} />
      {/* lock badge */}
      {lock && (
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', zIndex:3,
          animation:'md-drop-in .7s cubic-bezier(.3,1.3,.5,1) both' }}>
          <div style={{ position:'absolute', left:'50%', top:'50%', width:96, height:96, borderRadius:'50%',
            background:'radial-gradient(circle, var(--md-accent-tint), transparent 66%)', animation:'md-seal-glow 5s ease-in-out infinite' }} />
          <div style={{ position:'relative', width:54, height:54, borderRadius:27, background:'var(--md-accent)', color:'var(--md-on-accent)',
            display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 10px 26px var(--md-accent-tint)' }}>
            <Icon name={lockOpen?'unlock':'lock'} size={26} stroke={1.8} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vault chrome (header with back) ─────────────────────────────────
function VaultHeader({ onBack, title, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'2px 20px 14px' }}>
      <button className="md-press" onClick={onBack} style={{ width:40, height:40, borderRadius:14, border:'1px solid var(--md-border)',
        background:'var(--md-card)', color:'var(--md-text)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name="chevL" size={20} />
      </button>
      <div style={{ flex:1, fontSize:16, fontWeight:500, color:'var(--md-text)' }}>{title}</div>
      {action}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2 · CREATE VAULT
// ════════════════════════════════════════════════════════════════════
const MD_DURATIONS = [
  { id:'1m', label:'1 Month',  months:1 },
  { id:'3m', label:'3 Months', months:3 },
  { id:'6m', label:'6 Months', months:6 },
  { id:'1y', label:'1 Year',   months:12 },
];
function addMonths(d, m){ const x=new Date(d); x.setMonth(x.getMonth()+m); return x; }

function CreateVaultScreen({ onBack, onSeal }) {
  const [text,setText] = React.useState('');
  const [dur,setDur] = React.useState('3m');
  const [custom,setCustom] = React.useState(false);
  const sel = MD_DURATIONS.find(d=>d.id===dur);
  const unlock = custom ? addMonths(MD_TODAY,9) : addMonths(MD_TODAY, sel.months);
  const canSeal = text.trim().length > 0;
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'var(--md-bg)' }}>
      <StatusBar />
      <VaultHeader onBack={onBack} title="New vault" />
      <div style={{ flex:1, overflow:'hidden', padding:'4px 24px 0', display:'flex', flexDirection:'column' }}>
        <div className="md-serif" style={{ fontSize:26, color:'var(--md-text)', letterSpacing:-.3, lineHeight:1.25, marginBottom:18, textWrap:'pretty' }}>
          What do you want to send to your future self?
        </div>

        <div style={{ flex:1, background:'var(--md-card)', border:'1px solid var(--md-border)', borderRadius:22, padding:'18px 18px',
          boxShadow:'var(--md-shadow)', display:'flex', flexDirection:'column', minHeight:140 }}>
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Dear future me…"
            style={{ flex:1, width:'100%', resize:'none', border:'none', outline:'none', background:'transparent',
              fontFamily:'DM Serif Display, Georgia, serif', fontStyle:'italic', fontSize:19, lineHeight:1.5,
              color:'var(--md-text)' }} />
          <div style={{ fontSize:12, color:'var(--md-text2)', textAlign:'right', marginTop:8 }}>{text.trim().length} characters · sealed once you confirm</div>
        </div>

        <div style={{ fontSize:12, fontWeight:500, letterSpacing:1.5, color:'var(--md-text2)', textTransform:'uppercase', margin:'22px 0 12px' }}>Open this in</div>
        <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
          {MD_DURATIONS.map(d=>{
            const on = !custom && dur===d.id;
            return (
              <button key={d.id} className="md-press" onClick={()=>{ setDur(d.id); setCustom(false); }}
                style={{ flex:'1 1 28%', cursor:'pointer', borderRadius:15, padding:'13px 0', fontFamily:'DM Sans,sans-serif', fontSize:14.5,
                  border:'1px solid '+(on?'var(--md-accent)':'var(--md-border)'), background:on?'var(--md-accent-tint)':'var(--md-card)',
                  color:'var(--md-text)', fontWeight:on?500:400, transition:'all .2s' }}>{d.label}</button>
            );
          })}
          <button className="md-press" onClick={()=>setCustom(true)}
            style={{ flex:'1 1 28%', cursor:'pointer', borderRadius:15, padding:'13px 0', fontFamily:'DM Sans,sans-serif', fontSize:14.5,
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              border:'1px solid '+(custom?'var(--md-accent)':'var(--md-border)'), background:custom?'var(--md-accent-tint)':'var(--md-card)',
              color:'var(--md-text)', fontWeight:custom?500:400, transition:'all .2s' }}>
            <Icon name="calendar" size={16} stroke={1.8} /> Custom
          </button>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:18, fontSize:13.5, color:'var(--md-text2)' }}>
          <Icon name="lock" size={15} stroke={1.7} style={{ color:'var(--md-accent)' }} />
          Opens <span style={{ color:'var(--md-text)', fontWeight:500 }}>{mdFmt(unlock)}</span>
        </div>
      </div>

      <div style={{ padding:'14px 24px 30px' }}>
        <PrimaryButton icon="lock" onClick={()=> canSeal && onSeal && onSeal({ text:text.trim(), unlock })}
          style={{ opacity:canSeal?1:.45, pointerEvents:canSeal?'auto':'none' }}>Seal Vault</PrimaryButton>
      </div>
      <HomeIndicator />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3 · SEALING ANIMATION
// ════════════════════════════════════════════════════════════════════
function SealingScreen({ draft, onDone, demo, demoStep=3 }) {
  const unlock = (draft && draft.unlock) || addMonths(MD_TODAY,3);
  const msg = (draft && draft.text) || 'I trust the version of me reading this.';
  const [step,setStep] = React.useState(demo ? demoStep : 0);
  React.useEffect(()=>{
    if (demo) return;
    const t = [];
    t.push(setTimeout(()=>setStep(1), 450));   // paper folds, envelope (open) appears
    t.push(setTimeout(()=>setStep(2), 1500));  // flap closes
    t.push(setTimeout(()=>setStep(3), 2350));  // lock drops + haptic
    t.push(setTimeout(()=>setStep(4), 3250));  // final message
    return ()=>t.forEach(clearTimeout);
  },[]);
  React.useEffect(()=>{ if(step===3 && navigator.vibrate) navigator.vibrate(18); },[step]);

  return (
    <div style={{ position:'absolute', inset:0, zIndex:50, background:'var(--md-bg)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(110% 80% at 50% 38%, var(--md-accent-tint), transparent 60%)', pointerEvents:'none' }} />
      <StatusBar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2, padding:'0 32px' }}>
        <div style={{ position:'relative', width:240, height:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {/* message paper */}
          {step<1 && (
            <div style={{ width:210, background:'var(--md-card)', border:'1px solid var(--md-border)', borderRadius:16, padding:'18px 18px',
              boxShadow:'var(--md-shadow-lg)', animation: step===0?'md-fold-in .6s .45s cubic-bezier(.5,0,.7,1) forwards':'none' }}>
              <div className="md-serif" style={{ fontStyle:'italic', fontSize:15.5, lineHeight:1.5, color:'var(--md-text)',
                display:'-webkit-box', WebkitLineClamp:4, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{msg}</div>
            </div>
          )}
          {/* envelope */}
          {step>=1 && (
            <div style={{ animation:'md-paper-open .6s cubic-bezier(.3,1,.5,1) both' }}>
              <EnvelopeArt w={216} open={step===1} lock={step>=3} />
            </div>
          )}
        </div>

        <div style={{ height:96, marginTop:34, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start' }}>
          {step<4 ? (
            <div style={{ fontSize:15.5, color:'var(--md-text2)', letterSpacing:.2 }}>
              {step<2 ? 'Folding your words away…' : step<3 ? 'Sealing…' : 'Locking it safe…'}
            </div>
          ) : (
            <div style={{ animation:'md-fade-up .6s ease both' }}>
              <div className="md-serif" style={{ fontStyle:'italic', fontSize:27, color:'var(--md-text)', letterSpacing:-.3, lineHeight:1.25 }}>Your message<br/>has been sealed.</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:18, padding:'9px 16px', borderRadius:20,
                background:'var(--md-card)', border:'1px solid var(--md-border)', color:'var(--md-text)', fontSize:14 }}>
                <Icon name="lock" size={15} stroke={1.7} style={{ color:'var(--md-accent)' }} />
                Opens {mdFmt(unlock)}
              </div>
            </div>
          )}
        </div>
      </div>
      {step>=4 && (
        <div style={{ padding:'0 24px 34px', animation:'md-fade-up .6s .15s ease both' }}>
          <PrimaryButton onClick={onDone}>Return to the Vault</PrimaryButton>
        </div>
      )}
      <HomeIndicator />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4 · LOCKED VAULT DETAIL
// ════════════════════════════════════════════════════════════════════
function VaultLockedScreen({ v, onBack }) {
  const dl = mdDaysLeft(v.unlock);
  const soon = mdVaultState(v)==='soon';
  return (
    <div style={{ position:'absolute', inset:0, zIndex:45, background:'var(--md-bg)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(110% 70% at 50% 22%, var(--md-accent-tint), transparent 58%)', pointerEvents:'none' }} />
      <StatusBar />
      <VaultHeader onBack={onBack} title="Sealed vault" />
      <div style={{ flex:1, overflow:'hidden', padding:'4px 24px 0', display:'flex', flexDirection:'column', alignItems:'center', position:'relative', zIndex:2 }}>
        <LockArt size={150} />
        <div className="md-serif" style={{ fontSize:24, color:'var(--md-text)', textAlign:'center', letterSpacing:-.3, lineHeight:1.25, marginTop:24, textWrap:'pretty' }}>{v.title}</div>

        {/* hidden message preview */}
        <div style={{ position:'relative', width:'100%', background:'var(--md-card)', border:'1px solid var(--md-border)', borderRadius:20,
          padding:'18px 18px', marginTop:22, overflow:'hidden', boxShadow:'var(--md-shadow)' }}>
          <div style={{ filter:'blur(7px)', opacity:.5, userSelect:'none', pointerEvents:'none' }}>
            {[92,100,84,70].map((w,i)=>(
              <div key={i} style={{ height:11, width:`${w}%`, borderRadius:6, background:'var(--md-text2)', opacity:.4, margin:'9px 0' }} />
            ))}
          </div>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'var(--md-text2)', fontSize:13 }}>
            <Icon name="lock" size={15} stroke={1.7} /> Hidden until it opens
          </div>
        </div>

        {/* meta rows */}
        <div style={{ width:'100%', background:'var(--md-card)', border:'1px solid var(--md-border)', borderRadius:20, marginTop:14, boxShadow:'var(--md-shadow)' }}>
          <MetaRow icon="feather" label="Sealed" value={mdFmt(v.created)} />
          <div style={{ height:1, background:'var(--md-border)' }} />
          <MetaRow icon="calendar" label="Opens" value={mdFmt(v.unlock)} />
          <div style={{ height:1, background:'var(--md-border)' }} />
          <MetaRow icon="clock" label="Remaining" value={`${dl} ${dl===1?'day':'days'}`} accent={soon} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:18, fontSize:13, color:'var(--md-text2)', textAlign:'center', lineHeight:1.5, maxWidth:280 }}>
          <Icon name="lock" size={15} stroke={1.7} style={{ flexShrink:0 }} />
          This vault can’t be edited, deleted, or opened until {mdFmt(v.unlock)}.
        </div>
      </div>
      <HomeIndicator />
    </div>
  );
}
function MetaRow({ icon, label, value, accent }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'15px 18px' }}>
      <div style={{ width:34, height:34, borderRadius:11, background:'var(--md-bg2)', color:'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon name={icon} size={18} stroke={1.8} />
      </div>
      <span style={{ flex:1, fontSize:14.5, color:'var(--md-text2)' }}>{label}</span>
      <span style={{ fontSize:15, fontWeight:500, color: accent?'var(--md-accent)':'var(--md-text)' }}>{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 5 · UNLOCK CELEBRATION
// ════════════════════════════════════════════════════════════════════
function VaultUnlockScreen({ v, onBack, demo, demoStep=3 }) {
  const msg = (v && v.message) || 'You made it. Be proud of the quiet work that brought you here.';
  const words = String(msg).split(' ');
  const [step,setStep] = React.useState(demo ? demoStep : 0);
  React.useEffect(()=>{
    if (demo) return;
    const t = [];
    t.push(setTimeout(()=>setStep(1), 700));   // lock lifts off
    t.push(setTimeout(()=>setStep(2), 1500));  // flap opens
    t.push(setTimeout(()=>setStep(3), 2350));  // message rises + fades in
    return ()=>t.forEach(clearTimeout);
  },[]);
  React.useEffect(()=>{ if(step===1 && navigator.vibrate) navigator.vibrate([10,40,16]); },[step]);
  const revealed = step>=3;

  return (
    <div style={{ position:'absolute', inset:0, zIndex:50, background:'var(--md-bg)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 80% at 50% 36%, var(--md-accent-tint), transparent 60%)',
        opacity: revealed?1:.7, transition:'opacity 1s', pointerEvents:'none' }} />
      <StatusBar />
      {revealed && (
        <button className="md-press" onClick={onBack} style={{ position:'absolute', top:58, right:22, zIndex:6, width:38, height:38, borderRadius:19,
          border:'1px solid var(--md-border)', background:'var(--md-card)', color:'var(--md-text2)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="close" size={18} />
        </button>
      )}

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2, padding:'0 30px' }}>
        {!revealed ? (
          <>
            <div style={{ position:'relative' }}>
              {/* lock lifts away */}
              {step<2 && (
                <div style={{ position:'absolute', left:'50%', top:'46%', transform:'translate(-50%,-50%)', zIndex:4,
                  animation: step>=1 ? 'md-lift-off .8s cubic-bezier(.4,0,.2,1) forwards' : 'none' }}>
                  <div style={{ width:54, height:54, borderRadius:27, background:'var(--md-accent)', color:'var(--md-on-accent)',
                    display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 10px 26px var(--md-accent-tint)' }}>
                    <Icon name={step>=1?'unlock':'lock'} size={26} stroke={1.8} />
                  </div>
                </div>
              )}
              <EnvelopeArt w={224} open={step>=2} />
            </div>
            <div style={{ fontSize:15.5, color:'var(--md-text2)', marginTop:38, letterSpacing:.2 }}>
              {step<1 ? 'A message has arrived…' : step<2 ? 'Unlocking…' : 'Opening…'}
            </div>
          </>
        ) : (
          <div style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
            <div style={{ animation:'md-drop-in .7s cubic-bezier(.3,1.2,.5,1) both' }}>
              <Mascot name="celebrate" size={104} halo float={false} />
            </div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:2.4, textTransform:'uppercase', color:'var(--md-accent)', marginTop:8,
              animation:'md-eyebrow-in .7s ease both' }}>A message from your past self</div>
            <div className="md-serif" style={{ fontStyle:'italic', fontSize:23, lineHeight:1.5, color:'var(--md-text)', letterSpacing:-.2, marginTop:16, textWrap:'pretty' }}>
              {words.map((w,i)=>(
                <span key={i} style={{ display:'inline-block', whiteSpace:'pre',
                  animation:'md-word-in .6s cubic-bezier(.22,.7,.3,1) both', animationDelay:`${0.2 + i*0.05}s` }}>{w}{i<words.length-1?'\u00A0':''}</span>
              ))}
            </div>
            {v && v.created && (
              <div style={{ fontSize:13, color:'var(--md-text2)', marginTop:22, animation:'md-fade-up .6s 1s ease both' }}>
                Sealed {mdFmt(v.created)}
              </div>
            )}
          </div>
        )}
      </div>
      {revealed && (
        <div style={{ padding:'0 24px 34px', animation:'md-fade-up .6s 1.1s ease both' }}>
          <PrimaryButton onClick={onBack}>Keep in my Vault</PrimaryButton>
        </div>
      )}
      <HomeIndicator />
    </div>
  );
}

Object.assign(window, { EnvelopeArt, VaultHeader, MD_DURATIONS, addMonths, CreateVaultScreen, SealingScreen, VaultLockedScreen, MetaRow, VaultUnlockScreen });
