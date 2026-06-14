// md-widgets.jsx — Home screen widgets (S/M/L) + Lock screen widgets (circular/rect/action).

function Wall({ children, w, h, lock }) {
  const bg = lock
    ? 'linear-gradient(165deg, #2a2018 0%, #4a3a28 45%, #b89668 100%)'
    : 'linear-gradient(165deg, #f3e6d2 0%, #e8d3b6 55%, #d9bd95 100%)';
  return <div className="md" style={{ width:w, height:h, background:bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:26, position:'relative', overflow:'hidden' }}>{children}</div>;
}
const wShadow = '0 10px 30px rgba(58,48,40,.18)';

function WGCard({ w, h, children, pad=18 }) {
  return <div style={{ width:w, height:h, borderRadius:24, background:'#FFFDF9', boxShadow:wShadow, padding:pad, position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>{children}</div>;
}

// ── HOME WIDGETS ────────────────────────────────────────────────────
function WidgetSmall() {
  return <Wall w={230} h={230}>
    <WGCard w={158} h={158}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <LogoMark size={22} radius={7}/>
        <Icon name="heart" size={14} style={{ color:'#DDB98A' }}/>
      </div>
      <div className="md-serif" style={{ fontStyle:'italic', fontSize:16.5, lineHeight:1.3, color:'#3A3028', marginTop:'auto' }}>I am becoming who I aspire to be.</div>
    </WGCard>
  </Wall>;
}
function WidgetMedium() {
  return <Wall w={410} h={230}>
    <WGCard w={338} h={158} pad={20}>
      <div style={{ display:'flex', height:'100%', gap:18 }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:10, letterSpacing:1.5, color:'#7A6B5D', textTransform:'uppercase' }}>Today</div>
          <div className="md-serif" style={{ fontStyle:'italic', fontSize:20, lineHeight:1.3, color:'#3A3028', marginTop:'auto' }}>My confidence grows with every quiet step.</div>
        </div>
        <div style={{ width:1, background:'#EFE3D4' }}/>
        <div style={{ width:74, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4 }}>
          <Icon name="flame" size={28} fill="#F2A65A" stroke={0}/>
          <div className="md-serif" style={{ fontSize:30, color:'#3A3028', lineHeight:1 }}>12</div>
          <div style={{ fontSize:11, color:'#7A6B5D' }}>day streak</div>
        </div>
      </div>
    </WGCard>
  </Wall>;
}
function WidgetLarge() {
  return <Wall w={410} h={420}>
    <WGCard w={338} h={354} pad={22}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}><LogoMark size={26} radius={8}/><span style={{ fontSize:13, fontWeight:500, color:'#3A3028' }}>ManifestDaily</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:'#F8F1E6', padding:'5px 10px', borderRadius:14 }}><Icon name="flame" size={15} fill="#F2A65A" stroke={0}/><span style={{ fontSize:13, fontWeight:500, color:'#3A3028' }}>12</span></div>
      </div>
      <div style={{ fontSize:10, letterSpacing:1.5, color:'#7A6B5D', textTransform:'uppercase', marginBottom:8 }}>Confidence</div>
      <div className="md-serif" style={{ fontStyle:'italic', fontSize:27, lineHeight:1.32, color:'#3A3028' }}>I trust myself to handle whatever comes.</div>
      <div style={{ marginTop:'auto', display:'flex', gap:10 }}>
        <div style={{ flex:1, background:'#DDB98A', color:'#3A3028', borderRadius:15, padding:'13px 0', textAlign:'center', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}><Icon name="focus" size={17}/> Focus</div>
        <div style={{ flex:1, background:'#F8F1E6', color:'#3A3028', borderRadius:15, padding:'13px 0', textAlign:'center', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}><Icon name="wind" size={17}/> Breathe</div>
      </div>
    </WGCard>
  </Wall>;
}

// ── LOCK SCREEN WIDGETS ─────────────────────────────────────────────
function LockClock() {
  return <div style={{ textAlign:'center', color:'#FFFDF9', marginBottom:26 }}>
    <div style={{ fontSize:15, fontWeight:500, opacity:.9 }}>Saturday, 31 May</div>
    <div style={{ fontSize:74, fontWeight:300, lineHeight:1, letterSpacing:-1, marginTop:2 }}>9:41</div>
  </div>;
}
function LockCircular() {
  const R=30,C=2*Math.PI*R,p=.62;
  return <Wall w={250} h={250} lock>
    <LockClock/>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ position:'relative', width:76, height:76 }}>
        <svg width="76" height="76" style={{ transform:'rotate(-90deg)' }}><circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,253,249,.25)" strokeWidth="6"/><circle cx="38" cy="38" r={R} fill="none" stroke="#FFFDF9" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-p)}/></svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#FFFDF9' }}><Icon name="flame" size={18} fill="#FFFDF9" stroke={0}/><span style={{ fontSize:17, fontWeight:500, lineHeight:1 }}>12</span></div>
      </div>
      <span style={{ fontSize:12, color:'rgba(255,253,249,.85)' }}>streak</span>
    </div>
  </Wall>;
}
function LockRect() {
  return <Wall w={340} h={230} lock>
    <LockClock/>
    <div style={{ width:200, background:'rgba(255,253,249,.16)', backdropFilter:'blur(6px)', borderRadius:16, padding:'13px 16px', color:'#FFFDF9' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:9 }}><Icon name="focus" size={16}/><span style={{ fontSize:12.5, opacity:.9 }}>Focus today</span><span style={{ marginLeft:'auto', fontSize:15, fontWeight:500 }}>42<span style={{ fontSize:11, opacity:.8 }}>m</span></span></div>
      <div style={{ height:6, borderRadius:3, background:'rgba(255,253,249,.25)', overflow:'hidden' }}><div style={{ width:'62%', height:'100%', borderRadius:3, background:'#FFFDF9' }}/></div>
      <div style={{ fontSize:10.5, opacity:.7, marginTop:7 }}>Goal · 60 min</div>
    </div>
  </Wall>;
}
function LockAction() {
  return <Wall w={250} h={250} lock>
    <LockClock/>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ width:76, height:76, borderRadius:38, background:'rgba(255,253,249,.92)', display:'flex', alignItems:'center', justifyContent:'center', color:'#3A3028', boxShadow:'0 6px 20px rgba(0,0,0,.25)' }}><Icon name="play" size={30}/></div>
      <span style={{ fontSize:12, color:'rgba(255,253,249,.85)' }}>Start focus</span>
    </div>
  </Wall>;
}

Object.assign(window, { WidgetSmall, WidgetMedium, WidgetLarge, LockCircular, LockRect, LockAction });
