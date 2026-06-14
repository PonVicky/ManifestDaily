// md-vault.jsx — The Vault: write a sealed message to your future self.
// Screens: List · Create · Sealing animation · Locked detail · Unlock celebration.
// Pure extension of the Cream Serenity system — same cards, type, spacing, motion.

// ── Date helpers (app "today" = May 31 2026, matching Home) ─────────
const MD_TODAY = new Date(2026, 4, 31);
const MD_DAY = 86400000;
function mdFmt(d){ return d.toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' }); }
function mdDaysLeft(d){ return Math.ceil((d - MD_TODAY) / MD_DAY); }
function mdVaultState(v){
  const dl = mdDaysLeft(v.unlock);
  if (v.opened) return 'opened';
  if (dl <= 0) return 'ready';
  if (dl <= 14) return 'soon';
  return 'locked';
}
function mdProgress(v){
  const total = v.unlock - v.created, done = MD_TODAY - v.created;
  return Math.max(0, Math.min(1, done/total));
}

// ── Seed data ───────────────────────────────────────────────────────
const MD_VAULTS = [
  { id:'v1', title:'To the version of me who made it', created:new Date(2026,0,12), unlock:new Date(2027,0,12),
    message:'If you are reading this, a whole year has passed. I hope you kept the promise we made on a quiet January morning — to stop waiting to feel ready, and to begin anyway. Be proud of how far you came.' },
  { id:'v2', title:'Before the leap', created:new Date(2026,2,1), unlock:new Date(2026,5,8),
    message:'You were terrified the day you wrote this. Remember: the fear was never a sign to stop. It was a sign that it mattered. Trust the version of you who chose courage.' },
  { id:'v3', title:'A promise about my health', created:new Date(2026,4,20), unlock:new Date(2026,7,20),
    message:'Ninety days of showing up. Whatever the scale or the mirror says, notice how much calmer your mind feels. That was always the real goal.' },
  { id:'v4', title:'Letter from last winter', created:new Date(2025,11,25), unlock:new Date(2026,4,25), opened:true,
    message:'When the days were shortest, you still lit a candle every morning and named one thing you were grateful for. Carry that light into the warm months. You earned this quiet.' },
];

// ── Reusable lock illustration (concentric rings + padlock) ─────────
function LockArt({ size=176, open=false, pulse=true }) {
  const inner = Math.round(size*0.46);
  return (
    <div style={{ position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <div style={{ position:'absolute', left:'50%', top:'50%', width:size*1.25, height:size*1.25, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, var(--md-accent-tint), transparent 66%)',
        transform:'translate(-50%,-50%)', animation: pulse?'md-seal-glow 6s ease-in-out infinite':'none' }} />
      {[1,.76,.54].map((s,i)=>(
        <div key={i} style={{ position:'absolute', width:size*s, height:size*s, borderRadius:'50%',
          border:'1px solid var(--md-accent)', opacity:.22 - i*.05 }} />
      ))}
      <div style={{ width:inner, height:inner, borderRadius:'50%', background:'var(--md-accent)', color:'var(--md-on-accent)',
        display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 16px 40px var(--md-accent-tint)' }}>
        <Icon name={open?'unlock':'lock'} size={inner*0.5} stroke={1.7} />
      </div>
    </div>
  );
}

// ── State pill ──────────────────────────────────────────────────────
const MD_VAULT_META = {
  locked: { label:'Sealed',        icon:'lock' },
  soon:   { label:'Opens soon',    icon:'lock' },
  ready:  { label:'Ready to open', icon:'unlock' },
  opened: { label:'Opened',        icon:'mail' },
};
function StatePill({ state }) {
  const m = MD_VAULT_META[state];
  const accent = state==='ready';
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px 5px 9px', borderRadius:20,
      background: accent?'var(--md-accent)':'var(--md-bg2)', color: accent?'var(--md-on-accent)':'var(--md-text2)',
      fontSize:11, fontWeight:500, letterSpacing:.4 }}>
      <Icon name={m.icon} size={13} stroke={1.9} /> {m.label}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 1 · VAULT LIST
// ════════════════════════════════════════════════════════════════════
// ── Mesh gradient background (test) ────────────────────────────────
function VaultMeshBg() {
  return (
    <div aria-hidden style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      {/* SVG noise grain layer */}
      <svg width="0" height="0" style={{ position:'absolute' }}>
        <filter id="vault-noise"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      </svg>
      {/* blob 1 — warm gold, top-right */}
      <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', top:-80, right:-60,
        background:'radial-gradient(circle, color-mix(in srgb, var(--md-accent) 38%, transparent), transparent 68%)',
        filter:'blur(48px)' }} />
      {/* blob 2 — soft cream, mid-left */}
      <div style={{ position:'absolute', width:280, height:280, borderRadius:'50%', top:'35%', left:-80,
        background:'radial-gradient(circle, color-mix(in srgb, var(--md-gold, #D6A87A) 28%, transparent), transparent 68%)',
        filter:'blur(56px)' }} />
      {/* blob 3 — accent tint, bottom-center */}
      <div style={{ position:'absolute', width:360, height:260, borderRadius:'50%', bottom:-60, left:'50%', transform:'translateX(-50%)',
        background:'radial-gradient(circle, color-mix(in srgb, var(--md-accent) 22%, transparent), transparent 68%)',
        filter:'blur(52px)' }} />
      {/* noise texture overlay */}
      <div style={{ position:'absolute', inset:0, opacity:.045,
        background:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
        backgroundRepeat:'repeat' }} />
    </div>
  );
}

function VaultListScreen({ vaults=MD_VAULTS, onCreate, onOpenVault }) {
  const ready = vaults.filter(v=>mdVaultState(v)==='ready').length;
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', position:'relative' }}>
      <VaultMeshBg />
      <StatusBar />
      <div style={{ flex:1, overflow:'hidden', padding:'8px 24px 100px', position:'relative', zIndex:1 }}>
        <CornerMascot name="rest" size={96} opacity={.8} style={{ top:0, right:6 }} />
        <div className="md-serif" style={{ fontSize:34, color:'var(--md-text)', letterSpacing:-.5 }}>The Vault</div>
        <div style={{ fontSize:15, color:'var(--md-text2)', marginTop:4, marginBottom:22, maxWidth:260 }}>Sealed messages to the person you’re becoming.</div>

        {ready>0 && (
          <div style={{ display:'flex', alignItems:'center', gap:11, background:'var(--md-accent-tint)', borderRadius:18, padding:'13px 15px', marginBottom:16 }}>
            <Icon name="sparkle" size={20} style={{ color:'var(--md-accent)' }} />
            <div style={{ fontSize:13.5, color:'var(--md-text)', lineHeight:1.4 }}>{ready===1?'A vault is ready to open.':`${ready} vaults are ready to open.`}</div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
          {vaults.map((v,i)=>(
            <div key={v.id} style={{ animation:`md-card-in .5s ease both`, animationDelay:`${i*0.06}s` }}>
              <VaultCard v={v} onClick={()=>onOpenVault&&onOpenVault(v)} />
            </div>
          ))}
        </div>
      </div>

      <button className="md-press" onClick={onCreate} style={{ position:'absolute', right:22, bottom:106, zIndex:18,
        height:54, paddingLeft:18, paddingRight:22, borderRadius:27, border:'none', cursor:'pointer',
        background:'var(--md-accent)', color:'var(--md-on-accent)', display:'flex', alignItems:'center', gap:9,
        fontFamily:'DM Sans,sans-serif', fontSize:15.5, fontWeight:500, boxShadow:'0 10px 28px var(--md-accent-tint)' }}>
        <Icon name="feather" size={20} stroke={1.9} /> New vault
      </button>
    </div>
  );
}

function VaultCard({ v, onClick }) {
  const state = mdVaultState(v);
  const dl = mdDaysLeft(v.unlock);
  const pct = mdProgress(v);
  const locked = state==='locked' || state==='soon';
  return (
    <button className="md-press" onClick={onClick} style={{ width:'100%', textAlign:'left', cursor:'pointer',
      borderRadius:24, padding:'18px 18px 16px', fontFamily:'DM Sans,sans-serif',
      border:'1px solid '+(state==='ready'?'var(--md-accent)':'var(--md-border)'),
      background: state==='ready' ? 'linear-gradient(168deg, color-mix(in srgb, var(--md-accent-tint) 40%, var(--md-card)), var(--md-card) 55%)' : 'var(--md-card)',
      boxShadow:'var(--md-shadow)', position:'relative', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:13 }}>
        <div style={{ width:40, height:40, borderRadius:13, background: state==='opened'?'var(--md-bg2)':'var(--md-accent-tint)',
          color:'var(--md-accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name={state==='locked'||state==='soon'?'lock':'mail'} size={20} stroke={1.8} />
        </div>
        <StatePill state={state} />
      </div>

      <div className="md-serif" style={{ fontSize:20, color:'var(--md-text)', letterSpacing:-.2, lineHeight:1.25, textWrap:'pretty' }}>{v.title}</div>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:10, fontSize:12.5, color:'var(--md-text2)' }}>
        <Icon name="calendar" size={14} stroke={1.7} />
        <span>Sealed {mdFmt(v.created)}</span>
        <Icon name="arrowR" size={14} stroke={1.7} style={{ opacity:.6 }} />
        <span>{mdFmt(v.unlock)}</span>
      </div>

      <div style={{ height:1, background:'var(--md-border)', margin:'14px 0 13px' }} />

      {locked ? (
        <div>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:9 }}>
            <span style={{ fontSize:13, color:'var(--md-text2)' }}>{state==='soon'?'Opens soon':'Time remaining'}</span>
            <span style={{ display:'flex', alignItems:'baseline', gap:5, color:'var(--md-text)' }}>
              <span className="md-serif" style={{ fontSize:22, lineHeight:1 }}>{dl}</span>
              <span style={{ fontSize:12.5, color:'var(--md-text2)' }}>{dl===1?'day':'days'}</span>
            </span>
          </div>
          <div style={{ height:5, borderRadius:3, background:'var(--md-bg2)', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct*100}%`, borderRadius:3, background:'var(--md-accent)', opacity:state==='soon'?1:.85 }} />
          </div>
        </div>
      ) : state==='ready' ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--md-accent)', fontSize:14, fontWeight:500 }}>
          <Icon name="sparkle" size={17} /> Tap to open your message
        </div>
      ) : (
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--md-text2)', fontSize:13.5 }}>
          <Icon name="check" size={16} stroke={2} /> Opened {mdFmt(v.unlock)} · tap to reread
        </div>
      )}
    </button>
  );
}

// ── Empty state ─────────────────────────────────────────────────────
function VaultEmptyScreen({ onCreate }) {
  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <StatusBar />
      <div style={{ flex:1, padding:'8px 24px 100px', display:'flex', flexDirection:'column' }}>
        <div className="md-serif" style={{ fontSize:34, color:'var(--md-text)', letterSpacing:-.5 }}>The Vault</div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:0, paddingBottom:40 }}>
          <LockArt size={168} />
          <div className="md-serif" style={{ fontSize:25, color:'var(--md-text)', marginTop:30, letterSpacing:-.3 }}>Nothing sealed yet</div>
          <div style={{ fontSize:15, color:'var(--md-text2)', marginTop:10, lineHeight:1.55, maxWidth:280 }}>
            Write a message, intention, or promise — and lock it away for your future self to find.
          </div>
          <div style={{ width:230, marginTop:30 }}>
            <PrimaryButton icon="feather" onClick={onCreate}>Write your first</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MD_VAULTS, MD_TODAY, mdFmt, mdDaysLeft, mdVaultState, mdProgress, LockArt, StatePill, VaultCard, VaultListScreen, VaultEmptyScreen });
