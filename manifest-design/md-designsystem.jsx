// md-designsystem.jsx — Color, type, and component reference panels.

function DSPanel({ w=720, children, pad=36, bg='var(--md-card)' }) {
  return <div className="md" style={{ width:w, background:bg, color:'var(--md-text)', padding:pad, minHeight:60 }}>{children}</div>;
}
function DSLabel({ children }) { return <div style={{ fontSize:12, fontWeight:500, letterSpacing:1.8, textTransform:'uppercase', color:'var(--md-text2)', marginBottom:20 }}>{children}</div>; }

function Sw({ c, name, hex, ring }) {
  return <div style={{ width:96 }}>
    <div style={{ height:70, borderRadius:14, background:c, border:ring?'1px solid var(--md-border)':'none', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}/>
    <div style={{ fontSize:12.5, fontWeight:500, color:'var(--md-text)', marginTop:9 }}>{name}</div>
    <div style={{ fontSize:11, color:'var(--md-text2)', fontVariantNumeric:'tabular-nums', letterSpacing:.3 }}>{hex}</div>
  </div>;
}

function DSColors() {
  const light=[['Background','#FBF3E7',1],['Secondary','#F4EADB',1],['Cards','#FFFDF9',1],['Accent','#D6A87A'],['Text','#3A3028'],['Secondary','#7A6B5D'],['Border','#ECDFCE',1]];
  const dark=[['Background','#171210'],['Secondary','#211913'],['Cards','#29201A'],['Accent','#E0BB8C'],['Text','#F5EDE0'],['Secondary','#9A8B7D'],['Border','#382C22']];
  return <DSPanel w={760}>
    <DSLabel>Color · Cream Serenity</DSLabel>
    <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:34 }}>{light.map((s,i)=><Sw key={i} name={s[0]} hex={s[1]} c={s[1]} ring={s[2]}/>)}</div>
    <DSLabel>Color · Dark</DSLabel>
    <div style={{ display:'flex', gap:14, flexWrap:'wrap', background:'#171210', padding:18, borderRadius:16 }}>{dark.map((s,i)=><div key={i} style={{ width:96 }}><div style={{ height:70, borderRadius:14, background:s[1], border:'1px solid #382C22' }}/><div style={{ fontSize:12.5, fontWeight:500, color:'#F5EDE0', marginTop:9 }}>{s[0]}</div><div style={{ fontSize:11, color:'#9A8B7D' }}>{s[1]}</div></div>)}</div>
  </DSPanel>;
}

function DSType() {
  return <DSPanel w={720}>
    <DSLabel>Typography · DM Serif Display + DM Sans</DSLabel>
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <Spec note="DM Serif Display · Italic · 27px — affirmations"><span className="md-serif" style={{ fontStyle:'italic', fontSize:27, color:'var(--md-text)' }}>I am becoming the person I aspire to be.</span></Spec>
      <Spec note="H1 · DM Sans · 34 / 400"><span style={{ fontSize:34, fontWeight:400, color:'var(--md-text)', letterSpacing:-.5 }}>Affirm the life you imagine</span></Spec>
      <Spec note="H2 · DM Sans · 26 / 400"><span style={{ fontSize:26, fontWeight:400, color:'var(--md-text)', letterSpacing:-.3 }}>Choose a length, settle in</span></Spec>
      <Spec note="H3 · DM Sans · 20 / 500"><span style={{ fontSize:20, fontWeight:500, color:'var(--md-text)' }}>Breathing reset</span></Spec>
      <Spec note="Body · DM Sans · 16 / 400 · 1.7"><span style={{ fontSize:16, fontWeight:400, lineHeight:1.7, color:'var(--md-text)' }}>A daily ritual of affirmations, focus, and breath — calm, sophisticated, never preachy.</span></Spec>
      <Spec note="Weights · 300 / 400 / 500 only"><span style={{ fontSize:18, color:'var(--md-text)' }}><span style={{ fontWeight:300 }}>Light </span><span style={{ fontWeight:400 }}>Regular </span><span style={{ fontWeight:500 }}>Medium</span></span></Spec>
    </div>
  </DSPanel>;
}
function Spec({ note, children }) {
  return <div style={{ display:'flex', alignItems:'baseline', gap:24 }}>
    <div style={{ width:230, flexShrink:0, fontSize:11.5, color:'var(--md-text2)', letterSpacing:.3 }}>{note}</div>
    <div style={{ flex:1 }}>{children}</div>
  </div>;
}

function DSComponents() {
  const [s,setS]=React.useState('rain');
  return <DSPanel w={760}>
    <DSLabel>Components</DSLabel>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:30 }}>
      <div>
        <Mini t="Buttons"/>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}><PrimaryButton icon="arrowR">Get started</PrimaryButton><GhostButton>Not now</GhostButton></div>
      </div>
      <div>
        <Mini t="Streak & stats"/>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}><StreakChip n={12}/><div style={{ flex:1 }}><StatTile value="61.5" label="Focus hours" icon="clock"/></div></div>
      </div>
      <div>
        <Mini t="Affirmation actions"/>
        <div style={{ display:'flex', gap:10 }}><ActionPill icon="heart" active accent/><ActionPill icon="bookmark"/><ActionPill icon="share"/></div>
      </div>
      <div>
        <Mini t="Ambient sounds"/>
        <div style={{ display:'flex', gap:10 }}>{MD_SOUNDS.map(x=><SoundChip key={x.id} label={x.label} icon={x.icon} on={s===x.id} onClick={()=>setS(x.id)}/>)}</div>
      </div>
      <div style={{ gridColumn:'1 / -1' }}>
        <Mini t="Tab bar"/>
        <div style={{ position:'relative', height:88, borderRadius:18, overflow:'hidden', border:'1px solid var(--md-border)', background:'var(--md-bg)' }}><TabBar active="home"/></div>
      </div>
    </div>
  </DSPanel>;
}
function Mini({ t }) { return <div style={{ fontSize:13, fontWeight:500, color:'var(--md-text)', marginBottom:14 }}>{t}</div>; }

Object.assign(window, { DSColors, DSType, DSComponents });
